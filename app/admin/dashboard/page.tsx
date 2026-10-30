import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import {
  IndianRupee,
  ShoppingBag,
  Package,
  Layers,
  ArrowUpRight,
  Plus,
  Ticket,
  AlertTriangle,
  Store,
  Globe,
  TrendingUp,
  CreditCard,
  BarChart3,
  Gem,
  Shirt,
  Crown
} from 'lucide-react'
import { getComprehensiveReport, CategoryReportRow } from '../reports/actions'

export const dynamic = 'force-dynamic'


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type DashboardData = {
  totalRevenue: number
  totalOrdersCount: number
  onlineOrdersCount: number
  posOrdersCount: number
  onlineRevenue: number
  posRevenue: number
  totalProductsCount: number
  totalCategoriesCount: number
  lowStockItems: Array<{
    id: string
    productName: string
    color: string | null
    size: string | null
    stock: number
    price: number
    sku: string | null
  }>
  recentOrders: Array<{
    id: string
    orderNumber: string
    customer: string
    type: 'Online' | 'POS'
    amount: number
    status: string
    date: string
    itemsCount: number
  }>
  categoryBreakdown: Array<{
    id: string
    name: string
    count: number
  }>
  topCategories: CategoryReportRow[]
  jewelleryStats: CategoryReportRow | null
  clothingStats: CategoryReportRow | null
  topSellingCategory: CategoryReportRow | null
}

async function getDashboardData(): Promise<DashboardData> {
  try {
    const date30DaysAgo = new Date()
    date30DaysAgo.setDate(date30DaysAgo.getDate() - 30)
    const endIso = new Date().toISOString()
    const startIso = date30DaysAgo.toISOString()

    const [
      { data: onlineOrders },
      { data: posOrders },
      { count: productsCount },
      { data: categories },
      { data: lowStockRows },
      report
    ] = await Promise.all([
      supabase
        .from('orders')
        .select('id, total, status, ship_full_name, created_at, order_items(id)')
        .or('payment_status.is.null,payment_status.eq.paid')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('pos_orders')
        .select('id, order_number, total, status, cashier_name, payment_method, created_at, pos_order_items(id)')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('products')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('categories')
        .select('id, name, products(id)'),
      supabase
        .from('product_variations')
        .select('id, stock_quantity, price, color, size, sku, products(name)')
        .lte('stock_quantity', 5)
        .order('stock_quantity', { ascending: true })
        .limit(6),
      getComprehensiveReport(startIso, endIso)
    ])

    const onlineRev = (onlineOrders ?? []).reduce((sum, o) => sum + (Number(o.total) || 0), 0)
    const posRev = (posOrders ?? []).reduce((sum, o) => sum + (Number(o.total) || 0), 0)
    const totalRev = onlineRev + posRev

    const mappedOnlineOrders = (onlineOrders ?? []).slice(0, 10).map((o) => ({
      id: o.id,
      orderNumber: `#ONL-${o.id.slice(0, 6).toUpperCase()}`,
      customer: o.ship_full_name || 'Online Customer',
      type: 'Online' as const,
      amount: Number(o.total) || 0,
      status: o.status || 'placed',
      date: o.created_at,
      itemsCount: o.order_items?.length || 1,
    }))

    const mappedPosOrders = (posOrders ?? []).slice(0, 10).map((o) => ({
      id: o.id,
      orderNumber: o.order_number || `#POS-${o.id.slice(0, 6).toUpperCase()}`,
      customer: o.cashier_name ? `Counter (${o.cashier_name})` : 'In-Store POS',
      type: 'POS' as const,
      amount: Number(o.total) || 0,
      status: o.status || 'completed',
      date: o.created_at,
      itemsCount: o.pos_order_items?.length || 1,
    }))

    const allRecent = [...mappedOnlineOrders, ...mappedPosOrders]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8)

    const lowStock = (lowStockRows ?? []).map((row: any) => ({
      id: row.id,
      productName: Array.isArray(row.products) ? row.products[0]?.name : row.products?.name || 'Product',
      color: row.color,
      size: row.size,
      stock: row.stock_quantity,
      price: Number(row.price) || 0,
      sku: row.sku,
    }))

    const categoryStats = (categories ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      count: c.products?.length || 0,
    }))

    // 6. Fetch 30 day performance for top categories
    // (Already fetched in Promise.all)

    // Full (unsliced) category performance list, used to find specific categories
    // and the single top seller. Assumes report.categories is sorted by revenue desc.
    const allReportCategories = report.categories ?? []
    const jewelleryStats =
      allReportCategories.find((c) => /jewel/i.test(c.categoryName)) ?? null
    const clothingStats =
      allReportCategories.find((c) => /cloth/i.test(c.categoryName)) ?? null
    const topSellingCategory = allReportCategories[0] ?? null

    return {
      totalRevenue: totalRev,
      totalOrdersCount: (onlineOrders?.length || 0) + (posOrders?.length || 0),
      onlineOrdersCount: onlineOrders?.length || 0,
      posOrdersCount: posOrders?.length || 0,
      onlineRevenue: onlineRev,
      posRevenue: posRev,
      totalProductsCount: productsCount || 0,
      totalCategoriesCount: categories?.length || 0,
      lowStockItems: lowStock,
      recentOrders: allRecent,
      categoryBreakdown: categoryStats,
      topCategories: report.categories.slice(0, 5),
      jewelleryStats,
      clothingStats,
      topSellingCategory,
    }
  } catch (err) {
    console.error('Error loading dashboard data:', err)
    return {
      totalRevenue: 0,
      totalOrdersCount: 0,
      onlineOrdersCount: 0,
      posOrdersCount: 0,
      onlineRevenue: 0,
      posRevenue: 0,
      totalProductsCount: 0,
      totalCategoriesCount: 0,
      lowStockItems: [],
      recentOrders: [],
      categoryBreakdown: [],
      topCategories: [],
      jewelleryStats: null,
      clothingStats: null,
      topSellingCategory: null,
    }
  }
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStatusBadge(status: string) {
  const s = status.toLowerCase()
  if (s === 'delivered' || s === 'completed' || s === 'paid') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }
  if (s === 'shipped' || s === 'processing') {
    return 'bg-sky-50 text-sky-700 border-sky-200'
  }
  if (s === 'cancelled' || s === 'refunded') {
    return 'bg-rose-50 text-rose-700 border-rose-200'
  }
  return 'bg-amber-50 text-amber-800 border-amber-200'
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData()

  return (
    <div
      className="min-h-screen bg-[#FAF7F1] font-outfit text-[#141414] px-8 py-8 lg:px-10 lg:py-10"
      style={{ colorScheme: 'light' }}
    >
      {/* Top Header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#9C7D23]">
              Live Store Analytics
            </p>
          </div>
          <h1 className="mt-1 text-3xl font-normal tracking-tight text-[#141414]">
            Store <span className="text-[#9C7D23] font-medium">Dashboard</span>
          </h1>
          <p className="mt-1 text-xs text-stone-500">
            Real-time multi-channel overview across web boutique and retail POS.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/pos/register"
            className="flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs tracking-wider uppercase font-semibold text-stone-700 transition-all hover:bg-stone-50 hover:border-stone-400 shadow-sm"
          >
            <Store size={14} className="text-[#9C7D23]" />
            POS Register
          </Link>
          <Link
            href="/admin/coupons"
            className="flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs tracking-wider uppercase font-semibold text-stone-700 transition-all hover:bg-stone-50 hover:border-stone-400 shadow-sm"
          >
            <Ticket size={14} className="text-[#9C7D23]" />
            Coupons
          </Link>
          <Link
            href="/admin/products/add"
            className="flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-xs tracking-wider uppercase font-semibold text-white transition-all hover:bg-stone-800 active:scale-[0.99] shadow-md shadow-black/10"
          >
            <Plus size={15} strokeWidth={2.5} className="text-[#D4AF37]" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Unified 8-Card Stat Grid (4 Up, 4 Down perfectly structured) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 mb-8">
        {/* Card 1: Total Revenue */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm transition-all hover:border-[#9C7D23]/40">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#9C7D23]/20 bg-[#9C7D23]/10 text-[#9C7D23]">
              <IndianRupee size={20} strokeWidth={1.75} />
            </span>
            <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10.5px] font-medium text-emerald-700">
              <TrendingUp size={12} />
              Gross Sales
            </span>
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-stone-500">
            Total Revenue
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#141414]">
            ₹{data.totalRevenue.toLocaleString('en-IN')}
          </p>
          <div className="mt-3 flex items-center justify-between text-[11.5px] text-stone-500 border-t border-stone-100 pt-2.5">
            <span>Online: ₹{data.onlineRevenue.toLocaleString('en-IN')}</span>
            <span>POS: ₹{data.posRevenue.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Card 2: Web Orders */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm transition-all hover:border-[#9C7D23]/40">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#9C7D23]/20 bg-[#9C7D23]/10 text-[#9C7D23]">
              <ShoppingBag size={20} strokeWidth={1.75} />
            </span>
            <span className="flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10.5px] font-medium text-stone-600">
              <Globe size={11} /> Online
            </span>
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-stone-500">
            Web Orders
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#141414]">
            {data.onlineOrdersCount}
          </p>
          <div className="mt-3 flex items-center justify-between text-[11.5px] text-stone-500 border-t border-stone-100 pt-2.5">
            <span>Online Revenue</span>
            <span className="font-medium text-[#141414]">₹{data.onlineRevenue.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Card 3: Retail Orders */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm transition-all hover:border-[#9C7D23]/40">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#9C7D23]/20 bg-[#9C7D23]/10 text-[#9C7D23]">
              <Store size={20} strokeWidth={1.75} />
            </span>
            <span className="flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10.5px] font-medium text-purple-700">
              <CreditCard size={11} /> POS
            </span>
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-stone-500">
            Retail Orders
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#141414]">
            {data.posOrdersCount}
          </p>
          <div className="mt-3 flex items-center justify-between text-[11.5px] text-stone-500 border-t border-stone-100 pt-2.5">
            <span>POS Revenue</span>
            <span className="font-medium text-[#141414]">₹{data.posRevenue.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Card 4: Active Catalog Items */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm transition-all hover:border-[#9C7D23]/40">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#9C7D23]/20 bg-[#9C7D23]/10 text-[#9C7D23]">
              <Package size={20} strokeWidth={1.75} />
            </span>
            <Link
              href="/admin/products/list"
              className="text-[11.5px] font-semibold text-[#9C7D23] hover:underline flex items-center gap-0.5"
            >
              Catalog <ArrowUpRight size={12} />
            </Link>
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-stone-500">
            Active Catalog Items
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#141414]">
            {data.totalProductsCount} Products
          </p>
          <div className="mt-3 flex items-center justify-between text-[11.5px] text-stone-500 border-t border-stone-100 pt-2.5">
            <span>Across {data.totalCategoriesCount} Categories</span>
            <span className="text-emerald-600 font-medium">In Stock</span>
          </div>
        </div>

        {/* Card 5: Low Stock Alerts */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm transition-all hover:border-[#9C7D23]/40">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600">
              <AlertTriangle size={20} strokeWidth={1.75} />
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium border ${data.lowStockItems.length > 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
              {data.lowStockItems.length > 0 ? `${data.lowStockItems.length} Low Stock` : 'Stock Healthy'}
            </span>
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-stone-500">
            Inventory Watch
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#141414]">
            {data.lowStockItems.length} Items
          </p>
          <div className="mt-3 flex items-center justify-between text-[11.5px] text-stone-500 border-t border-stone-100 pt-2.5">
            <span>Needs restocking</span>
            <span className="text-rose-600 font-medium">&le; 5 units</span>
          </div>
        </div>

        {/* Card 6: Jewellery Sold */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm transition-all hover:border-[#9C7D23]/40">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#9C7D23]/20 bg-[#9C7D23]/10 text-[#9C7D23]">
              <Gem size={20} strokeWidth={1.75} />
            </span>
            <span className="text-[10.5px] font-medium text-stone-400 uppercase tracking-wider">
              Last 30 Days
            </span>
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-stone-500">
            Jewellery Sold
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#141414]">
            {data.jewelleryStats ? data.jewelleryStats.itemCount : 0} Units
          </p>
          <div className="mt-3 flex items-center justify-between text-[11.5px] text-stone-500 border-t border-stone-100 pt-2.5">
            <span>Revenue</span>
            <span className="font-medium text-[#141414]">
              ₹{(data.jewelleryStats?.revenue ?? 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Card 7: Clothing Sold */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm transition-all hover:border-[#9C7D23]/40">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#9C7D23]/20 bg-[#9C7D23]/10 text-[#9C7D23]">
              <Shirt size={20} strokeWidth={1.75} />
            </span>
            <span className="text-[10.5px] font-medium text-stone-400 uppercase tracking-wider">
              Last 30 Days
            </span>
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-stone-500">
            Clothing Sold
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#141414]">
            {data.clothingStats ? data.clothingStats.itemCount : 0} Units
          </p>
          <div className="mt-3 flex items-center justify-between text-[11.5px] text-stone-500 border-t border-stone-100 pt-2.5">
            <span>Revenue</span>
            <span className="font-medium text-[#141414]">
              ₹{(data.clothingStats?.revenue ?? 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Card 8: #1 Selling Category */}
        <div className="rounded-2xl border border-[#9C7D23]/30 bg-white p-5 shadow-sm transition-all hover:border-[#9C7D23]/60">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#9C7D23]/20 bg-[#9C7D23]/10 text-[#9C7D23]">
              <Crown size={20} strokeWidth={1.75} />
            </span>
            <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10.5px] font-medium text-emerald-700">
              <TrendingUp size={12} />
              Top Performer
            </span>
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-stone-500">
            #1 Selling Category
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#141414] flex items-center gap-1.5 truncate">
            <span className="truncate">{data.topSellingCategory ? data.topSellingCategory.categoryName : 'No Data'}</span>
            {data.topSellingCategory && (
              <ArrowUpRight size={18} className="text-[#9C7D23] shrink-0" strokeWidth={2.25} />
            )}
          </p>
          <div className="mt-3 flex items-center justify-between text-[11.5px] text-stone-500 border-t border-stone-100 pt-2.5">
            <span>{data.topSellingCategory?.itemCount ?? 0} Units Sold</span>
            <span className="font-medium text-[#141414]">
              ₹{(data.topSellingCategory?.revenue ?? 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Orders + Inventory / Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Orders List */}
        <div className="lg:col-span-8 rounded-2xl border border-stone-200/90 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-100">
            <div>
              <h2 className="text-base font-semibold text-[#141414]">Recent Transactions</h2>
              <p className="text-xs text-stone-500 mt-0.5">Latest online store orders and boutique POS checkout activity</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-[#9C7D23] hover:text-black transition-colors flex items-center gap-1 uppercase tracking-wider"
            >
              View All <ArrowUpRight size={13} />
            </Link>
          </div>

          {data.recentOrders.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-xs">
              No orders placed yet. Orders will appear here in real-time.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-100 text-stone-400 uppercase tracking-widest text-[10px]">
                    <th className="pb-3 font-semibold">Order ID</th>
                    <th className="pb-3 font-semibold">Customer / Source</th>
                    <th className="pb-3 font-semibold">Channel</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {data.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3.5 font-semibold text-[#9C7D23]">
                        {order.orderNumber}
                      </td>
                      <td className="py-3.5 text-stone-800">
                        <span className="font-medium text-[#141414]">{order.customer}</span>
                        <span className="block text-[10.5px] text-stone-400 font-normal">
                          {order.itemsCount} {order.itemsCount === 1 ? 'item' : 'items'}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-medium border ${order.type === 'Online' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                          {order.type === 'Online' ? <Globe size={10} /> : <Store size={10} />}
                          {order.type}
                        </span>
                      </td>
                      <td className="py-3.5 font-bold text-[#141414]">
                        ₹{order.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium border capitalize ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right text-stone-400 text-[11px]">
                        {formatDate(order.date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Low Stock Alerts & Category Distribution */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Low Stock Watch */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
              <h2 className="text-sm font-semibold text-[#141414] flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-500" />
                Low Stock Alert
              </h2>
              <span className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold">
                Action needed
              </span>
            </div>

            {data.lowStockItems.length === 0 ? (
              <p className="text-xs text-stone-400 py-4 text-center">
                All inventory items have healthy stock levels.
              </p>
            ) : (
              <div className="space-y-3">
                {data.lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 hover:border-stone-300 transition-colors text-xs"
                  >
                    <div className="max-w-[170px] truncate">
                      <p className="font-semibold text-stone-800 truncate">{item.productName}</p>
                      <p className="text-[10px] text-stone-500 truncate">
                        {[item.color, item.size, item.sku].filter(Boolean).join(' • ') || 'Default'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block font-bold text-xs px-2 py-0.5 rounded border ${item.stock === 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                        {item.stock} left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Categories Overview */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
              <h2 className="text-sm font-semibold text-[#141414] flex items-center gap-2">
                <BarChart3 size={15} className="text-[#9C7D23]" />
                Top Categories (30 Days)
              </h2>
              <Link href="/admin/reports" className="text-[10.5px] font-semibold text-[#9C7D23] hover:underline uppercase tracking-wider">
                Full Report
              </Link>
            </div>

            {data.topCategories.length === 0 ? (
              <p className="text-xs text-stone-400 py-4 text-center">
                Not enough data yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {data.topCategories.map((cat, i) => (
                  <div key={cat.categoryId || 'unknown'} className="flex flex-col text-xs py-2 border-b border-stone-100 last:border-0 relative">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-stone-700 font-medium flex items-center gap-1.5">
                        <span className="text-[#9c7d23]/60 text-[10px]">#{i + 1}</span>
                        {cat.categoryName}
                      </span>
                      <span className="font-bold text-[#141414]">₹{cat.revenue.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-stone-400">
                      <span>{cat.itemCount} Units Sold</span>
                      <span>{cat.orderCount} Orders</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}