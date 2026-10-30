'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type CategoryReportRow = {
  categoryId: string | null
  categoryName: string
  orderCount: number
  itemCount: number
  revenue: number
}

export type TopProductRow = {
  productId: string
  name: string
  unitsSold: number
  revenue: number
}

export type ChannelSummary = {
  onlineRevenue: number
  onlineOrders: number
  posRevenue: number
  posOrders: number
  totalRevenue: number
  totalOrders: number
  totalUnits: number
  avgOrderValue: number
}

export type ComprehensiveReport = {
  summary: ChannelSummary
  categories: CategoryReportRow[]
  topProducts: TopProductRow[]
}

export async function getComprehensiveReport(
  startISO: string,
  endISO: string
): Promise<ComprehensiveReport> {
  try {
    // 1. Fetch Online Orders in range
    const { data: onlineOrders } = await supabase
      .from('orders')
      .select('id, total, status, created_at')
      .gte('created_at', startISO)
      .lte('created_at', endISO)
      .neq('status', 'cancelled')
      .or('payment_status.is.null,payment_status.eq.paid')

    const onlineOrderIds = (onlineOrders ?? []).map((o) => o.id)

    // 2. Fetch Online Order Items
    let onlineItems: any[] = []
    if (onlineOrderIds.length > 0) {
      const { data: oItems } = await supabase
        .from('order_items')
        .select(
          `
          order_id, quantity, line_total, product_id, product_name,
          product:products ( id, name, category_id, category:categories ( id, name ) )
        `
        )
        .in('order_id', onlineOrderIds)
      onlineItems = oItems ?? []
    }

    // 3. Fetch POS Orders in range
    const { data: posOrders } = await supabase
      .from('pos_orders')
      .select('id, total, status, created_at')
      .gte('created_at', startISO)
      .lte('created_at', endISO)
      .neq('status', 'cancelled')

    const posOrderIds = (posOrders ?? []).map((o) => o.id)

    // 4. Fetch POS Order Items
    let posItems: any[] = []
    if (posOrderIds.length > 0) {
      const { data: pItems } = await supabase
        .from('pos_order_items')
        .select(
          `
          pos_order_id, quantity, line_total, product_id, product_name,
          product:products ( id, name, category_id, category:categories ( id, name ) )
        `
        )
        .in('pos_order_id', posOrderIds)
      posItems = pItems ?? []
    }

    // Calculate Summaries
    const onlineRevenue = (onlineOrders ?? []).reduce((s, o) => s + (Number(o.total) || 0), 0)
    const posRevenue = (posOrders ?? []).reduce((s, o) => s + (Number(o.total) || 0), 0)
    const totalRevenue = onlineRevenue + posRevenue
    const totalOrders = (onlineOrders?.length || 0) + (posOrders?.length || 0)
    const totalUnits =
      onlineItems.reduce((s, i) => s + (Number(i.quantity) || 0), 0) +
      posItems.reduce((s, i) => s + (Number(i.quantity) || 0), 0)
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0

    // Aggregate by Category
    const categoryMap = new Map<
      string,
      { name: string; orderIds: Set<string>; itemCount: number; revenue: number }
    >()

    const processItem = (item: any, orderId: string) => {
      const product = Array.isArray(item.product) ? item.product[0] : item.product
      const category = product?.category
        ? Array.isArray(product.category)
          ? product.category[0]
          : product.category
        : null

      const key = category?.id ?? 'uncategorized'
      const name = category?.name ?? 'Uncategorized'

      if (!categoryMap.has(key)) {
        categoryMap.set(key, { name, orderIds: new Set(), itemCount: 0, revenue: 0 })
      }
      const catBucket = categoryMap.get(key)!
      catBucket.orderIds.add(orderId)
      catBucket.itemCount += Number(item.quantity) || 1
      catBucket.revenue += Number(item.line_total) || 0
    }

    for (const item of onlineItems) {
      processItem(item, item.order_id)
    }
    for (const item of posItems) {
      processItem(item, item.pos_order_id)
    }

    const categoriesReport: CategoryReportRow[] = Array.from(categoryMap.entries())
      .map(([id, b]) => ({
        categoryId: id === 'uncategorized' ? null : id,
        categoryName: b.name,
        orderCount: b.orderIds.size,
        itemCount: b.itemCount,
        revenue: b.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)

    // Aggregate Top Products
    const productMap = new Map<string, { name: string; units: number; revenue: number }>()

    const processProductItem = (item: any) => {
      const prodId = item.product_id || item.product?.id || 'unknown'
      const prodName = item.product_name || item.product?.name || 'Product'
      if (!productMap.has(prodId)) {
        productMap.set(prodId, { name: prodName, units: 0, revenue: 0 })
      }
      const p = productMap.get(prodId)!
      p.units += Number(item.quantity) || 1
      p.revenue += Number(item.line_total) || 0
    }

    for (const item of onlineItems) {
      processProductItem(item)
    }
    for (const item of posItems) {
      processProductItem(item)
    }

    const topProducts: TopProductRow[] = Array.from(productMap.entries())
      .map(([id, p]) => ({
        productId: id,
        name: p.name,
        unitsSold: p.units,
        revenue: p.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)

    return {
      summary: {
        onlineRevenue,
        onlineOrders: onlineOrders?.length || 0,
        posRevenue,
        posOrders: posOrders?.length || 0,
        totalRevenue,
        totalOrders,
        totalUnits,
        avgOrderValue,
      },
      categories: categoriesReport,
      topProducts,
    }
  } catch (err) {
    console.error('Error generating report:', err)
    return {
      summary: {
        onlineRevenue: 0,
        onlineOrders: 0,
        posRevenue: 0,
        posOrders: 0,
        totalRevenue: 0,
        totalOrders: 0,
        totalUnits: 0,
        avgOrderValue: 0,
      },
      categories: [],
      topProducts: [],
    }
  }
}