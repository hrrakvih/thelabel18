// app/admin/pos/history/HistoryClient.tsx
'use client'
import { Fragment, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    ChevronDown,
    Repeat,
    X,
    Loader2,
    ImageOff,
    Search,
    Layers,
    CheckCircle2,
    RotateCcw,
} from 'lucide-react'
import {
    searchExchangeCandidates,
    exchangeOrderItem,
    type ExchangeCandidate,
} from './actions'
import toast from 'react-hot-toast'

type OrderItem = {
    id: string
    variation_id: string   // add this line
    sku: string
    product_name: string
    size: string | null
    color: string | null
    unit_price: number
    quantity: number
    line_total: number
}

export type PosOrder = {
    id: string
    order_number: string
    subtotal: number
    discount: number
    tax: number
    total: number
    payment_method: string
    status: string
    cashier_name: string | null
    created_at: string
    items: OrderItem[]
}

type StatusFilter = 'all' | 'completed' | 'refunded'

function statusStyles(status: string) {
    return status === 'refunded'
        ? 'bg-rose-50 text-rose-600'
        : 'bg-emerald-50 text-emerald-700'
}

export default function HistoryClient({ orders }: { orders: PosOrder[] }) {
    const router = useRouter()
    const [expanded, setExpanded] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
    const [paymentFilter, setPaymentFilter] = useState('')

    // Exchange modal state
    const [exchangeOrder, setExchangeOrder] = useState<PosOrder | null>(null)
    const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [results, setResults] = useState<ExchangeCandidate[]>([])
    const [searching, setSearching] = useState(false)
    const [selectedCandidate, setSelectedCandidate] = useState<ExchangeCandidate | null>(null)
    const [quantity, setQuantity] = useState(1)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const completedCount = orders.filter((o) => o.status !== 'refunded').length
    const refundedCount = orders.length - completedCount

    const paymentMethods = useMemo(() => {
        const methods = new Set(orders.map((o) => o.payment_method))
        return Array.from(methods).sort((a, b) => a.localeCompare(b))
    }, [orders])

    const filteredOrders = useMemo(() => {
        const q = search.trim().toLowerCase()
        return orders.filter((o) => {
            const matchesSearch =
                !q ||
                o.order_number.toLowerCase().includes(q) ||
                (o.cashier_name || '').toLowerCase().includes(q) ||
                o.items.some(
                    (item) =>
                        item.product_name.toLowerCase().includes(q) ||
                        item.sku.toLowerCase().includes(q)
                )
            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'refunded' ? o.status === 'refunded' : o.status !== 'refunded')
            const matchesPayment = !paymentFilter || o.payment_method === paymentFilter
            return matchesSearch && matchesStatus && matchesPayment
        })
    }, [orders, search, statusFilter, paymentFilter])

    function openExchange(order: PosOrder) {
        setExchangeOrder(order)
        // if there's only one item on the order, skip straight to picking a replacement
        setSelectedItem(order.items.length === 1 ? order.items[0] : null)
        setSearchQuery('')
        setResults([])
        setSelectedCandidate(null)
        setQuantity(order.items.length === 1 ? order.items[0].quantity : 1)
        setError(null)
    }

    function closeExchange() {
        setExchangeOrder(null)
        setSelectedItem(null)
        setSelectedCandidate(null)
        setResults([])
        setError(null)
    }

    function pickItem(item: OrderItem) {
        setSelectedItem(item)
        setQuantity(item.quantity)
        setSelectedCandidate(null)
        setSearchQuery('')
        setResults([])
    }

    async function runSearch(q: string) {
        setSearchQuery(q)
        if (!q.trim()) {
            setResults([])
            return
        }
        setSearching(true)
        const found = await searchExchangeCandidates(q)
        setResults(found)
        setSearching(false)
    }

    async function confirmExchange() {
        if (!exchangeOrder || !selectedItem || !selectedCandidate) return
        setSubmitting(true)
        setError(null)
        try {
            await exchangeOrderItem({
                orderId: exchangeOrder.id,
                orderItemId: selectedItem.id,
                oldVariationId: (selectedItem as any).variation_id ?? selectedItem.id,
                oldQuantity: selectedItem.quantity,
                newVariation: selectedCandidate,
                newQuantity: quantity,
            })
            closeExchange()
            toast.success('Item exchanged successfully')
            router.refresh()
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Exchange failed'
            setError(msg)
            toast.error(msg)
        } finally {
            setSubmitting(false)
        }
    }

    const selectClass =
        'rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-black outline-none focus:border-black'

    return (
        <div>
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white px-4 py-5 md:px-6 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-black">POS History</h1>
                    <p className="mt-1 text-sm font-medium text-stone-600">
                        {orders.length} order{orders.length === 1 ? '' : 's'} · expand a row to see items sold
                    </p>
                </div>
            </div>

            {/* Stat cards */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
                <div className="flex items-center gap-3 sm:gap-4 rounded-2xl border border-stone-200 bg-white p-3.5 sm:p-5 shadow-sm">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600 shrink-0">
                        <Layers size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                            Total Orders
                        </p>
                        <p className="mt-0.5 text-2xl font-bold text-black">{orders.length}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 rounded-2xl border border-stone-200 bg-white p-3.5 sm:p-5 shadow-sm">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <CheckCircle2 size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                            Completed
                        </p>
                        <p className="mt-0.5 text-2xl font-bold text-black">{completedCount}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 rounded-2xl border border-stone-200 bg-white p-3.5 sm:p-5 shadow-sm">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                        <RotateCcw size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                            Refunded
                        </p>
                        <p className="mt-0.5 text-2xl font-bold text-black">{refundedCount}</p>
                    </div>
                </div>
            </div>

            {/* Search + filters */}
            <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                <div className="relative min-w-[220px] flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by order no., product, SKU or cashier…"
                        className="w-full rounded-xl border border-stone-300 bg-white py-2.5 pl-10 pr-3.5 text-sm text-black outline-none focus:border-black"
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className={selectClass}
                >
                    <option value="all">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="refunded">Refunded</option>
                </select>

                <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    className={selectClass}
                >
                    <option value="">All Payment Methods</option>
                    {paymentMethods.map((m) => (
                        <option key={m} value={m}>
                            {m.toUpperCase()}
                        </option>
                    ))}
                </select>

                {(search || statusFilter !== 'all' || paymentFilter) && (
                    <button
                        onClick={() => {
                            setSearch('')
                            setStatusFilter('all')
                            setPaymentFilter('')
                        }}
                        className="rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50"
                    >
                        Clear
                    </button>
                )}
            </div>

            <div className="hidden md:block overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-[900px] w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-stone-200 bg-stone-50 text-[11px] uppercase tracking-wider text-stone-500">
                            <th className="px-6 py-3 font-semibold w-8"></th>
                            <th className="px-6 py-3 font-semibold">Order No.</th>
                            <th className="px-6 py-3 font-semibold">Date</th>
                            <th className="px-6 py-3 font-semibold">Items</th>
                            <th className="px-6 py-3 font-semibold">Payment</th>
                            <th className="px-6 py-3 font-semibold">Total</th>
                            <th className="px-6 py-3 font-semibold">Status</th>
                            <th className="px-6 py-3 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.map((o) => {
                            const isOpen = expanded === o.id
                            const itemCount = o.items.reduce((sum, i) => sum + i.quantity, 0)
                            return (
                                <Fragment key={o.id}>
                                    <tr className="border-t border-stone-100 hover:bg-stone-50">
                                        <td className="px-6 py-3.5">
                                            <button
                                                onClick={() => setExpanded(isOpen ? null : o.id)}
                                                className="text-stone-400 hover:text-black"
                                            >
                                                <ChevronDown
                                                    size={16}
                                                    className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                                />
                                            </button>
                                        </td>
                                        <td className="px-6 py-3.5 font-outfit text-xs text-stone-600">
                                            {o.order_number}
                                        </td>
                                        <td className="px-6 py-3.5 text-stone-600">
                                            {new Date(o.created_at).toLocaleString('en-IN', {
                                                timeZone: 'Asia/Kolkata',
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit',
                                                hour12: false,
                                            })}
                                        </td>
                                        <td className="px-6 py-3.5 text-stone-600">{itemCount}</td>
                                        <td className="px-6 py-3.5 uppercase text-stone-600">{o.payment_method}</td>
                                        <td className="px-6 py-3.5 font-semibold text-black">
                                            ₹{Number(o.total).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-3.5">
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${statusStyles(o.status)}`}
                                            >
                                                {o.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5">
                                            {o.items.length > 0 && (
                                                <button
                                                    onClick={() => openExchange(o)}
                                                    className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:border-black hover:text-black"
                                                >
                                                    <Repeat size={12} />
                                                    Exchange
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                    {isOpen && (
                                        <tr>
                                            <td colSpan={8} className="bg-stone-50/60 px-0 py-0">
                                                <table className="min-w-[900px] w-full text-left text-sm">
                                                    <thead>
                                                        <tr className="text-[11px] uppercase tracking-wider text-stone-400">
                                                            <th className="px-6 py-2 font-semibold">SKU</th>
                                                            <th className="px-6 py-2 font-semibold">Product</th>
                                                            <th className="px-6 py-2 font-semibold">Size / Color</th>
                                                            <th className="px-6 py-2 font-semibold">Unit Price</th>
                                                            <th className="px-6 py-2 font-semibold">Qty</th>
                                                            <th className="px-6 py-2 font-semibold">Line Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {o.items.map((item) => (
                                                            <tr key={item.id} className="border-t border-stone-100">
                                                                <td className="px-6 py-2.5 font-outfit text-xs text-stone-600">
                                                                    {item.sku}
                                                                </td>
                                                                <td className="px-6 py-2.5 text-stone-700">{item.product_name}</td>
                                                                <td className="px-6 py-2.5 text-stone-600">
                                                                    {[item.size, item.color].filter(Boolean).join(' · ') || '—'}
                                                                </td>
                                                                <td className="px-6 py-2.5 text-stone-600">
                                                                    ₹{Number(item.unit_price).toLocaleString()}
                                                                </td>
                                                                <td className="px-6 py-2.5 text-stone-600">{item.quantity}</td>
                                                                <td className="px-6 py-2.5 font-medium text-black">
                                                                    ₹{Number(item.line_total).toLocaleString()}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                <div className="flex justify-end gap-6 border-t border-stone-100 px-6 py-3 text-sm text-stone-600">
                                                    <span>Subtotal: ₹{Number(o.subtotal).toLocaleString()}</span>
                                                    <span>Discount: ₹{Number(o.discount).toLocaleString()}</span>
                                                    <span className="font-semibold text-black">
                                                        Total: ₹{Number(o.total).toLocaleString()}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            )
                        })}

                        {filteredOrders.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-sm text-stone-500">
                                    {orders.length === 0
                                        ? 'No orders yet.'
                                        : 'No orders match your search or filter.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            </div>

            {/* Mobile Card Layout */}
            <div className="flex flex-col gap-4 md:hidden">
                {filteredOrders.map((o) => {
                    const isOpen = expanded === o.id
                    const itemCount = o.items.reduce((sum, i) => sum + i.quantity, 0)
                    return (
                        <div key={o.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm flex flex-col gap-3">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="font-outfit font-semibold text-black">{o.order_number}</h3>
                                    <p className="text-[10px] text-stone-500 mt-0.5">
                                        {new Date(o.created_at).toLocaleString('en-IN', {
                                            timeZone: 'Asia/Kolkata',
                                            day: '2-digit', month: '2-digit', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit', hour12: false
                                        })}
                                    </p>
                                </div>
                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium capitalize shrink-0 ${statusStyles(o.status)}`}>
                                    {o.status}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 border-t border-stone-100 pt-3">
                                <div>
                                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400">Items</span>
                                    <span className="mt-0.5 block text-xs font-medium text-stone-600">{itemCount}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400">Payment</span>
                                    <span className="mt-0.5 block text-xs font-medium uppercase text-stone-600">{o.payment_method}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400">Total</span>
                                    <span className="mt-0.5 block text-sm font-semibold text-black">₹{Number(o.total).toLocaleString()}</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between border-t border-stone-100 pt-3">
                                <button
                                    onClick={() => setExpanded(isOpen ? null : o.id)}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-black"
                                >
                                    <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                    {isOpen ? 'Hide Details' : 'View Details'}
                                </button>
                                
                                {o.items.length > 0 && (
                                    <button
                                        onClick={() => openExchange(o)}
                                        className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:border-black hover:text-black"
                                    >
                                        <Repeat size={12} />
                                        Exchange
                                    </button>
                                )}
                            </div>
                            
                            {isOpen && (
                                <div className="mt-2 rounded-xl bg-stone-50 p-3 flex flex-col gap-3">
                                    {o.items.map((item) => (
                                        <div key={item.id} className="flex flex-col gap-1.5 border-b border-stone-200/60 pb-3 last:border-0 last:pb-0">
                                            <div className="flex justify-between items-start">
                                                <span className="text-xs font-medium text-black">{item.product_name}</span>
                                                <span className="text-xs font-semibold text-black">₹{Number(item.line_total).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] text-stone-500">
                                                <span className="font-outfit">{item.sku}</span>
                                                <span>Qty: {item.quantity}</span>
                                            </div>
                                            {[item.size, item.color].filter(Boolean).length > 0 && (
                                                <span className="text-[10px] text-stone-500">
                                                    {[item.size, item.color].filter(Boolean).join(' · ')}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                    
                                    <div className="border-t border-stone-200/60 pt-2 flex flex-col gap-1 items-end text-xs text-stone-600">
                                        <span>Subtotal: ₹{Number(o.subtotal).toLocaleString()}</span>
                                        <span>Discount: ₹{Number(o.discount).toLocaleString()}</span>
                                        <span className="font-semibold text-black mt-1">Total: ₹{Number(o.total).toLocaleString()}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}

                {filteredOrders.length === 0 && (
                    <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">
                        {orders.length === 0
                            ? 'No orders yet.'
                            : 'No orders match your search or filter.'}
                    </div>
                )}
            </div>

            {/* Exchange popup */}
            {exchangeOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
                            <div>
                                <h2 className="text-sm font-bold text-black">Exchange item</h2>
                                <p className="text-xs text-stone-500">Order {exchangeOrder.order_number}</p>
                            </div>
                            <button onClick={closeExchange} className="text-stone-400 hover:text-black">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4 px-5 py-4">
                            {/* Step 1: pick which item on the order to exchange */}
                            {!selectedItem && (
                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
                                        Which item is being exchanged?
                                    </p>
                                    <div className="divide-y divide-stone-100 rounded-xl border border-stone-200">
                                        {exchangeOrder.items.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => pickItem(item)}
                                                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-stone-50"
                                            >
                                                <div>
                                                    <p className="text-sm font-medium text-black">{item.product_name}</p>
                                                    <p className="text-xs text-stone-500">
                                                        {[item.size, item.color].filter(Boolean).join(' · ') || item.sku} · Qty{' '}
                                                        {item.quantity}
                                                    </p>
                                                </div>
                                                <span className="text-sm font-semibold text-black">
                                                    ₹{Number(item.unit_price).toLocaleString()}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 2: pick a replacement + quantity */}
                            {selectedItem && (
                                <>
                                    <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                                            Exchanging
                                        </p>
                                        <div className="mt-1 flex items-center justify-between">
                                            <p className="text-sm font-medium text-black">{selectedItem.product_name}</p>
                                            {exchangeOrder.items.length > 1 && (
                                                <button
                                                    onClick={() => setSelectedItem(null)}
                                                    className="text-xs font-semibold text-stone-500 underline hover:text-black"
                                                >
                                                    Change
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-xs text-stone-500">
                                            {[selectedItem.size, selectedItem.color].filter(Boolean).join(' · ') ||
                                                selectedItem.sku}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
                                            Replace with
                                        </p>
                                        <input
                                            value={searchQuery}
                                            onChange={(e) => runSearch(e.target.value)}
                                            placeholder="Search product name or SKU…"
                                            className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-black outline-none focus:border-black"
                                            autoFocus
                                        />

                                        {searching && (
                                            <p className="mt-2 text-xs text-stone-400">Searching…</p>
                                        )}

                                        {results.length > 0 && (
                                            <div className="mt-2 max-h-56 divide-y divide-stone-100 overflow-y-auto rounded-xl border border-stone-200">
                                                {results.map((c) => (
                                                    <button
                                                        key={c.variationId}
                                                        onClick={() => {
                                                            setSelectedCandidate(c)
                                                            setQuantity(Math.min(selectedItem.quantity, c.stockQuantity || 1))
                                                        }}
                                                        disabled={c.stockQuantity <= 0}
                                                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40 ${selectedCandidate?.variationId === c.variationId ? 'bg-stone-100' : ''
                                                            }`}
                                                    >
                                                        {c.imageUrl ? (
                                                            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-stone-200">
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                <img
                                                                    src={c.imageUrl}
                                                                    alt={c.productName}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-stone-300">
                                                                <ImageOff size={12} />
                                                            </div>
                                                        )}
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-medium text-black">
                                                                {c.productName}
                                                            </p>
                                                            <p className="text-xs text-stone-500">
                                                                {[c.size, c.color].filter(Boolean).join(' · ') || c.sku} ·{' '}
                                                                {c.stockQuantity} in stock
                                                            </p>
                                                        </div>
                                                        <span className="text-sm font-semibold text-black">
                                                            ₹{c.price.toLocaleString()}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {selectedCandidate && (
                                        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                                            <div>
                                                <p className="text-sm font-medium text-black">
                                                    {selectedCandidate.productName}
                                                </p>
                                                <p className="text-xs text-stone-500">
                                                    {[selectedCandidate.size, selectedCandidate.color]
                                                        .filter(Boolean)
                                                        .join(' · ') || selectedCandidate.sku}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs text-stone-500">Qty</label>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={selectedCandidate.stockQuantity}
                                                    value={quantity}
                                                    onChange={(e) =>
                                                        setQuantity(
                                                            Math.max(
                                                                1,
                                                                Math.min(
                                                                    selectedCandidate.stockQuantity,
                                                                    Number(e.target.value) || 1
                                                                )
                                                            )
                                                        )
                                                    }
                                                    className="w-16 rounded-lg border border-stone-300 px-2 py-1 text-right text-sm outline-none focus:border-black"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {error && (
                                        <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-xs text-rose-600">
                                            {error}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 border-t border-stone-200 px-5 py-4">
                            <button
                                onClick={closeExchange}
                                className="rounded-lg px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmExchange}
                                disabled={!selectedItem || !selectedCandidate || submitting}
                                className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
                            >
                                {submitting && <Loader2 size={14} className="animate-spin" />}
                                {submitting ? 'Exchanging…' : 'Confirm Exchange'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}