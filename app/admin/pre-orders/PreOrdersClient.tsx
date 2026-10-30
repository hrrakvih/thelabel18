// app/admin/pre-orders/PreOrdersClient.tsx
'use client'

import { Fragment, useMemo, useState } from 'react'
import {
  ChevronDown,
  ImageOff,
  Search,
  CheckCircle2,
  Truck,
  Clock,
  XCircle,
  IndianRupee,
  MapPin,
  Loader2,
  CalendarClock,
  Sparkles,
  Package,
  AlertCircle
} from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { updateOrderStatus } from '../orders/actions'

export type PreOrderItem = {
  id: string
  product_id: string
  variation_id: string | null
  product_name: string
  variation_label: string | null
  unit_price: number
  quantity: number
  line_total: number
  product?: {
    id: string
    name: string
    is_pre_order?: boolean
    launch_date?: string | null
    pre_order_note?: string | null
  } | null
  product_variations: {
    image_url: string | null
    size: string | null
    color: string | null
    sku: string | null
  } | null
}

export type PreOrder = {
  id: string
  status: string
  subtotal: number
  discount_amount: number
  total: number
  coupon_code: string | null
  created_at: string
  payment_method: string | null
  payment_status: string | null
  razorpay_payment_id: string | null
  ship_full_name: string
  ship_phone: string
  ship_line1: string
  ship_line2: string | null
  ship_city: string
  ship_state: string
  ship_postal_code: string
  ship_country: string
  items: PreOrderItem[]
}

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-rose-50 text-rose-600 border-rose-200',
}

function getLaunchBadge(launchDate?: string | null) {
  if (!launchDate) {
    return {
      text: 'Launch Date TBD',
      className: 'bg-stone-100 text-stone-600 border-stone-200'
    }
  }

  const now = new Date()
  const target = new Date(launchDate)
  const diffTime = target.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) {
    return {
      text: '🚀 Launched — Ready to Dispatch',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold'
    }
  }

  return {
    text: `⏱ Launches in ${diffDays} day${diffDays === 1 ? '' : 's'} (${target.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`,
    className: 'bg-amber-50 text-amber-800 border-amber-200 font-semibold'
  }
}

export default function PreOrdersClient({ orders: initialOrders }: { orders: PreOrder[] }) {
  const [orders, setOrders] = useState(initialOrders)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const stats = useMemo(() => {
    let pendingCount = 0
    let confirmedCount = 0
    let totalRevenue = 0

    for (const o of orders) {
      if (o.status === 'pending') pendingCount++
      if (o.status === 'confirmed') confirmedCount++
      totalRevenue += Number(o.total || 0)
    }

    return {
      total: orders.length,
      pending: pendingCount,
      confirmed: confirmedCount,
      revenue: totalRevenue,
    }
  }, [orders])

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false
      if (!q) return true

      return (
        o.id.toLowerCase().includes(q) ||
        o.ship_full_name.toLowerCase().includes(q) ||
        o.ship_phone.includes(q) ||
        (o.coupon_code && o.coupon_code.toLowerCase().includes(q)) ||
        o.items.some(
          (it) =>
            it.product_name.toLowerCase().includes(q) ||
            (it.variation_label && it.variation_label.toLowerCase().includes(q))
        )
      )
    })
  }, [orders, search, statusFilter])

  async function handleStatusChange(orderId: string, newStatus: string) {
    setUpdatingId(orderId)
    try {
      await updateOrderStatus(orderId, newStatus)
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      )
      toast.success(`Pre-order status updated to ${STATUS_LABEL[newStatus] || newStatus}`)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update order status')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white px-5 py-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[#9c7d23]">
            <CalendarClock size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-black">Pre-Order Reservations</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold tracking-widest uppercase shadow-sm">
                <Sparkles size={11} /> Exclusive
              </span>
            </div>
            <p className="mt-1 text-sm text-stone-500">
              Manage advance orders and launch-day dispatch schedules for upcoming products
            </p>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Pre-Orders</span>
            <Package size={17} className="text-stone-400" />
          </div>
          <div className="text-2xl font-bold text-black">{stats.total}</div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Awaiting Launch / Pending</span>
            <Clock size={17} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700">{stats.pending}</div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Confirmed</span>
            <CheckCircle2 size={17} className="text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-700">{stats.confirmed}</div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pre-Order Value</span>
            <IndianRupee size={17} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">₹{stats.revenue.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID, customer name, phone, or product..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-black"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {(['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as StatusFilter[]).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-black text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarClock size={36} className="mx-auto text-stone-300 mb-3" />
            <h3 className="text-base font-semibold text-black">No pre-orders found</h3>
            <p className="mt-1 text-sm text-stone-400">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your search query or filter.'
                : 'When customers place pre-orders for upcoming pieces, they will appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="px-5 py-3.5">Order &amp; Date</th>
                  <th className="px-5 py-3.5">Customer &amp; Address</th>
                  <th className="px-5 py-3.5">Pre-Order Products</th>
                  <th className="px-5 py-3.5">Launch Dispatch</th>
                  <th className="px-5 py-3.5">Total &amp; Payment</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-sans">
                {filteredOrders.map((order) => {
                  const isExpanded = expanded === order.id
                  const preOrderItems = order.items.filter((it) => it.product?.is_pre_order)
                  const primaryLaunchDate = preOrderItems[0]?.product?.launch_date
                  const launchBadge = getLaunchBadge(primaryLaunchDate)

                  return (
                    <Fragment key={order.id}>
                      <tr className="hover:bg-amber-50/20 transition-colors">
                        {/* Order & Date */}
                        <td className="px-5 py-4 align-top">
                          <button
                            type="button"
                            onClick={() => setExpanded(isExpanded ? null : order.id)}
                            className="font-mono text-xs font-bold text-black hover:text-[#9c7d23] flex items-center gap-1.5"
                          >
                            <span>#{order.id.slice(0, 8).toUpperCase()}</span>
                            <ChevronDown
                              size={13}
                              className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            />
                          </button>
                          <div className="text-[11px] text-stone-400 mt-1">
                            {new Date(order.created_at).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="px-5 py-4 align-top">
                          <div className="font-semibold text-black">{order.ship_full_name}</div>
                          <div className="text-xs text-stone-500">{order.ship_phone}</div>
                          <div className="text-[11px] text-stone-400 truncate max-w-[200px] mt-0.5" title={`${order.ship_line1}, ${order.ship_city}, ${order.ship_state}`}>
                            {order.ship_city}, {order.ship_state}
                          </div>
                        </td>

                        {/* Items */}
                        <td className="px-5 py-4 align-top">
                          <div className="space-y-1.5">
                            {order.items.map((it) => (
                              <div key={it.id} className="text-xs">
                                <span className="font-medium text-black">{it.product_name}</span>
                                {it.product?.is_pre_order && (
                                  <span className="ml-1.5 inline-block px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold uppercase tracking-wider">
                                    Pre-Order
                                  </span>
                                )}
                                <div className="text-[11px] text-stone-400">
                                  Qty: {it.quantity} · {it.variation_label || 'Standard'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Launch Dispatch */}
                        <td className="px-5 py-4 align-top whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] ${launchBadge.className}`}>
                            <CalendarClock size={12} />
                            {launchBadge.text}
                          </span>
                          {preOrderItems[0]?.product?.pre_order_note && (
                            <p className="text-[10px] text-stone-500 mt-1 italic max-w-[180px] truncate" title={preOrderItems[0]?.product?.pre_order_note}>
                              {preOrderItems[0]?.product?.pre_order_note}
                            </p>
                          )}
                        </td>

                        {/* Total & Payment */}
                        <td className="px-5 py-4 align-top">
                          <div className="font-bold text-black">₹{Number(order.total).toLocaleString('en-IN')}</div>
                          <div className="text-[11px] text-stone-500 capitalize">
                            {order.payment_status === 'paid' ? (
                              <span className="text-emerald-600 font-semibold">● Paid ({order.payment_method || 'Online'})</span>
                            ) : (
                              <span className="text-amber-600 font-medium">○ {order.payment_status || 'Pending'}</span>
                            )}
                          </div>
                        </td>

                        {/* Status Select */}
                        <td className="px-5 py-4 align-top">
                          <div className="relative inline-block">
                            <select
                              value={order.status}
                              disabled={updatingId === order.id}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              className={`text-xs font-bold rounded-xl border px-3 py-1.5 pr-7 appearance-none cursor-pointer focus:outline-none focus:ring-1 ${
                                STATUS_STYLES[order.status] || 'bg-stone-50 text-stone-700 border-stone-200'
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            <ChevronDown
                              size={12}
                              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400"
                            />
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Order Detail Row */}
                      {isExpanded && (
                        <tr className="bg-stone-50/70">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-5 rounded-xl border border-stone-200 text-xs">
                              {/* Shipping Full Address */}
                              <div>
                                <h4 className="font-bold uppercase tracking-wider text-stone-500 mb-2 flex items-center gap-1.5">
                                  <MapPin size={13} className="text-[#9c7d23]" />
                                  Full Shipping Address
                                </h4>
                                <div className="space-y-1 text-stone-700">
                                  <p className="font-semibold text-black">{order.ship_full_name} ({order.ship_phone})</p>
                                  <p>{order.ship_line1}</p>
                                  {order.ship_line2 && <p>{order.ship_line2}</p>}
                                  <p>{order.ship_city}, {order.ship_state} - {order.ship_postal_code}</p>
                                  <p>{order.ship_country}</p>
                                </div>
                              </div>

                              {/* Items list with thumbnails */}
                              <div>
                                <h4 className="font-bold uppercase tracking-wider text-stone-500 mb-2 flex items-center gap-1.5">
                                  <Package size={13} className="text-[#9c7d23]" />
                                  Pre-Ordered Products
                                </h4>
                                <div className="space-y-2.5">
                                  {order.items.map((it) => {
                                    const img = it.product_variations?.image_url
                                    return (
                                      <div key={it.id} className="flex items-center gap-3">
                                        <div className="relative w-10 h-12 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                                          {img ? (
                                            <Image src={img} alt={it.product_name} fill className="object-cover" />
                                          ) : (
                                            <ImageOff size={14} className="m-auto text-stone-300" />
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-black truncate">{it.product_name}</p>
                                          <p className="text-[11px] text-stone-400">
                                            {it.variation_label || 'Standard'} · Qty: {it.quantity}
                                          </p>
                                        </div>
                                        <div className="font-bold text-black text-right">
                                          ₹{Number(it.line_total).toLocaleString('en-IN')}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
