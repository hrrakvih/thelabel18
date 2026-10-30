'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  Loader2,
  IndianRupee,
  ShoppingBag,
  Package,
  Layers,
  Globe,
  Store,
  Calendar,
  TrendingUp,
  Award,
  Gem,
  Shirt,
  Crown,
  BarChart3,
} from 'lucide-react'
import {
  getComprehensiveReport,
  type ComprehensiveReport,
} from './actions'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

type Preset = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom'

function presetRange(preset: Preset): { start: Date; end: Date } {
  const now = new Date()
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)

  if (preset === 'week') {
    start.setDate(start.getDate() - 7)
  } else if (preset === 'month') {
    start.setDate(1)
  } else if (preset === 'year') {
    start.setMonth(0, 1)
  } else if (preset === 'all') {
    start.setFullYear(2020, 0, 1)
  }
  return { start, end }
}

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default function ReportsClient() {
  const [preset, setPreset] = useState<Preset>('month')
  const [startDate, setStartDate] = useState(() => toInputDate(presetRange('month').start))
  const [endDate, setEndDate] = useState(() => toInputDate(presetRange('month').end))
  const [report, setReport] = useState<ComprehensiveReport | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [pending, startTransition] = useTransition()

  function applyPreset(p: Preset) {
    setPreset(p)
    if (p === 'custom') return
    const { start, end } = presetRange(p)
    setStartDate(toInputDate(start))
    setEndDate(toInputDate(end))
  }

  useEffect(() => {
    startTransition(async () => {
      const startISO = new Date(`${startDate}T00:00:00`).toISOString()
      const endISO = new Date(`${endDate}T23:59:59`).toISOString()
      const data = await getComprehensiveReport(startISO, endISO)
      setReport(data)
      setLoaded(true)
    })
  }, [startDate, endDate])

  const summary = report?.summary ?? {
    onlineRevenue: 0,
    onlineOrders: 0,
    posRevenue: 0,
    posOrders: 0,
    totalRevenue: 0,
    totalOrders: 0,
    totalUnits: 0,
    avgOrderValue: 0,
  }

  const categories = report?.categories ?? []
  const topProducts = report?.topProducts ?? []

  // Extract specific categories for comparison cards and charts
  const jewelleryStats = categories.find((c) => /jewel/i.test(c.categoryName)) ?? null
  const clothingStats = categories.find((c) => /cloth/i.test(c.categoryName)) ?? null
  const topSellingCategory = categories[0] ?? null

  return (
    <div className="space-y-8">
      {/* Header & Title */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#9C7D23]"></span>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#9C7D23]">
              Financial & Sales Analytics
            </p>
          </div>
          <h1 className="mt-1 text-3xl font-normal tracking-tight text-[#141414]">
            Sales & Revenue <span className="text-[#9C7D23] font-medium">Reports</span>
          </h1>
          <p className="mt-1 text-xs text-stone-500">
            Combined multi-channel performance across web store and in-store boutique POS.
          </p>
        </div>

        {pending && (
          <div className="flex items-center gap-2 text-xs text-[#9C7D23] bg-[#9C7D23]/10 px-3.5 py-1.5 rounded-xl border border-[#9C7D23]/25 font-medium">
            <Loader2 size={13} className="animate-spin" />
            Updating report metrics...
          </div>
        )}
      </div>

      {/* Date Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'Last 7 Days' },
              { id: 'month', label: 'This Month' },
              { id: 'year', label: 'This Year' },
              { id: 'all', label: 'All Time' },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              onClick={() => applyPreset(p.id)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold tracking-wide transition-all ${
                preset === p.id
                  ? 'bg-black text-white shadow-sm'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-black'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom Date Picker */}
        <div className="flex items-center gap-2 text-xs">
          <Calendar size={14} className="text-stone-400" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setPreset('custom')
              setStartDate(e.target.value)
            }}
            className="rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs text-[#141414] font-medium outline-none focus:border-[#9C7D23] transition-colors"
          />
          <span className="text-stone-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setPreset('custom')
              setEndDate(e.target.value)
            }}
            className="rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs text-[#141414] font-medium outline-none focus:border-[#9C7D23] transition-colors"
          />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm">
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
            ₹{summary.totalRevenue.toLocaleString('en-IN')}
          </p>
          <div className="mt-3 flex items-center justify-between text-[11.5px] text-stone-500 border-t border-stone-100 pt-2.5">
            <span>Online: ₹{summary.onlineRevenue.toLocaleString('en-IN')}</span>
            <span>POS: ₹{summary.posRevenue.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#9C7D23]/20 bg-[#9C7D23]/10 text-[#9C7D23]">
              <ShoppingBag size={20} strokeWidth={1.75} />
            </span>
            <span className="flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10.5px] font-medium text-stone-600">
              Volume
            </span>
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-stone-500">
            Total Orders
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#141414]">
            {summary.totalOrders}
          </p>
          <div className="mt-3 flex items-center justify-between text-[11.5px] text-stone-500 border-t border-stone-100 pt-2.5">
            <span>{summary.onlineOrders} Online</span>
            <span>{summary.posOrders} POS</span>
          </div>
        </div>

        {/* Units Sold */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#9C7D23]/20 bg-[#9C7D23]/10 text-[#9C7D23]">
              <Package size={20} strokeWidth={1.75} />
            </span>
            <span className="text-[10.5px] font-semibold text-[#9C7D23] bg-[#9C7D23]/10 px-2 py-0.5 rounded-full border border-[#9C7D23]/25">
              Products
            </span>
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-stone-500">
            Units Sold
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#141414]">
            {summary.totalUnits} Units
          </p>
          <div className="mt-3 flex items-center justify-between text-[11.5px] text-stone-500 border-t border-stone-100 pt-2.5">
            <span>Fulfilled Inventory</span>
            <span className="text-emerald-600 font-medium">Recorded</span>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#9C7D23]/20 bg-[#9C7D23]/10 text-[#9C7D23]">
              <Award size={20} strokeWidth={1.75} />
            </span>
            <span className="text-[10.5px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              Basket Size
            </span>
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-stone-500">
            Average Order Value
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#141414]">
            ₹{summary.avgOrderValue.toLocaleString('en-IN')}
          </p>
          <div className="mt-3 flex items-center justify-between text-[11.5px] text-stone-500 border-t border-stone-100 pt-2.5">
            <span>Per Transaction</span>
            <span>AOV</span>
          </div>
        </div>
      </div>

      {/* Category Performance Highlight Cards (Jewellery, Clothing, #1 Seller) */}
      <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
        {/* Jewellery Sold Card */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm transition-all hover:border-[#9C7D23]/40">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#9C7D23]/20 bg-[#9C7D23]/10 text-[#9C7D23]">
              <Gem size={20} strokeWidth={1.75} />
            </span>
            <span className="text-[10.5px] font-medium text-stone-400 uppercase tracking-wider">
              Selected Period
            </span>
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-stone-500">
            Jewellery Sold
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#141414]">
            {jewelleryStats ? jewelleryStats.itemCount : 0} Units
          </p>
          <div className="mt-3 flex items-center justify-between text-[11.5px] text-stone-500 border-t border-stone-100 pt-2.5">
            <span>Revenue</span>
            <span className="font-medium text-[#141414]">
              ₹{(jewelleryStats?.revenue ?? 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Clothing Sold Card */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm transition-all hover:border-[#9C7D23]/40">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#9C7D23]/20 bg-[#9C7D23]/10 text-[#9C7D23]">
              <Shirt size={20} strokeWidth={1.75} />
            </span>
            <span className="text-[10.5px] font-medium text-stone-400 uppercase tracking-wider">
              Selected Period
            </span>
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-stone-500">
            Clothing Sold
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#141414]">
            {clothingStats ? clothingStats.itemCount : 0} Units
          </p>
          <div className="mt-3 flex items-center justify-between text-[11.5px] text-stone-500 border-t border-stone-100 pt-2.5">
            <span>Revenue</span>
            <span className="font-medium text-[#141414]">
              ₹{(clothingStats?.revenue ?? 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* #1 Selling Category Card */}
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
            <span className="truncate">{topSellingCategory ? topSellingCategory.categoryName : 'No Data'}</span>
          </p>
          <div className="mt-3 flex items-center justify-between text-[11.5px] text-stone-500 border-t border-stone-100 pt-2.5">
            <span>{topSellingCategory?.itemCount ?? 0} Units Sold</span>
            <span className="font-medium text-[#141414]">
              ₹{(topSellingCategory?.revenue ?? 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Channel Distribution & Jewellery vs Clothing Comparative Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sales Channel Distribution */}
        <div className="lg:col-span-5 rounded-2xl border border-stone-200/90 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#141414] mb-1">Sales Channel Distribution</h2>
            <p className="text-xs text-stone-500 mb-6">Revenue breakdown between Web Store and Boutique POS</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {summary.totalRevenue > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Online Webstore', value: summary.onlineRevenue },
                      { name: 'Boutique POS', value: summary.posRevenue },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#0ea5e9" />
                    <Cell fill="#D4AF37" />
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => `₹${Number(value || 0).toLocaleString('en-IN')}`}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
               <div className="text-stone-400 text-xs">No revenue data for pie chart.</div>
            )}
          </div>
          <div className="text-[11.5px] text-stone-500 text-center pt-4 border-t border-stone-100 mt-2">
            Multi-channel revenue aggregation
          </div>
        </div>

        {/* Comparative Category Performance (Jewellery vs Clothing) */}
        <div className="lg:col-span-7 rounded-2xl border border-stone-200/90 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#141414] flex items-center gap-2">
                <BarChart3 size={16} className="text-[#9C7D23]" />
                Category Comparison: Jewellery vs Clothing
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">Direct comparative revenue analysis</p>
            </div>
          </div>

          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  {
                    name: 'Jewellery',
                    Revenue: jewelleryStats?.revenue ?? 0,
                    Units: jewelleryStats?.itemCount ?? 0,
                  },
                  {
                    name: 'Clothing',
                    Revenue: clothingStats?.revenue ?? 0,
                    Units: clothingStats?.itemCount ?? 0,
                  },
                ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis dataKey="name" stroke="#a8a29e" fontSize={11} />
                <YAxis yAxisId="left" orientation="left" stroke="#D4AF37" fontSize={11} tickFormatter={(val) => `₹${val}`} />
                <YAxis yAxisId="right" orientation="right" stroke="#0ea5e9" fontSize={11} />
                <Tooltip 
                  formatter={(value: any, name: any) => name === 'Revenue' ? `₹${Number(value || 0).toLocaleString('en-IN')}` : `${value} Units`}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar yAxisId="left" dataKey="Revenue" fill="#D4AF37" radius={[4, 4, 0, 0]} barSize={36} name="Revenue (₹)" />
                <Bar yAxisId="right" dataKey="Units" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={36} name="Units Sold" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Category Breakdown + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Category Breakdown */}
        <div className="lg:col-span-7 rounded-2xl border border-stone-200/90 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-100">
            <div>
              <h2 className="text-base font-semibold text-[#141414] flex items-center gap-2">
                <Layers size={16} className="text-[#9C7D23]" />
                Full Category Performance
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">Revenue generated by each product line</p>
            </div>
            <span className="text-xs text-stone-500 font-medium">
              {categories.length} {categories.length === 1 ? 'Category' : 'Categories'}
            </span>
          </div>

          {!loaded ? (
            <div className="flex items-center justify-center py-16 text-stone-400 text-xs gap-2">
              <Loader2 size={16} className="animate-spin text-[#9C7D23]" />
              Loading category metrics...
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-xs">
              No sales data found for the selected date range.
            </div>
          ) : (
            <div className="h-[400px] w-full mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categories.map(c => ({
                    name: c.categoryName,
                    Revenue: c.revenue,
                    Orders: c.orderCount
                  }))}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f5f5f5" />
                  <XAxis type="number" tickFormatter={(val) => `₹${val}`} stroke="#a8a29e" fontSize={11} />
                  <YAxis dataKey="name" type="category" width={120} stroke="#a8a29e" fontSize={11} tick={{ fill: '#44403c' }} />
                  <Tooltip 
                    formatter={(value: any, name: any) => name === 'Revenue' ? `₹${Number(value || 0).toLocaleString('en-IN')}` : value}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="Revenue" fill="#D4AF37" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top Selling Products */}
        <div className="lg:col-span-5 rounded-2xl border border-stone-200/90 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-100">
            <div>
              <h2 className="text-base font-semibold text-[#141414] flex items-center gap-2">
                <Award size={16} className="text-[#9C7D23]" />
                Top Selling Products
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">Highest grossing items in this period</p>
            </div>
          </div>

          {!loaded ? (
            <div className="flex items-center justify-center py-16 text-stone-400 text-xs gap-2">
              <Loader2 size={16} className="animate-spin text-[#9C7D23]" />
              Loading top products...
            </div>
          ) : topProducts.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-xs">
              No products sold in this period yet.
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((prod, idx) => (
                <div
                  key={prod.productId}
                  className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-xs hover:border-stone-300 transition-colors"
                >
                  <div className="flex items-center gap-3 max-w-[200px] truncate">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#9C7D23]/10 text-[#9C7D23] font-bold text-[11px]">
                      #{idx + 1}
                    </span>
                    <div className="truncate">
                      <p className="font-semibold text-stone-800 truncate">{prod.name}</p>
                      <p className="text-[10.5px] text-stone-500">{prod.unitsSold} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#141414]">
                      ₹{prod.revenue.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}