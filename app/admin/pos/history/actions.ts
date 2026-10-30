'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type ExchangeCandidate = {
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

function mapRow(d: any): ExchangeCandidate {
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

// Search for a replacement product/variation when exchanging an item.
export async function searchExchangeCandidates(query: string): Promise<ExchangeCandidate[]> {
  const q = query.trim()
  if (!q) return []

  const bySku = supabase
    .from('product_variations')
    .select(
      `id, sku, size, color, image_url, price, stock_quantity, product:products ( id, name, image_url )`
    )
    .ilike('sku', `%${q}%`)
    .limit(8)

  const matchingProducts = await supabase
    .from('products')
    .select('id')
    .ilike('name', `%${q}%`)
    .limit(20)

  const [skuResult, productIdsResult] = await Promise.all([bySku, matchingProducts])

  if (skuResult.error) console.error('searchExchangeCandidates (sku) error:', skuResult.error.message)
  if (productIdsResult.error)
    console.error('searchExchangeCandidates (product name) error:', productIdsResult.error.message)

  const results: ExchangeCandidate[] = (skuResult.data ?? []).filter((d) => d.product).map(mapRow)

  const productIds = (productIdsResult.data ?? []).map((p) => p.id)

  if (productIds.length > 0) {
    const { data: byName, error: byNameError } = await supabase
      .from('product_variations')
      .select(
        `id, sku, size, color, image_url, price, stock_quantity, product:products ( id, name, image_url )`
      )
      .in('product_id', productIds)
      .limit(8)

    if (byNameError) console.error('searchExchangeCandidates (by product_id) error:', byNameError.message)

    for (const row of byName ?? []) {
      if (row.product && !results.some((r) => r.variationId === row.id)) {
        results.push(mapRow(row))
      }
    }
  }

  return results.slice(0, 8)
}

export async function exchangeOrderItem(params: {
  orderId: string
  orderItemId: string
  oldVariationId: string
  oldQuantity: number
  newVariation: ExchangeCandidate
  newQuantity: number
}) {
  const { orderId, orderItemId, oldVariationId, oldQuantity, newVariation, newQuantity } = params

  if (newQuantity <= 0) throw new Error('Quantity must be at least 1')
  if (newVariation.stockQuantity < newQuantity) {
    throw new Error(`Only ${newVariation.stockQuantity} in stock for ${newVariation.productName}`)
  }

  const { data: item, error: itemError } = await supabase
    .from('pos_order_items')
    .select('id, line_total')
    .eq('id', orderItemId)
    .single()
  if (itemError || !item) throw new Error(itemError?.message || 'Order item not found')

  const { data: order, error: orderError } = await supabase
    .from('pos_orders')
    .select('id, subtotal, total, discount')
    .eq('id', orderId)
    .single()
  if (orderError || !order) throw new Error(orderError?.message || 'Order not found')

  const newLineTotal = newVariation.price * newQuantity
  const oldLineTotal = Number(item.line_total)
  const newSubtotal = Number(order.subtotal) - oldLineTotal + newLineTotal
  const newTotal = Math.max(0, newSubtotal - Number(order.discount))

  // 1. Swap the item on the order to the new product/variation
  const { error: updateItemError } = await supabase
    .from('pos_order_items')
    .update({
      product_id: newVariation.productId,
      variation_id: newVariation.variationId,
      sku: newVariation.sku || `VAR-${newVariation.variationId.slice(0, 8).toUpperCase()}`,
      product_name: newVariation.productName,
      size: newVariation.size,
      color: newVariation.color,
      unit_price: newVariation.price,
      quantity: newQuantity,
      line_total: newLineTotal,
    })
    .eq('id', orderItemId)
  if (updateItemError) throw new Error(updateItemError.message)

  // 2. Recompute the order's totals to reflect the swap
  const { error: updateOrderError } = await supabase
    .from('pos_orders')
    .update({ subtotal: newSubtotal, total: newTotal })
    .eq('id', orderId)
  if (updateOrderError) throw new Error(updateOrderError.message)

  // 3. Restock the returned item
  const { data: oldVar } = await supabase
    .from('product_variations')
    .select('stock_quantity')
    .eq('id', oldVariationId)
    .single()
  if (oldVar) {
    await supabase
      .from('product_variations')
      .update({ stock_quantity: oldVar.stock_quantity + oldQuantity })
      .eq('id', oldVariationId)
  }

  // 4. Deduct stock for the new item going out
  await supabase
    .from('product_variations')
    .update({ stock_quantity: Math.max(0, newVariation.stockQuantity - newQuantity) })
    .eq('id', newVariation.variationId)

  revalidatePath('/admin/pos/history')

  return { success: true }
}