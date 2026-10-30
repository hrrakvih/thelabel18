// app/admin/pos/register/actions.ts
'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type ScannedItem = {
  variationId: string
  productId: string
  sku: string
  productName: string
  size: string | null
  color: string | null
  imageUrl: string | null
  price: number
  stockQuantity: number
}

function mapRow(d: any): ScannedItem {
  const product = Array.isArray(d.product) ? d.product[0] : d.product
  return {
    variationId: d.id,
    productId: product.id,
    sku: d.sku,
    productName: product.name,
    size: d.size,
    color: d.color,
    imageUrl: d.image_url || product.image_url,
    price: Number(d.price),
    stockQuantity: d.stock_quantity,
  }
}

// Initial catalog shown on page load, before any scan/search happens.
export async function listAllVariations(): Promise<ScannedItem[]> {
  const { data, error } = await supabase
    .from('product_variations')
    .select(
      `
      id, sku, size, color, image_url, price, stock_quantity,
      product:products ( id, name, image_url )
    `
    )
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('listAllVariations error:', error.message)
    return []
  }
  if (!data) return []

  return data.filter((d) => d.product).map(mapRow)
}

// Called when the barcode scanner "types" a SKU + Enter into the scan input.
export async function findVariationBySku(sku: string): Promise<ScannedItem | null> {
  const { data, error } = await supabase
    .from('product_variations')
    .select(
      `
      id, sku, size, color, image_url, price, stock_quantity,
      product:products ( id, name, image_url )
    `
    )
    .eq('sku', sku.trim())
    .maybeSingle()

  if (error) {
    console.error('findVariationBySku error:', error.message)
    return null
  }
  if (!data || !data.product) return null

  return mapRow(data)
}

// Fallback manual search by product name or SKU fragment.
// Runs two separate, simple queries instead of a single OR-across-tables
// query, which PostgREST does not reliably support.
export async function searchVariations(query: string): Promise<ScannedItem[]> {
  const q = query.trim()
  if (!q) return []

  const bySku = supabase
    .from('product_variations')
    .select(
      `
      id, sku, size, color, image_url, price, stock_quantity,
      product:products ( id, name, image_url )
    `
    )
    .ilike('sku', `%${q}%`)
    .limit(8)

  const matchingProducts = await supabase
    .from('products')
    .select('id')
    .ilike('name', `%${q}%`)
    .limit(20)

  const [skuResult, productIdsResult] = await Promise.all([bySku, matchingProducts])

  if (skuResult.error) console.error('searchVariations (sku) error:', skuResult.error.message)
  if (productIdsResult.error)
    console.error('searchVariations (product name) error:', productIdsResult.error.message)

  const results: ScannedItem[] = (skuResult.data ?? [])
    .filter((d) => d.product)
    .map(mapRow)

  const productIds = (productIdsResult.data ?? []).map((p) => p.id)

  if (productIds.length > 0) {
    const { data: byName, error: byNameError } = await supabase
      .from('product_variations')
      .select(
        `
        id, sku, size, color, image_url, price, stock_quantity,
        product:products ( id, name, image_url )
      `
      )
      .in('product_id', productIds)
      .limit(8)

    if (byNameError) console.error('searchVariations (by product_id) error:', byNameError.message)

    for (const row of byName ?? []) {
      if (row.product && !results.some((r) => r.variationId === row.id)) {
        results.push(mapRow(row))
      }
    }
  }

  return results.slice(0, 8)
}

export type CartLine = {
  variationId: string
  productId: string
  sku: string
  productName: string
  size: string | null
  color: string | null
  price: number
  quantity: number
}

export async function checkout(params: {
  cart: CartLine[]
  discount: number
  paymentMethod: 'cash' | 'card' | 'upi'
  cashierName?: string
}) {
  const { cart, discount, paymentMethod, cashierName } = params
  if (cart.length === 0) throw new Error('Cart is empty')

  const subtotal = cart.reduce((sum, l) => sum + l.price * l.quantity, 0)
  const total = Math.max(0, subtotal - discount)
  const orderNumber = `POS-${Date.now().toString().slice(-8)}`

  const { data: order, error } = await supabase
    .from('pos_orders')
    .insert({
      order_number: orderNumber,
      subtotal,
      discount,
      tax: 0,
      total,
      payment_method: paymentMethod,
      cashier_name: cashierName || null,
    })
    .select('id, order_number')
    .single()

  if (error) throw new Error(error.message)

  try {
    const items = cart.map((l) => ({
      pos_order_id: order.id,
      product_id: l.productId,
      variation_id: l.variationId,
      sku: l.sku || `VAR-${l.variationId.slice(0, 8).toUpperCase()}`,
      product_name: l.productName,
      size: l.size,
      color: l.color,
      unit_price: l.price,
      quantity: l.quantity,
      line_total: l.price * l.quantity,
    }))

    const { error: itemsError } = await supabase.from('pos_order_items').insert(items)
    if (itemsError) throw new Error(itemsError.message)

    for (const line of cart) {
      if (!line.sku) {
        const fallback = `VAR-${line.variationId.slice(0, 8).toUpperCase()}`
        await supabase
          .from('product_variations')
          .update({ sku: fallback })
          .eq('id', line.variationId)
          .is('sku', null)
      }
    }

    for (const line of cart) {
      const { data: current } = await supabase
        .from('product_variations')
        .select('stock_quantity')
        .eq('id', line.variationId)
        .single()

      if (current) {
        await supabase
          .from('product_variations')
          .update({ stock_quantity: Math.max(0, current.stock_quantity - line.quantity) })
          .eq('id', line.variationId)
      }
    }
  } catch (err) {
    // Something after order creation failed — delete the empty order
    // instead of leaving a ghost row with no items behind.
    await supabase.from('pos_orders').delete().eq('id', order.id)
    throw err
  }

  return { orderNumber: order.order_number }
}