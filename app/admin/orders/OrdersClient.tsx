// app/admin/orders/OrdersClient.tsx
'use client'
import { Fragment, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    ChevronDown,
    Search,
    Layers,
    CheckCircle2,
    Truck,
    Clock,
    XCircle,
    IndianRupee,
    MapPin,
    Loader2,
    Download,
    Pencil,
    X,
} from 'lucide-react'
import { updateOrderStatus, updateOrderAddress, type UpdateOrderAddressInput } from './actions'
import { shippingAddress, SHIPPING_ADDRESS_LIMIT } from '@/lib/shipping-address'
import toast from 'react-hot-toast'
import OrderItemPhoto, { type OrderPhotoSource } from '@/components/OrderItemPhoto'
import ShiprocketOrderDialog from './ShiprocketOrderDialog'
import { syncOrderPayment } from './payment-actions'
import PaymentResultDialog from './PaymentResultDialog'
import type { PaymentSyncResult } from '@/lib/payment-status'

type OrderItem = OrderPhotoSource & {
    id: string
    product_id: string
    variation_id: string | null
    product_name: string
    variation_label: string | null
    unit_price: number
    quantity: number
    line_total: number
    product_variations: {
        image_url: string | null
        image_urls?: string[] | null
        size: string | null
        color: string | null
        sku: string | null
    } | null
}

export type StoreOrder = {
    id: string
    status: string
    subtotal: number
    shipping_amount?: number
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
    shiprocket_order_id?: string | null
    tracking_number?: string | null
    courier_name?: string | null
    shipping_booking_state?: string | null
    shipping_package?: { length: number; breadth: number; height: number; weight: number; pickup_location: string; email: string } | null
    items: OrderItem[]
}

const PAYMENT_TABS = [
    { value: 'paid', label: 'Paid orders', color: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
    { value: 'pending', label: 'Payment pending', color: 'border-amber-300 bg-amber-50 text-amber-800' },
    { value: 'failed', label: 'Payment failed', color: 'border-rose-300 bg-rose-50 text-rose-800' },
    { value: 'all', label: 'All records', color: 'border-stone-400 bg-stone-100 text-stone-900' },
] as const
type PaymentFilter = typeof PAYMENT_TABS[number]['value']

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

const STATUS_LABEL: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
}

function variationText(item: OrderItem) {
    return (
        item.variation_label ||
        [item.product_variations?.size, item.product_variations?.color].filter(Boolean).join(' · ') ||
        item.product_variations?.sku ||
        '—'
    )
}

function paymentLabel(o: StoreOrder) {
    if (o.payment_status === 'pending') return 'Payment pending'
    if (o.payment_status === 'failed') return 'Payment failed'
    if (o.payment_status !== 'paid') return 'Payment not recorded'
    if (o.payment_method === 'razorpay') return 'Paid · Razorpay'
    if (o.payment_method === 'coupon') return 'Paid · Coupon (₹0)'
    return 'Paid'
}

const SHIPPING_BUTTON_STYLES = 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 focus-visible:outline-amber-600'
const SHIPMENT_BUTTON_STYLES = 'border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100 focus-visible:outline-blue-600'

const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700',
    confirmed: 'bg-blue-50 text-blue-700',
    shipped: 'bg-orange-100 text-orange-800 ring-1 ring-inset ring-orange-200',
    delivered: 'bg-emerald-50 text-emerald-700',
    cancelled: 'bg-rose-50 text-rose-600',
}

function EditOrderAddressModal({
    order,
    onClose,
    onSave,
}: {
    order: StoreOrder
    onClose: () => void
    onSave: (orderId: string, updated: UpdateOrderAddressInput) => void
}) {
    const [pending, setPending] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [form, setForm] = useState<UpdateOrderAddressInput>({
        ship_full_name: order.ship_full_name || '',
        ship_phone: order.ship_phone || '',
        ship_line1: order.ship_line1 || '',
        ship_line2: order.ship_line2 || '',
        ship_city: order.ship_city || '',
        ship_state: order.ship_state || '',
        ship_postal_code: order.ship_postal_code || '',
        ship_country: order.ship_country || 'India',
    })

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        setPending(true)
        try {
            await updateOrderAddress(order.id, form)
            onSave(order.id, form)
            toast.success('Order address and phone updated successfully')
            onClose()
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to update address'
            setError(message)
            toast.error(message)
        } finally {
            setPending(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-6 overflow-y-auto">
            <div className="w-full max-w-lg rounded-2xl border border-[#9c7d23]/30 bg-[#FFFEFB] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)] my-auto">
                <div className="mb-5 flex items-center justify-between border-b border-[#9c7d23]/15 pb-4">
                    <div>
                        <h2 className="text-base font-bold text-[#141414]">Edit Customer Contact & Address</h2>
                        <p className="text-xs text-[#8b8478] mt-0.5">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-[#8b8478] hover:bg-[#FAF7F1] hover:text-[#141414] transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8b8478]">
                                Recipient Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                required
                                value={form.ship_full_name}
                                onChange={(e) => setForm(f => ({ ...f, ship_full_name: e.target.value }))}
                                placeholder="Full Name"
                                className="w-full rounded-xl border border-[#9c7d23]/25 bg-[#FAF7F1] px-3.5 py-2.5 text-xs text-[#141414] outline-none focus:border-[#9c7d23] focus:bg-white"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8b8478]">
                                Phone Number <span className="text-rose-500">*</span>
                            </label>
                            <input
                                required
                                value={form.ship_phone}
                                onChange={(e) => setForm(f => ({ ...f, ship_phone: e.target.value }))}
                                placeholder="+91 9876543210"
                                className="w-full rounded-xl border border-[#9c7d23]/25 bg-[#FAF7F1] px-3.5 py-2.5 text-xs text-[#141414] outline-none focus:border-[#9c7d23] focus:bg-white"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8b8478]">
                            Street Address (Line 1) <span className="text-rose-500">*</span>
                        </label>
                        <input
                            required
                            value={form.ship_line1}
                            onChange={(e) => setForm(f => ({ ...f, ship_line1: e.target.value }))}
                            placeholder="House / Flat / Block No, Building, Street"
                            className="w-full rounded-xl border border-[#9c7d23]/25 bg-[#FAF7F1] px-3.5 py-2.5 text-xs text-[#141414] outline-none focus:border-[#9c7d23] focus:bg-white"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8b8478]">
                            Address Line 2 (Optional)
                        </label>
                        <input
                            value={form.ship_line2 || ''}
                            onChange={(e) => setForm(f => ({ ...f, ship_line2: e.target.value }))}
                            placeholder="Apartment, Landmark, Area"
                            className="w-full rounded-xl border border-[#9c7d23]/25 bg-[#FAF7F1] px-3.5 py-2.5 text-xs text-[#141414] outline-none focus:border-[#9c7d23] focus:bg-white"
                        />
                    </div>

                    <p className={`text-xs ${shippingAddress(form.ship_line1, form.ship_line2).length > SHIPPING_ADDRESS_LIMIT ? 'text-rose-600' : 'text-stone-500'}`}>
                        Address lines 1 + 2: {shippingAddress(form.ship_line1, form.ship_line2).length}/{SHIPPING_ADDRESS_LIMIT} characters. Keep the house number and street; shorten repeated landmarks if needed.
                    </p>
                    <div className="grid grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8b8478]">
                                City <span className="text-rose-500">*</span>
                            </label>
                            <input
                                required
                                value={form.ship_city}
                                onChange={(e) => setForm(f => ({ ...f, ship_city: e.target.value }))}
                                placeholder="City"
                                className="w-full rounded-xl border border-[#9c7d23]/25 bg-[#FAF7F1] px-3.5 py-2.5 text-xs text-[#141414] outline-none focus:border-[#9c7d23] focus:bg-white"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8b8478]">
                                State <span className="text-rose-500">*</span>
                            </label>
                            <input
                                required
                                value={form.ship_state}
                                onChange={(e) => setForm(f => ({ ...f, ship_state: e.target.value }))}
                                placeholder="State"
                                className="w-full rounded-xl border border-[#9c7d23]/25 bg-[#FAF7F1] px-3.5 py-2.5 text-xs text-[#141414] outline-none focus:border-[#9c7d23] focus:bg-white"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8b8478]">
                                Postal / PIN Code <span className="text-rose-500">*</span>
                            </label>
                            <input
                                required
                                value={form.ship_postal_code}
                                onChange={(e) => setForm(f => ({ ...f, ship_postal_code: e.target.value }))}
                                placeholder="560001"
                                className="w-full rounded-xl border border-[#9c7d23]/25 bg-[#FAF7F1] px-3.5 py-2.5 text-xs text-[#141414] outline-none focus:border-[#9c7d23] focus:bg-white"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8b8478]">
                                Country
                            </label>
                            <input
                                value={form.ship_country}
                                onChange={(e) => setForm(f => ({ ...f, ship_country: e.target.value }))}
                                placeholder="India"
                                className="w-full rounded-xl border border-[#9c7d23]/25 bg-[#FAF7F1] px-3.5 py-2.5 text-xs text-[#141414] outline-none focus:border-[#9c7d23] focus:bg-white"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-600">
                            {error}
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#9c7d23]/15">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={pending}
                            className="rounded-xl border border-[#9c7d23]/25 px-4 py-2.5 text-xs font-semibold text-[#8b8478] hover:bg-[#FAF7F1] hover:text-[#141414] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={pending}
                            className="flex items-center gap-2 rounded-xl bg-[#141414] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#F5F1E8] hover:bg-black transition-colors disabled:opacity-50"
                        >
                            {pending ? (
                                <>
                                    <Loader2 size={13} className="animate-spin" />
                                    Saving…
                                </>
                            ) : (
                                'Save Address'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function OrdersClient({ orders: initialOrders }: { orders: StoreOrder[] }) {
    const router = useRouter()
    const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('paid')
    const [statusUpdates, setStatusUpdates] = useState<Record<string, string>>({})
    const [previousOrders, setPreviousOrders] = useState(initialOrders)
    // Server refreshes include shipping status changes; discard older optimistic overrides.
    if (previousOrders !== initialOrders) {
        setPreviousOrders(initialOrders)
        setStatusUpdates({})
    }
    const [addressUpdates, setAddressUpdates] = useState<Record<string, Partial<StoreOrder>>>({})
    const [editingAddressOrder, setEditingAddressOrder] = useState<StoreOrder | null>(null)
    const orders = useMemo(() => initialOrders.map(order => {
        let updated = order
        if (statusUpdates[order.id]) {
            updated = { ...updated, status: statusUpdates[order.id] }
        }
        if (addressUpdates[order.id]) {
            updated = { ...updated, ...addressUpdates[order.id] }
        }
        return updated
    }), [initialOrders, statusUpdates, addressUpdates])
    const [shippingOrderId, setShippingOrderId] = useState<string | null>(null)
    const shippingOrder = orders.find(order => order.id === shippingOrderId && order.status !== 'cancelled')
    const [expanded, setExpanded] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [paymentResult, setPaymentResult] = useState<(Partial<PaymentSyncResult> & { orderId: string; message: string; ok: boolean }) | null>(null)
    const [syncingPaymentId, setSyncingPaymentId] = useState<string | null>(null)
    async function checkPayment(id: string) {
        setSyncingPaymentId(id)
        try {
            const result = await syncOrderPayment(id)
            setPaymentResult({ ...result, orderId: id })
            if (result.ok) router.refresh()
        } catch { setPaymentResult({ orderId: id, ok: false, message: 'Unable to sync payment. Please retry.' }) }
        finally { setSyncingPaymentId(null) }
    }

    const totalRevenue = useMemo(
        () => orders.reduce((sum, o) => sum + (o.status !== 'cancelled' && o.payment_status === 'paid' ? Number(o.total) : 0), 0),
        [orders]
    )
    const pendingCount = orders.filter((o) => o.status === 'pending').length
    const deliveredCount = orders.filter((o) => o.status === 'delivered').length
    const cancelledCount = orders.filter((o) => o.status === 'cancelled').length

    const filteredOrders = useMemo(() => {
        const q = search.trim().toLowerCase()
        return orders.filter((o) => {
            const matchesSearch =
                !q ||
                o.id.toLowerCase().includes(q) ||
                o.ship_full_name?.toLowerCase().includes(q) ||
                o.ship_phone?.toLowerCase().includes(q) ||
                o.coupon_code?.toLowerCase().includes(q) ||
                o.tracking_number?.toLowerCase().includes(q) ||
                o.shiprocket_order_id?.toLowerCase().includes(q) ||
                o.items.some(
                    (item) =>
                        item.product_name.toLowerCase().includes(q) ||
                        item.product_variations?.sku?.toLowerCase().includes(q)
                )
            const matchesStatus = statusFilter === 'all' || o.status === statusFilter
            return matchesSearch && matchesStatus && (paymentFilter === 'all' || o.payment_status === paymentFilter)
        })
    }, [orders, search, statusFilter, paymentFilter])

    async function handleStatusChange(orderId: string, newStatus: string) {
        setUpdatingId(orderId)
        const prevStatus = orders.find(order => order.id === orderId)?.status || 'pending'
        setStatusUpdates(previous => ({ ...previous, [orderId]: newStatus }))

        try {
            await updateOrderStatus(orderId, newStatus)
            toast.success(`Order status updated to ${newStatus}`)
        } catch (err) {
            setStatusUpdates(previous => ({ ...previous, [orderId]: prevStatus }))
            console.error('Failed to update order status:', err)
            toast.error('Failed to update order status')
        } finally {
            setUpdatingId(null)
        }
    }

    return (
        <div className="font-outfit text-[#141414]">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border border-[#9c7d23]/20 bg-white/60 backdrop-blur-md px-6 py-6 md:px-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-black">Orders</h1>
                    <p className="mt-1 text-sm font-medium text-stone-600">
                        {orders.length} order{orders.length === 1 ? '' : 's'} · manage orders, book shipping and view shipment details
                    </p>
                </div>
            </div>

            {/* Stat cards */}
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
                <div className="flex items-center gap-4 rounded-3xl border border-[#9c7d23]/10 bg-white/60 backdrop-blur-md p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-[#9c7d23]/30">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FAF7F1] text-[#9c7d23]">
                        <Layers size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8b8478]">Total Orders</p>
                        <p className="mt-1 text-2xl font-bold tracking-tight text-[#141414]">{orders.length}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 rounded-3xl border border-[#9c7d23]/10 bg-white/60 backdrop-blur-md p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-[#9c7d23]/30">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                        <IndianRupee size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8b8478]">Revenue</p>
                        <p className="mt-1 text-2xl font-bold tracking-tight text-[#141414]">₹{totalRevenue.toLocaleString()}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 rounded-3xl border border-[#9c7d23]/10 bg-white/60 backdrop-blur-md p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-[#9c7d23]/30">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                        <Clock size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8b8478]">Pending</p>
                        <p className="mt-1 text-2xl font-bold tracking-tight text-[#141414]">{pendingCount}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 rounded-3xl border border-[#9c7d23]/10 bg-white/60 backdrop-blur-md p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-[#9c7d23]/30">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                        <CheckCircle2 size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8b8478]">Delivered</p>
                        <p className="mt-1 text-2xl font-bold tracking-tight text-[#141414]">{deliveredCount}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 rounded-3xl border border-[#9c7d23]/10 bg-white/60 backdrop-blur-md p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-[#9c7d23]/30">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
                        <XCircle size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8b8478]">Cancelled</p>
                        <p className="mt-1 text-2xl font-bold tracking-tight text-[#141414]">{cancelledCount}</p>
                    </div>
                </div>
            </div>

            <nav aria-label="Order payment tabs" className="mb-4 flex flex-wrap gap-2">
                {PAYMENT_TABS.map(tab => {
                    const count = tab.value === 'all' ? orders.length : orders.filter(order => order.payment_status === tab.value).length
                    const selected = paymentFilter === tab.value
                    return <button key={tab.value} type="button" aria-pressed={selected} onClick={() => { setPaymentFilter(tab.value); setSearch(''); setStatusFilter('all'); setExpanded(null) }} className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-700 ${selected ? tab.color : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'}`}>
                        {tab.label}<span className="rounded-full bg-white/80 px-2 py-0.5 text-xs tabular-nums">{count}</span>
                    </button>
                })}
            </nav>
            <p aria-live="polite" className="mb-4 text-sm text-stone-500">{filteredOrders.length} {paymentFilter === 'paid' ? 'paid orders' : paymentFilter === 'pending' ? 'pending payments' : paymentFilter === 'failed' ? 'failed payments' : 'records'} shown. {paymentFilter === 'pending' ? 'A pending payment is not confirmed. Use Sync payment to check or capture an authorized payment.' : paymentFilter === 'failed' ? 'Use Sync payment to view the failure reason reported by Razorpay.' : ''}</p>

            {/* Search + filters */}
            <div className="mb-6 flex flex-wrap items-center gap-4 rounded-3xl border border-[#9c7d23]/20 bg-white/60 backdrop-blur-md p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="relative min-w-[220px] flex-1">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b8478]" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by order ID, customer, phone, product or SKU…"
                        className="w-full rounded-2xl border border-[#9c7d23]/20 bg-white/80 py-3 pl-11 pr-4 text-sm text-[#141414] outline-none transition-colors focus:border-[#9c7d23]/50 focus:bg-white"
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className="rounded-2xl border border-[#9c7d23]/20 bg-white/80 px-4 py-3 text-sm text-[#141414] outline-none transition-colors focus:border-[#9c7d23]/50 focus:bg-white cursor-pointer"
                >
                    <option value="all">All Statuses</option>
                    {Object.entries(STATUS_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </select>

                {(search || statusFilter !== 'all') && (
                    <button
                        onClick={() => {
                            setSearch('')
                            setStatusFilter('all')
                        }}
                        className="rounded-2xl border border-[#9c7d23]/20 px-4 py-3 text-sm font-semibold text-[#8b8478] hover:bg-[#FAF7F1] hover:text-[#141414] transition-colors"
                    >
                        Clear
                    </button>
                )}
                <button type="button" onClick={() => router.refresh()} className="rounded-xl border border-[#9c7d23]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#785e16]">Refresh orders</button>
            </div>

            <div className="hidden lg:block w-full max-w-[1080px] overflow-hidden rounded-3xl border border-[#9c7d23]/20 bg-white/60 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="overflow-x-auto">
                    <table className="min-w-[976px] w-full table-fixed text-left text-sm">
                    <colgroup>
                        <col className="w-16" />
                        <col className="w-28" />
                        <col className="w-48" />
                        <col className="w-28" />
                        <col className="w-20" />
                        <col className="w-28" />
                        <col className="w-32" />
                        <col className="w-44" />
                    </colgroup>
                    <thead className="bg-[#FAF7F1] text-[10px] uppercase tracking-[0.2em] text-[#8b8478]">
                        <tr>
                            <th className="w-16 px-3 py-4 font-semibold"></th>
                            <th className="px-3 py-4 font-semibold">Order</th>
                            <th className="px-3 py-4 font-semibold">Customer</th>
                            <th className="py-4 pl-3 pr-1 font-semibold">Date</th>
                            <th className="py-4 pl-1 pr-3 font-semibold">Items</th>
                            <th className="px-3 py-4 font-semibold">Amount</th>
                            <th className="px-3 py-4 font-semibold">Status</th>
                            <th className="px-3 py-4 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.map((o) => {
                            const isOpen = expanded === o.id
                            const itemCount = o.items.reduce((sum, i) => sum + i.quantity, 0)


                            return (
                                <Fragment key={o.id}>
                                    <tr className="border-t border-[#9c7d23]/10 hover:bg-white/40 transition-colors">
                                        <td className="px-3 py-4">
                                            <button
                                                onClick={() => setExpanded(isOpen ? null : o.id)}
                                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-[#9c7d23]/20 text-[#8b8478] transition-all hover:border-[#9c7d23]/50 hover:text-[#141414] hover:shadow-sm"
                                            >
                                                <ChevronDown
                                                    size={14}
                                                    strokeWidth={2.5}
                                                    className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                                                />
                                            </button>
                                        </td>
                                        <td className="px-3 py-4">
                                            <span className="font-semibold text-[#141414]">#{o.id.slice(0, 8).toUpperCase()}</span>
                                        </td>
                                        <td className="px-3 py-4">
                                            <div className="flex min-w-0 items-start gap-2">
                                                <div className="min-w-0">
                                                    <p title={o.ship_full_name} className="truncate font-semibold text-[#141414]">{o.ship_full_name}</p>
                                                    <p className="text-xs text-[#8b8478]">{o.ship_phone}</p>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setEditingAddressOrder(o)
                                                    }}
                                                    title="Edit phone & delivery address"
                                                    className="shrink-0 p-1 rounded-lg text-[#8b8478] hover:text-[#9c7d23] hover:bg-white transition-colors"
                                                >
                                                    <Pencil size={13} />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="py-4 pl-3 pr-1">
                                            <p className="font-medium text-[#141414]">{new Date(o.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                                            <p className="mt-1 text-xs text-[#8b8478]">{new Date(o.created_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                                        </td>
                                        <td className="py-4 pl-1 pr-3 text-[#8b8478]">{itemCount} items</td>
                                        <td className="px-3 py-4 font-bold text-[#141414]">
                                            ₹{Number(o.total).toLocaleString()}
                                            <p className={`mt-1 text-[10px] font-medium ${o.payment_status === 'failed' ? 'text-rose-700' : o.payment_status === 'pending' ? 'text-amber-700' : 'text-emerald-700'}`}>{paymentLabel(o)}</p>
                                        </td>
                                        <td className="px-3 py-4">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-wider font-bold ${
                                                        STATUS_STYLES[o.status] ?? 'bg-stone-100 text-stone-500'
                                                    }`}
                                                >
                                                    {STATUS_LABEL[o.status] ?? o.status}
                                                </span>
                                                {updatingId === o.id && (
                                                    <Loader2 size={14} className="animate-spin text-[#9c7d23]" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 pl-3 pr-2">
                                            <div className="flex items-center justify-end gap-2">
                                                {o.payment_method === 'razorpay' && ['pending', 'failed'].includes(o.payment_status ?? '') && <button type="button" disabled={syncingPaymentId !== null} onClick={() => checkPayment(o.id)} className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl border border-stone-300 bg-white px-3 text-xs font-semibold text-stone-700 disabled:opacity-50">{syncingPaymentId === o.id ? 'Checking…' : 'Sync payment'}</button>}
                                                {o.status !== 'cancelled' && (o.payment_status === 'paid' || o.payment_method === 'cod') && (<button type="button" onClick={() => setShippingOrderId(o.id)} className={`inline-flex h-9 min-w-28 shrink-0 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${o.shiprocket_order_id ? SHIPMENT_BUTTON_STYLES : SHIPPING_BUTTON_STYLES}`}>
                                                    <Truck size={14} />{o.shiprocket_order_id ? 'Shipment' : 'Shipping'}
                                                </button>)}
                                                {(o.payment_status === 'paid' || o.payment_status == null) && (<a
                                                    href={`/admin/orders/invoice/${o.id}`}
                                                    download
                                                    onClick={(e) => e.stopPropagation()}
                                                    title="Download invoice"
                                                    aria-label="Download invoice"
                                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-[#9c7d23]/20 text-[#8b8478] transition-all hover:border-[#9c7d23]/50 hover:text-[#141414] hover:shadow-sm"
                                                >
                                                    <Download size={14} strokeWidth={2} />
                                                </a>)}
                                            </div>
                                        </td>
                                    </tr>

                                    {isOpen && (
                                        <tr>
                                            <td colSpan={8} className="bg-stone-50/60 px-0 py-0 whitespace-normal">
                                                <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-5 px-6 py-4">
                                                    {/* Items + variations */}
                                                    <div className="min-w-0">
                                                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                                                            Items & Variations
                                                        </p>
                                                        <div className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
                                                            {o.items.map((item) => (
                                                                <div key={item.id} className="flex items-center gap-3 px-3 py-2">
                                                                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-stone-200"><OrderItemPhoto item={item} name={item.product_name} /></div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="truncate text-sm font-medium text-black" title={item.product_name}>
                                                                            {item.product_name}
                                                                        </p>
                                                                        <p className="truncate text-[11px] text-stone-500" title={variationText(item)}>
                                                                            {variationText(item)} · Qty {item.quantity}
                                                                        </p>
                                                                    </div>
                                                                    <div className="shrink-0 text-right">
                                                                        <p className="text-xs text-stone-400">
                                                                            ₹{Number(item.unit_price).toLocaleString()} each
                                                                        </p>
                                                                        <p className="text-sm font-semibold text-black">
                                                                            ₹{Number(item.line_total).toLocaleString()}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>


                                                        {/* Shipping address */}
                                                        <div className="mb-2 mt-4 flex items-center justify-between">
                                                            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                                                                Shipping Address
                                                            </p>
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditingAddressOrder(o)}
                                                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9c7d23] hover:text-[#785e16] transition-colors"
                                                            >
                                                                <Pencil size={12} />
                                                                Edit Address & Phone
                                                            </button>
                                                        </div>
                                                        <div className="flex items-start gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2.5">
                                                            <MapPin size={13} className="mt-0.5 shrink-0 text-stone-400" />
                                                            <div className="min-w-0 text-xs leading-relaxed text-stone-600 break-words">
                                                                <p className="font-medium text-black">
                                                                    {o.ship_full_name}
                                                                    <span className="ml-2 font-normal text-stone-400">{o.ship_phone}</span>
                                                                </p>
                                                                <p>
                                                                    {o.ship_line1}
                                                                    {o.ship_line2 ? `, ${o.ship_line2}` : ''}
                                                                </p>
                                                                <p>
                                                                    {[o.ship_city, o.ship_state, o.ship_postal_code, o.ship_country]
                                                                        .filter(Boolean)
                                                                        .join(', ')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Payment summary + status control */}
                                                    <div className="min-w-0">
                                                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                                                            Payment Summary
                                                        </p>
                                                        <div className="space-y-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm">
                                                            <div className="flex justify-between text-stone-600">
                                                                <span>Subtotal</span>
                                                                <span>₹{Number(o.subtotal).toLocaleString()}</span>
                                                            </div>
                                                            {Number(o.discount_amount) > 0 && (
                                                                <div className="flex justify-between text-emerald-600">
                                                                    <span>
                                                                        Discount {o.coupon_code ? `(${o.coupon_code})` : ''}
                                                                    </span>
                                                                    <span>−₹{Number(o.discount_amount).toLocaleString()}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex justify-between text-stone-600"><span>Shipping Charges</span><span>₹{Number(o.shipping_amount ?? 0).toLocaleString('en-IN')}</span></div>
                                                            <div className="flex justify-between border-t border-stone-100 pt-2 text-base font-bold text-black">
                                                                <span>{o.payment_status === 'paid' ? 'Amount Paid' : 'Order Total'}</span>
                                                                <span>₹{Number(o.total).toLocaleString()}</span>
                                                            </div>
                                                            <div className="flex justify-between gap-3 text-xs text-stone-500">
                                                                <span>Payment</span>
                                                                <span className="text-right">
                                                                    {paymentLabel(o)}
                                                                    {o.razorpay_payment_id && (
                                                                        <span className="block break-all font-mono text-[11px] text-stone-400">
                                                                            {o.razorpay_payment_id}
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                                                            Update Status
                                                        </p>
                                                        <select
                                                            value={o.status}
                                                            disabled={updatingId === o.id}
                                                            onChange={(e) => handleStatusChange(o.id, e.target.value)}
                                                            className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm font-medium text-black outline-none focus:border-black disabled:opacity-40"
                                                        >
                                                            {Object.entries(STATUS_LABEL).map(([value, label]) => (
                                                                <option key={value} value={value}>
                                                                    {label}
                                                                </option>
                                                            ))}
                                                        </select>

                                                        {(o.payment_status === 'paid' || o.payment_status == null) && (<a
                                                            href={`/admin/orders/invoice/${o.id}`}
                                                            download
                                                            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-stone-700 hover:border-black hover:text-black"
                                                        >
                                                            <Download size={14} />
                                                            Download Invoice
                                                        </a>)}
                                                    </div>
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
                                    {orders.length === 0 ? 'No orders yet.' : 'No orders match your search or filter.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                </div>
            </div>

            {/* Mobile Card Layout */}
            <div className="flex flex-col gap-4 lg:hidden">
                {filteredOrders.map((o) => {
                    const isOpen = expanded === o.id;
                    const itemCount = o.items.reduce((sum, i) => sum + i.quantity, 0);
                    const orderDate = new Date(o.created_at).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                    });

                    return (
                        <div key={o.id} className="rounded-2xl border border-[#9c7d23]/20 bg-white/60 backdrop-blur-md shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col overflow-hidden">
                            <div className="p-4 flex items-center justify-between border-b border-[#9c7d23]/10">
                                <div>
                                    <span className="font-semibold text-[#141414] text-sm">#{o.id.slice(0, 8).toUpperCase()}</span>
                                    <p className="text-[11px] text-[#8b8478] mt-0.5">{orderDate}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span
                                        className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold ${
                                            STATUS_STYLES[o.status] ?? 'bg-stone-100 text-stone-500'
                                        }`}
                                    >
                                        {STATUS_LABEL[o.status] ?? o.status}
                                    </span>
                                    {updatingId === o.id && (
                                        <Loader2 size={12} className="animate-spin text-[#9c7d23]" />
                                    )}
                                </div>
                            </div>

                            <div className="p-4 flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <p className="font-semibold text-[#141414] text-sm">{o.ship_full_name}</p>
                                            <button
                                                type="button"
                                                onClick={() => setEditingAddressOrder(o)}
                                                className="p-1 text-[#8b8478] hover:text-[#9c7d23]"
                                                title="Edit Contact & Address"
                                            >
                                                <Pencil size={12} />
                                            </button>
                                        </div>
                                        <p className="text-xs text-[#8b8478]">{o.ship_phone}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-[#141414] text-sm">₹{Number(o.total).toLocaleString()}</p>
                                        <p className="text-xs text-[#8b8478]">{itemCount} items</p>
                                        <p className={`mt-1 text-xs ${o.payment_status === 'failed' ? 'text-rose-700' : o.payment_status === 'pending' ? 'text-amber-700' : 'text-emerald-700'}`}>{paymentLabel(o)}</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                    {o.payment_method === 'razorpay' && ['pending', 'failed'].includes(o.payment_status ?? '') && <button type="button" disabled={syncingPaymentId !== null} onClick={() => checkPayment(o.id)} className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl border border-stone-300 bg-white px-3 text-xs font-semibold text-stone-700 disabled:opacity-50">{syncingPaymentId === o.id ? 'Checking…' : 'Sync payment'}</button>}
                                                {o.status !== 'cancelled' && (o.payment_status === 'paid' || o.payment_method === 'cod') && (<button type="button" onClick={() => setShippingOrderId(o.id)} className={`inline-flex h-9 min-w-28 shrink-0 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${o.shiprocket_order_id ? SHIPMENT_BUTTON_STYLES : SHIPPING_BUTTON_STYLES}`}>
                                                    <Truck size={14} />{o.shiprocket_order_id ? 'Shipment' : 'Shipping'}
                                                </button>)}
                                    <button
                                        onClick={() => setExpanded(isOpen ? null : o.id)}
                                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white border border-[#9c7d23]/20 py-2 text-xs font-semibold text-[#8b8478] hover:border-[#9c7d23]/50 hover:text-[#141414]"
                                    >
                                        {isOpen ? 'Hide Details' : 'View Details'}
                                        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {(o.payment_status === 'paid' || o.payment_status == null) && (<a
                                        href={`/admin/orders/invoice/${o.id}`}
                                        download
                                        className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl bg-white border border-[#9c7d23]/20 text-[#8b8478] hover:border-[#9c7d23]/50 hover:text-[#141414]"
                                    >
                                        <Download size={14} />
                                    </a>)}
                                </div>
                            </div>

                            {isOpen && (
                                <div className="bg-[#FAF7F1] p-4 border-t border-[#9c7d23]/10 flex flex-col gap-5">
                                    {/* Items */}
                                    <div>
                                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#8b8478]">
                                            Items
                                        </p>
                                        <div className="divide-y divide-[#9c7d23]/10 rounded-xl border border-[#9c7d23]/10 bg-white">
                                            {o.items.map((item) => (
                                                <div key={item.id} className="flex gap-3 p-3">
                                                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-stone-200"><OrderItemPhoto item={item} name={item.product_name} /></div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-semibold text-[#141414] leading-tight">
                                                            {item.product_name}
                                                        </p>
                                                        <p className="truncate text-[10px] text-[#8b8478] mt-0.5" title={variationText(item)}>
                                                            {variationText(item)} · Qty {item.quantity}
                                                        </p>
                                                        <div className="mt-1.5 flex items-center justify-between">
                                                            <p className="text-[10px] text-[#8b8478]">
                                                                ₹{Number(item.unit_price).toLocaleString()} each
                                                            </p>
                                                            <p className="text-xs font-bold text-[#141414]">
                                                                ₹{Number(item.line_total).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Shipping */}
                                    <div>
                                        <div className="mb-2 flex items-center justify-between">
                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8b8478]">
                                                Shipping Address
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => setEditingAddressOrder(o)}
                                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#9c7d23] hover:text-[#785e16]"
                                            >
                                                <Pencil size={11} />
                                                Edit
                                            </button>
                                        </div>
                                        <div className="flex items-start gap-2 rounded-xl border border-[#9c7d23]/10 bg-white p-3">
                                            <MapPin size={14} className="mt-0.5 shrink-0 text-[#8b8478]" />
                                            <div className="min-w-0 text-xs text-stone-600 break-words">
                                                <p className="font-semibold text-[#141414]">{o.ship_full_name}</p>
                                                <p className="mt-0.5 leading-relaxed text-[#8b8478]">
                                                    {o.ship_line1}
                                                    {o.ship_line2 ? `, ${o.ship_line2}` : ''}, {o.ship_city},{' '}
                                                    {o.ship_state} {o.ship_postal_code}, {o.ship_country}
                                                </p>
                                            </div>
                                        </div>
                                    </div>


                                    {/* Actions */}
                                    <div>
                                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#8b8478]">
                                            Update Status
                                        </p>
                                        <select
                                            value={o.status}
                                            disabled={updatingId === o.id}
                                            onChange={(e) => handleStatusChange(o.id, e.target.value)}
                                            className="w-full rounded-xl border border-[#9c7d23]/20 bg-white px-3.5 py-2.5 text-xs font-semibold text-[#141414] outline-none focus:border-[#9c7d23]/50 disabled:opacity-40 mb-4"
                                        >
                                            {Object.entries(STATUS_LABEL).map(([value, label]) => (
                                                <option key={value} value={value}>
                                                    {label}
                                                </option>
                                            ))}
                                        </select>

                                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#8b8478]">
                                            Summary
                                        </p>
                                        <div className="space-y-1.5 rounded-xl border border-[#9c7d23]/10 bg-white p-3 text-xs">
                                            <div className="flex justify-between text-stone-500">
                                                <span>Subtotal</span>
                                                <span>₹{Number(o.subtotal).toLocaleString()}</span>
                                            </div>
                                            {Number(o.discount_amount) > 0 && (
                                                <div className="flex justify-between text-emerald-600">
                                                    <span>
                                                        Discount {o.coupon_code ? `(${o.coupon_code})` : ''}
                                                    </span>
                                                    <span>−₹{Number(o.discount_amount).toLocaleString()}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-stone-500"><span>Shipping Charges</span><span>₹{Number(o.shipping_amount ?? 0).toLocaleString('en-IN')}</span></div>
                                            <div className="flex justify-between border-t border-[#9c7d23]/10 pt-2 text-sm font-bold text-[#141414]">
                                                <span>Total</span>
                                                <span>₹{Number(o.total).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between gap-3 text-stone-500">
                                                <span>Payment</span>
                                                <span className="text-right">
                                                    {paymentLabel(o)}
                                                    {o.razorpay_payment_id && (
                                                        <span className="block font-mono text-[10px] text-stone-400">
                                                            {o.razorpay_payment_id}
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {filteredOrders.length === 0 && (
                    <div className="rounded-2xl border border-[#9c7d23]/20 bg-white/60 p-8 text-center text-sm text-[#8b8478]">
                        {orders.length === 0 ? 'No orders yet.' : 'No orders match your search or filter.'}
                    </div>
                )}
            </div>
            {paymentResult && <PaymentResultDialog result={paymentResult} onClose={() => setPaymentResult(null)} />}
            {shippingOrder && <ShiprocketOrderDialog key={shippingOrder.id} order={shippingOrder} onClose={() => setShippingOrderId(null)} />}
            {editingAddressOrder && (
                <EditOrderAddressModal
                    key={editingAddressOrder.id}
                    order={editingAddressOrder}
                    onClose={() => setEditingAddressOrder(null)}
                    onSave={(orderId, updated) => setAddressUpdates(prev => ({ ...prev, [orderId]: updated }))}
                />
            )}
        </div>
    )
}