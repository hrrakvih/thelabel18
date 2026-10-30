'use client'

import { useMemo, useState, useTransition } from 'react'
import { Poppins } from 'next/font/google'
import {
    Plus,
    Trash2,
    X,
    Pencil,
    Tag,
    Copy,
    Check,
    Eye,
    Search,
    Layers,
    CheckCircle2,
    XCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { addCoupon, updateCoupon, toggleCouponActive, deleteCoupon } from './actions'

const poppins = Poppins({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
})

export type Coupon = {
    id: string
    code: string
    description: string | null
    discount_type: 'percentage' | 'fixed'
    discount_value: number
    max_discount_amount: number | null
    min_order_value: number
    usage_limit: number | null
    used_count: number
    valid_from: string
    valid_until: string | null
    is_active: boolean
}

type StatusFilter = 'all' | 'active' | 'inactive' | 'expired' | 'exhausted'

function formatDiscount(c: Pick<Coupon, 'discount_type' | 'discount_value' | 'max_discount_amount'>) {
    if (c.discount_type === 'percentage') {
        const cap = c.max_discount_amount ? ` (up to ₹${c.max_discount_amount})` : ''
        return `${c.discount_value}% off${cap}`
    }
    return `₹${c.discount_value} off`
}

function formatDate(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Converts an ISO timestamp to the value a <input type="datetime-local">
// expects (local time, no timezone suffix, minute precision).
function toDatetimeLocalValue(iso: string | null) {
    if (!iso) return ''
    const d = new Date(iso)
    const offsetMs = d.getTimezoneOffset() * 60000
    return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16)
}

function isExpired(coupon: Coupon) {
    return coupon.valid_until ? new Date(coupon.valid_until) < new Date() : false
}

function isExhausted(coupon: Coupon) {
    return coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit
}

// Single source of truth for a coupon's effective status, used by both the
// badge and the filter dropdown so they never disagree.
function getStatus(coupon: Coupon): Exclude<StatusFilter, 'all'> {
    if (!coupon.is_active) return 'inactive'
    if (isExpired(coupon)) return 'expired'
    if (isExhausted(coupon)) return 'exhausted'
    return 'active'
}

function StatusBadge({ coupon }: { coupon: Coupon }) {
    const status = getStatus(coupon)
    if (status === 'inactive') {
        return (
            <span className="inline-flex rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-500">
                Inactive
            </span>
        )
    }
    if (status === 'expired') {
        return (
            <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-500">
                Expired
            </span>
        )
    }
    if (status === 'exhausted') {
        return (
            <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600">
                Limit reached
            </span>
        )
    }
    return (
        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
            Active
        </span>
    )
}

function ActiveToggle({ id, isActive }: { id: string; isActive: boolean }) {
    const [pending, startTransition] = useTransition()
    const [checked, setChecked] = useState(isActive)

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={pending}
            onClick={() => {
                const next = !checked
                setChecked(next) // optimistic
                startTransition(async () => {
                    try {
                        await toggleCouponActive(id, next)
                        toast.success(next ? 'Coupon activated' : 'Coupon deactivated')
                    } catch {
                        setChecked(!next) // revert on failure
                        toast.error('Failed to update coupon status')
                    }
                })
            }}
            className={[
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50',
                checked ? 'bg-[#141414]' : 'bg-[#D1C9B8]',
            ].join(' ')}
        >
            <span
                className={[
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#FAF7F1] shadow-md ring-0 transition-transform duration-200 ease-in-out',
                    checked ? 'translate-x-5' : 'translate-x-0',
                ].join(' ')}
            />
        </button>
    )
}

function CouponForm({
    coupon,
    onSubmitForm,
    pending,
    error,
    submitLabel,
}: {
    coupon?: Coupon
    onSubmitForm: (formData: FormData) => void
    pending: boolean
    error: string | null
    submitLabel: string
}) {
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(
        coupon?.discount_type ?? 'percentage'
    )

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault()
                onSubmitForm(new FormData(e.currentTarget))
            }}
            className="space-y-4"
        >
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="block text-xs font-medium uppercase tracking-wider text-[#8b8478]">
                        Coupon Code
                    </label>
                    <input
                        name="code"
                        required
                        defaultValue={coupon?.code}
                        placeholder="SAVE20"
                        className="w-full rounded-xl border border-[#E4DDCE] bg-[#FAF7F1] px-3.5 py-2.5 text-sm uppercase text-[#141414] outline-none focus:border-[#141414]"
                    />
                    <p className="text-[11px] text-[#8b8478]">Letters, numbers, - and _ only.</p>
                </div>

                <div className="space-y-1.5">
                    <label className="block text-xs font-medium uppercase tracking-wider text-[#8b8478]">
                        Description
                    </label>
                    <input
                        name="description"
                        defaultValue={coupon?.description ?? ''}
                        placeholder="Internal note — e.g. Diwali sale"
                        className="w-full rounded-xl border border-[#E4DDCE] bg-[#FAF7F1] px-3.5 py-2.5 text-sm text-[#141414] outline-none focus:border-[#141414]"
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                    <label className="block text-xs font-medium uppercase tracking-wider text-[#8b8478]">
                        Discount Type
                    </label>
                    <select
                        name="discount_type"
                        required
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                        className="w-full rounded-xl border border-[#E4DDCE] bg-[#FAF7F1] px-3.5 py-2.5 text-sm text-[#141414] outline-none focus:border-[#141414]"
                    >
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed Amount</option>
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="block text-xs font-medium uppercase tracking-wider text-[#8b8478]">
                        {discountType === 'percentage' ? 'Percent Off' : 'Amount Off (₹)'}
                    </label>
                    <input
                        name="discount_value"
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={discountType === 'percentage' ? 100 : undefined}
                        required
                        defaultValue={coupon?.discount_value}
                        className="w-full rounded-xl border border-[#E4DDCE] bg-[#FAF7F1] px-3.5 py-2.5 text-sm text-[#141414] outline-none focus:border-[#141414]"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="block text-xs font-medium uppercase tracking-wider text-[#8b8478]">
                        Max Discount (₹)
                    </label>
                    <input
                        name="max_discount_amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        disabled={discountType !== 'percentage'}
                        defaultValue={coupon?.max_discount_amount ?? ''}
                        placeholder={discountType === 'percentage' ? 'Optional cap' : 'N/A'}
                        className="w-full rounded-xl border border-[#E4DDCE] bg-[#FAF7F1] px-3.5 py-2.5 text-sm text-[#141414] outline-none focus:border-[#141414] disabled:cursor-not-allowed disabled:opacity-40"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="block text-xs font-medium uppercase tracking-wider text-[#8b8478]">
                        Min Order Value (₹)
                    </label>
                    <input
                        name="min_order_value"
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={coupon?.min_order_value ?? 0}
                        className="w-full rounded-xl border border-[#E4DDCE] bg-[#FAF7F1] px-3.5 py-2.5 text-sm text-[#141414] outline-none focus:border-[#141414]"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="block text-xs font-medium uppercase tracking-wider text-[#8b8478]">
                        Usage Limit
                    </label>
                    <input
                        name="usage_limit"
                        type="number"
                        min="1"
                        defaultValue={coupon?.usage_limit ?? ''}
                        placeholder="Blank = unlimited"
                        className="w-full rounded-xl border border-[#E4DDCE] bg-[#FAF7F1] px-3.5 py-2.5 text-sm text-[#141414] outline-none focus:border-[#141414]"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="block text-xs font-medium uppercase tracking-wider text-[#8b8478]">
                        Valid From
                    </label>
                    <input
                        name="valid_from"
                        type="datetime-local"
                        required
                        defaultValue={
                            coupon
                                ? toDatetimeLocalValue(coupon.valid_from)
                                : toDatetimeLocalValue(new Date().toISOString())
                        }
                        className="w-full rounded-xl border border-[#E4DDCE] bg-[#FAF7F1] px-3.5 py-2.5 text-sm text-[#141414] outline-none focus:border-[#141414]"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="block text-xs font-medium uppercase tracking-wider text-[#8b8478]">
                        Valid Until
                    </label>
                    <input
                        name="valid_until"
                        type="datetime-local"
                        defaultValue={toDatetimeLocalValue(coupon?.valid_until ?? null)}
                        className="w-full rounded-xl border border-[#E4DDCE] bg-[#FAF7F1] px-3.5 py-2.5 text-sm text-[#141414] outline-none focus:border-[#141414]"
                    />
                    <p className="text-[11px] text-[#8b8478]">Blank = never expires.</p>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-600">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={pending}
                className="w-full rounded-xl bg-[#141414] py-3 text-xs font-bold uppercase tracking-widest text-[#F5F1E8] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
                {pending ? 'Saving…' : submitLabel}
            </button>
        </form>
    )
}

function ViewCouponModal({ coupon, onClose }: { coupon: Coupon; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="w-full max-w-lg rounded-2xl border border-[#E4DDCE] bg-[#FFFEFB] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.15)] max-h-[90vh] overflow-y-auto">
                <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Tag size={18} className="text-stone-400" />
                        <h2 className="text-lg font-bold font-outfit text-[#141414]">{coupon.code}</h2>
                    </div>
                    <button onClick={onClose} className="text-[#8b8478] hover:text-[#141414]">
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-4 text-sm">
                    <div className="flex justify-between border-b border-stone-100 pb-3">
                        <span className="text-stone-500">Status</span>
                        <StatusBadge coupon={coupon} />
                    </div>
                    <div className="flex justify-between border-b border-stone-100 pb-3">
                        <span className="text-stone-500">Description</span>
                        <span className="text-stone-800 font-medium text-right max-w-[240px] truncate">{coupon.description || '—'}</span>
                    </div>
                    <div className="flex justify-between border-b border-stone-100 pb-3">
                        <span className="text-stone-500">Discount</span>
                        <span className="text-stone-800 font-semibold">{formatDiscount(coupon)}</span>
                    </div>
                    <div className="flex justify-between border-b border-stone-100 pb-3">
                        <span className="text-stone-500">Min Order Value</span>
                        <span className="text-stone-800 font-medium">₹{coupon.min_order_value}</span>
                    </div>
                    <div className="flex justify-between border-b border-stone-100 pb-3">
                        <span className="text-stone-500">Usage Stats</span>
                        <span className="text-stone-800 font-medium">
                            {coupon.used_count} {coupon.usage_limit ? `/ ${coupon.usage_limit}` : '/ Unlimited'}
                        </span>
                    </div>
                    <div className="flex justify-between border-b border-stone-100 pb-3">
                        <span className="text-stone-500">Valid From</span>
                        <span className="text-stone-800 font-medium">{formatDateTime(coupon.valid_from)}</span>
                    </div>
                    <div className="flex justify-between pb-1">
                        <span className="text-stone-500">Valid Until</span>
                        <span className="text-stone-800 font-medium">{formatDateTime(coupon.valid_until)}</span>
                    </div>
                </div>

                <div className="mt-6">
                    <button
                        onClick={onClose}
                        className="w-full rounded-xl bg-stone-100 py-2.5 text-xs font-bold uppercase tracking-widest text-stone-700 transition-colors hover:bg-stone-200"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

function AddCouponModal({ onClose }: { onClose: () => void }) {
    const [pending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="w-full max-w-2xl rounded-2xl border border-[#E4DDCE] bg-[#FFFEFB] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.15)] max-h-[90vh] overflow-y-auto">
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-lg font-medium text-[#141414]">Add Coupon</h2>
                    <button onClick={onClose} className="text-[#8b8478] hover:text-[#141414]">
                        <X size={18} />
                    </button>
                </div>

                <CouponForm
                    pending={pending}
                    error={error}
                    submitLabel="Save Coupon"
                    onSubmitForm={(formData) => {
                        setError(null)
                        startTransition(async () => {
                            try {
                                await addCoupon(formData)
                                toast.success('Coupon created successfully')
                                onClose()
                            } catch (err) {
                                setError(err instanceof Error ? err.message : 'Something went wrong')
                                toast.error('Failed to create coupon')
                            }
                        })
                    }}
                />
            </div>
        </div>
    )
}

function EditCouponModal({ coupon, onClose }: { coupon: Coupon; onClose: () => void }) {
    const [pending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="w-full max-w-2xl rounded-2xl border border-[#E4DDCE] bg-[#FFFEFB] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.15)] max-h-[90vh] overflow-y-auto">
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-lg font-medium text-[#141414]">Edit Coupon</h2>
                    <button onClick={onClose} className="text-[#8b8478] hover:text-[#141414]">
                        <X size={18} />
                    </button>
                </div>

                <CouponForm
                    coupon={coupon}
                    pending={pending}
                    error={error}
                    submitLabel="Save Changes"
                    onSubmitForm={(formData) => {
                        setError(null)
                        startTransition(async () => {
                            try {
                                await updateCoupon(coupon.id, formData)
                                toast.success('Coupon updated successfully')
                                onClose()
                            } catch (err) {
                                setError(err instanceof Error ? err.message : 'Something went wrong')
                                toast.error('Failed to update coupon')
                            }
                        })
                    }}
                />
            </div>
        </div>
    )
}

export default function CouponsClient({ coupons }: { coupons: Coupon[] }) {
    const [showModal, setShowModal] = useState(false)
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
    const [viewingCoupon, setViewingCoupon] = useState<Coupon | null>(null)
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
    const [, startTransition] = useTransition()

    const activeCount = coupons.filter((c) => getStatus(c) === 'active').length
    const inactiveCount = coupons.length - activeCount

    const filteredCoupons = useMemo(() => {
        const q = search.trim().toLowerCase()
        return coupons.filter((c) => {
            const matchesSearch =
                !q ||
                c.code.toLowerCase().includes(q) ||
                (c.description || '').toLowerCase().includes(q)
            const matchesStatus = statusFilter === 'all' || getStatus(c) === statusFilter
            return matchesSearch && matchesStatus
        })
    }, [coupons, search, statusFilter])

    const handleCopy = (code: string, id: string) => {
        navigator.clipboard.writeText(code)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const selectClass =
        'rounded-xl border border-[#E4DDCE] bg-[#FAF7F1] px-3.5 py-2.5 text-sm text-[#141414] outline-none focus:border-[#141414]'

    return (
        <div className={poppins.className}>
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white px-4 py-5 md:px-6 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-black">Coupons</h1>
                    <p className="mt-1 text-sm font-medium text-stone-600">
                        {coupons.length} coupon{coupons.length === 1 ? '' : 's'} · toggle to enable or disable a code instantly
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex w-full md:w-auto justify-center items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.99]"
                >
                    <Plus size={15} strokeWidth={2} />
                    Add Coupon
                </button>
            </div>

            {/* Stat cards */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
                <div className="flex items-center gap-3 sm:gap-4 rounded-2xl border border-stone-200 bg-white p-3.5 sm:p-5 shadow-sm">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600 shrink-0">
                        <Layers size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                            Total Coupons
                        </p>
                        <p className="mt-0.5 text-2xl font-bold text-black">{coupons.length}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 rounded-2xl border border-stone-200 bg-white p-3.5 sm:p-5 shadow-sm">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <CheckCircle2 size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                            Active
                        </p>
                        <p className="mt-0.5 text-2xl font-bold text-black">{activeCount}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 rounded-2xl border border-stone-200 bg-white p-3.5 sm:p-5 shadow-sm">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                        <XCircle size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                            Inactive / Expired
                        </p>
                        <p className="mt-0.5 text-2xl font-bold text-black">{inactiveCount}</p>
                    </div>
                </div>
            </div>

            {/* Search + filter */}
            <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                <div className="relative min-w-[220px] flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by coupon code or description…"
                        className="w-full rounded-xl border border-stone-300 bg-white py-2.5 pl-10 pr-3.5 text-sm text-black outline-none focus:border-black"
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className={selectClass}
                >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="expired">Expired</option>
                    <option value="exhausted">Limit reached</option>
                </select>

                {(search || statusFilter !== 'all') && (
                    <button
                        onClick={() => {
                            setSearch('')
                            setStatusFilter('all')
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
                                <th className="px-6 py-3 font-semibold">Code</th>
                                <th className="px-6 py-3 font-semibold">Discount</th>
                                <th className="px-6 py-3 font-semibold">Min Order</th>
                                <th className="px-6 py-3 font-semibold">Usage</th>
                                <th className="px-6 py-3 font-semibold">Valid Until</th>
                                <th className="px-6 py-3 font-semibold">Status</th>
                                <th className="px-6 py-3 font-semibold">Enabled</th>
                                <th className="px-6 py-3 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCoupons.map((c) => (
                                <tr key={c.id} className="border-t border-stone-100 transition-colors hover:bg-stone-50">
                                    <td className="px-6 py-3.5">
                                        <div className="flex items-center gap-2">
                                            <Tag size={14} className="text-stone-400" />
                                            <span className="font-outfit font-semibold text-black">{c.code}</span>
                                            <button
                                                onClick={() => handleCopy(c.code, c.id)}
                                                className="text-stone-400 hover:text-stone-700 transition-colors"
                                                title="Copy code"
                                            >
                                                {copiedId === c.id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                                            </button>
                                        </div>
                                        {c.description && (
                                            <p className="mt-0.5 max-w-[180px] truncate text-xs text-stone-500">
                                                {c.description}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-6 py-3.5 text-stone-700">{formatDiscount(c)}</td>
                                    <td className="px-6 py-3.5 text-stone-600">
                                        {c.min_order_value > 0 ? `₹${c.min_order_value}` : '—'}
                                    </td>
                                    <td className="px-6 py-3.5 text-stone-600">
                                        {c.used_count}
                                        {c.usage_limit ? ` / ${c.usage_limit}` : ' / ∞'}
                                    </td>
                                    <td className="px-6 py-3.5 text-stone-600">{formatDate(c.valid_until)}</td>
                                    <td className="px-6 py-3.5">
                                        <StatusBadge coupon={c} />
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <ActiveToggle id={c.id} isActive={c.is_active} />
                                    </td>
                                    <td className="px-6 py-3.5 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => setViewingCoupon(c)}
                                                className="rounded-lg p-2 text-stone-300 transition-colors hover:bg-stone-100 hover:text-[#141414]"
                                                aria-label={`View ${c.code}`}
                                                title="View details"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => setEditingCoupon(c)}
                                                className="rounded-lg p-2 text-stone-300 transition-colors hover:bg-stone-100 hover:text-[#141414]"
                                                aria-label={`Edit ${c.code}`}
                                                title="Edit coupon"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => startTransition(async () => { try { await deleteCoupon(c.id); toast.success('Coupon deleted') } catch { toast.error('Failed to delete coupon') } })}
                                                className="rounded-lg p-2 text-stone-300 transition-colors hover:bg-rose-50 hover:text-rose-500"
                                                aria-label={`Delete ${c.code}`}
                                                title="Delete coupon"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {filteredCoupons.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-sm text-stone-500">
                                        {coupons.length === 0
                                            ? 'No coupons yet. Click "Add Coupon" to create your first one.'
                                            : 'No coupons match your search or filter.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card Layout */}
            <div className="flex flex-col gap-4 md:hidden">
                {filteredCoupons.map((c) => (
                    <div key={c.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <Tag size={16} className="text-stone-400" />
                                <span className="font-outfit text-lg font-bold text-black">{c.code}</span>
                                <button
                                    onClick={() => handleCopy(c.code, c.id)}
                                    className="text-stone-400 hover:text-stone-700 transition-colors"
                                    title="Copy code"
                                >
                                    {copiedId === c.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                                </button>
                            </div>
                            <StatusBadge coupon={c} />
                        </div>
                        
                        {c.description && (
                            <p className="mt-1.5 text-sm text-stone-500 line-clamp-2">
                                {c.description}
                            </p>
                        )}
                        
                        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-stone-50 p-3">
                            <div>
                                <span className="block text-[10px] font-semibold uppercase tracking-wider text-stone-500">Discount</span>
                                <span className="mt-0.5 block text-sm font-medium text-black">{formatDiscount(c)}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-semibold uppercase tracking-wider text-stone-500">Min Order</span>
                                <span className="mt-0.5 block text-sm font-medium text-black">{c.min_order_value > 0 ? `₹${c.min_order_value}` : '—'}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-semibold uppercase tracking-wider text-stone-500">Usage</span>
                                <span className="mt-0.5 block text-sm font-medium text-black">{c.used_count}{c.usage_limit ? ` / ${c.usage_limit}` : ' / ∞'}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-semibold uppercase tracking-wider text-stone-500">Valid Until</span>
                                <span className="mt-0.5 block text-sm font-medium text-black">{formatDate(c.valid_until)}</span>
                            </div>
                        </div>
                        
                        <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-4">
                            <div className="flex items-center gap-3">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">Enabled</span>
                                <ActiveToggle id={c.id} isActive={c.is_active} />
                            </div>
                            
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setViewingCoupon(c)}
                                    className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-black"
                                    aria-label={`View ${c.code}`}
                                >
                                    <Eye size={18} />
                                </button>
                                <button
                                    onClick={() => setEditingCoupon(c)}
                                    className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-black"
                                    aria-label={`Edit ${c.code}`}
                                >
                                    <Pencil size={18} />
                                </button>
                                <button
                                    onClick={() => startTransition(async () => { try { await deleteCoupon(c.id); toast.success('Coupon deleted') } catch { toast.error('Failed to delete coupon') } })}
                                    className="rounded-lg p-2 text-rose-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                    aria-label={`Delete ${c.code}`}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredCoupons.length === 0 && (
                    <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">
                        {coupons.length === 0
                            ? 'No coupons yet. Click "Add Coupon" to create your first one.'
                            : 'No coupons match your search or filter.'}
                    </div>
                )}
            </div>

            {showModal && <AddCouponModal onClose={() => setShowModal(false)} />}
            {editingCoupon && (
                <EditCouponModal coupon={editingCoupon} onClose={() => setEditingCoupon(null)} />
            )}
            {viewingCoupon && (
                <ViewCouponModal coupon={viewingCoupon} onClose={() => setViewingCoupon(null)} />
            )}
        </div>
    )
}