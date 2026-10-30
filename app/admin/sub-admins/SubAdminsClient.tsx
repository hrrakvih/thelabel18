'use client'

import { useMemo, useState, useTransition } from 'react'
import { Poppins } from 'next/font/google'
import { Plus, Trash2, X, Pencil, Search, ShieldCheck, UserCheck, Lock } from 'lucide-react'
import { addSubAdmin, updateSubAdmin, deleteSubAdmin } from './actions'
import toast from 'react-hot-toast'

const poppins = Poppins({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
})

export type SubAdmin = {
    id: string
    name: string
    email: string
    role: string
    permissions: string[]
    created_at?: string
}

const AVAILABLE_TABS = [
    { label: 'Dashboard', path: '/admin/dashboard' },
    { label: 'Categories', path: '/admin/categories' },
    { label: 'Sub Categories', path: '/admin/sub-categories' },
    { label: 'Sub Sub Categories', path: '/admin/sub-sub-categories' },
    { label: 'Add Product', path: '/admin/products/add' },
    { label: 'Product List', path: '/admin/products/list' },
    { label: 'Coupons', path: '/admin/coupons' },
    { label: 'Announcements', path: '/admin/announcements' },
    { label: 'Orders', path: '/admin/orders' },
    { label: 'Live Register (POS)', path: '/admin/pos/register' },
    { label: 'POS History', path: '/admin/pos/history' },
    { label: 'Sub Admin Management', path: '/admin/sub-admins' },
    { label: 'Videos & Reels', path: '/admin/videos-reels' },
    { label: 'Reports', path: '/admin/reports' },
]

function PermissionCheckboxes({ selected, onChange }: { selected: string[]; onChange: (paths: string[]) => void }) {
    function toggleTab(path: string, e: React.MouseEvent) {
        e.preventDefault() // Prevents unwanted double-firing from label clicks
        if (selected.includes(path)) {
            onChange(selected.filter((p) => p !== path))
        } else {
            onChange([...selected, path])
        }
    }

    return (
        <div className="space-y-2">
            <label className="block text-xs font-medium uppercase tracking-wider text-[#8b8478]">
                Accessible Tabs & Permissions
            </label>
            <div className="max-h-48 overflow-y-auto rounded-xl border border-[#E4DDCE] bg-[#FAF7F1] p-3 grid grid-cols-2 gap-2 md:grid-cols-2">
                {AVAILABLE_TABS.map((tab) => {
                    const isChecked = selected.includes(tab.path)
                    return (
                        <div
                            key={tab.path}
                            onClick={(e) => toggleTab(tab.path, e)}
                            className={`flex items-center gap-2.5 rounded-lg border p-2 text-xs cursor-pointer transition-colors select-none ${
                                isChecked
                                    ? 'border-black bg-black text-white font-medium'
                                    : 'border-[#E4DDCE] bg-white text-[#141414] hover:bg-stone-50'
                            }`}
                        >
                            <input
                                type="checkbox"
                                checked={isChecked}
                                readOnly
                                className="pointer-events-none h-3.5 w-3.5 rounded border-stone-300 text-black accent-black"
                            />
                            <span className="truncate">{tab.label}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function AddSubAdminModal({ onClose }: { onClose: () => void }) {
    const [pending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [permissions, setPermissions] = useState<string[]>([])

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="w-full max-w-lg rounded-2xl border border-[#E4DDCE] bg-[#FFFEFB] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.15)]">
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-lg font-medium text-[#141414]">Add Sub Admin</h2>
                    <button onClick={onClose} className="text-[#8b8478] hover:text-[#141414]">
                        <X size={18} />
                    </button>
                </div>

                <form
                    onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.currentTarget);
                        setError(null)
                        formData.set('permissions', JSON.stringify(permissions))
                        startTransition(async () => {
                            try {
                                await addSubAdmin(formData)
                                toast.success('Sub-admin added successfully')
                                onClose()
                            } catch (err) {
                                setError(err instanceof Error ? err.message : 'Something went wrong')
                                toast.error('Failed to add sub-admin')
                            }
                        })
                    }}
                    className="space-y-4"
                >
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium uppercase tracking-wider text-[#8b8478]">Name</label>
                            <input
                                name="name"
                                required
                                placeholder="Full Name"
                                className="w-full rounded-xl border border-[#E4DDCE] bg-[#FAF7F1] px-3.5 py-2.5 text-sm text-[#141414] outline-none focus:border-[#141414]"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium uppercase tracking-wider text-[#8b8478]">Role</label>
                            <input
                                name="role"
                                required
                                className="w-full rounded-xl border border-[#E4DDCE] bg-[#FAF7F1] px-3.5 py-2.5 text-sm text-[#141414] outline-none focus:border-[#141414]"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium uppercase tracking-wider text-[#8b8478]">Email Address</label>
                        <input
                            name="email"
                            type="email"
                            required
                            placeholder="admin@thelabel18.com"
                            className="w-full rounded-xl border border-[#E4DDCE] bg-[#FAF7F1] px-3.5 py-2.5 text-sm text-[#141414] outline-none focus:border-[#141414]"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium uppercase tracking-wider text-[#8b8478]">Password</label>
                        <input
                            name="password"
                            type="password"
                            required
                            placeholder="••••••••"
                            className="w-full rounded-xl border border-[#E4DDCE] bg-[#FAF7F1] px-3.5 py-2.5 text-sm text-[#141414] outline-none focus:border-[#141414]"
                        />
                    </div>

                    <PermissionCheckboxes selected={permissions} onChange={setPermissions} />

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
                        {pending ? 'Saving…' : 'Create Sub Admin'}
                    </button>
                </form>
            </div>
        </div>
    )
}

function EditSubAdminModal({
    subAdmin,
    onClose,
}: {
    subAdmin: SubAdmin
    onClose: () => void
}) {
    const [pending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [permissions, setPermissions] = useState<string[]>(subAdmin.permissions || [])

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="w-full max-w-lg rounded-2xl border border-[#E4DDCE] bg-[#FFFEFB] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.15)]">
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-lg font-medium text-[#141414]">Edit Sub Admin</h2>
                    <button onClick={onClose} className="text-[#8b8478] hover:text-[#141414]">
                        <X size={18} />
                    </button>
                </div>

                <form
                    onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.currentTarget);
                        setError(null)
                        formData.set('permissions', JSON.stringify(permissions))
                        startTransition(async () => {
                            try {
                                await updateSubAdmin(subAdmin.id, formData)
                                toast.success('Sub-admin updated successfully')
                                onClose()
                            } catch (err) {
                                setError(err instanceof Error ? err.message : 'Something went wrong')
                                toast.error('Failed to update sub-admin')
                            }
                        })
                    }}
                    className="space-y-4"
                >
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium uppercase tracking-wider text-[#8b8478]">Name</label>
                            <input
                                name="name"
                                required
                                defaultValue={subAdmin.name}
                                className="w-full rounded-xl border border-[#E4DDCE] bg-[#FAF7F1] px-3.5 py-2.5 text-sm text-[#141414] outline-none focus:border-[#141414]"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium uppercase tracking-wider text-[#8b8478]">Role</label>
                            <input
                                name="role"
                                required
                                defaultValue={subAdmin.role}
                                className="w-full rounded-xl border border-[#E4DDCE] bg-[#FAF7F1] px-3.5 py-2.5 text-sm text-[#141414] outline-none focus:border-[#141414]"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium uppercase tracking-wider text-[#8b8478]">Email Address</label>
                        <input
                            name="email"
                            type="email"
                            required
                            defaultValue={subAdmin.email}
                            className="w-full rounded-xl border border-[#E4DDCE] bg-[#FAF7F1] px-3.5 py-2.5 text-sm text-[#141414] outline-none focus:border-[#141414]"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium uppercase tracking-wider text-[#8b8478]">New Password (leave blank to keep current)</label>
                        <input
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            className="w-full rounded-xl border border-[#E4DDCE] bg-[#FAF7F1] px-3.5 py-2.5 text-sm text-[#141414] outline-none focus:border-[#141414]"
                        />
                    </div>

                    <PermissionCheckboxes selected={permissions} onChange={setPermissions} />

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
                        {pending ? 'Saving…' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default function SubAdminsClient({ subAdmins }: { subAdmins: SubAdmin[] }) {
    const [showModal, setShowModal] = useState(false)
    const [editingSubAdmin, setEditingSubAdmin] = useState<SubAdmin | null>(null)
    const [search, setSearch] = useState('')
    const [, startTransition] = useTransition()

    const filteredSubAdmins = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return subAdmins
        return subAdmins.filter(
            (s) =>
                s.name.toLowerCase().includes(q) ||
                s.email.toLowerCase().includes(q) ||
                s.role.toLowerCase().includes(q)
        )
    }, [subAdmins, search])

    return (
        <div className={poppins.className}>
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white px-4 py-5 md:px-6 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-black">Sub Admin Management</h1>
                    <p className="mt-1 text-sm font-medium text-stone-600">
                        {subAdmins.length} admin{subAdmins.length === 1 ? '' : 's'} registered · manage roles and granular tab permissions
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex w-full md:w-auto justify-center items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.99]"
                >
                    <Plus size={15} strokeWidth={2} />
                    Add Sub Admin
                </button>
            </div>

            {/* Stat cards */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3 sm:gap-4 rounded-2xl border border-stone-200 bg-white p-3.5 sm:p-5 shadow-sm">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600 shrink-0">
                        <UserCheck size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Total Sub Admins</p>
                        <p className="mt-0.5 text-2xl font-bold text-black">{subAdmins.length}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 rounded-2xl border border-stone-200 bg-white p-3.5 sm:p-5 shadow-sm">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                        <ShieldCheck size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Active Access Controls</p>
                        <p className="mt-0.5 text-2xl font-bold text-black">Configured</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, email or role…"
                        className="w-full rounded-xl border border-stone-300 bg-white py-2.5 pl-10 pr-3.5 text-sm text-black outline-none focus:border-black"
                    />
                </div>
            </div>

            <div className="hidden md:block overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-[900px] w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-stone-200 bg-stone-50 text-[11px] uppercase tracking-wider text-stone-500">
                                <th className="px-6 py-3 font-semibold">Name</th>
                                <th className="px-6 py-3 font-semibold">Email</th>
                                <th className="px-6 py-3 font-semibold">Role</th>
                                <th className="px-6 py-3 font-semibold">Permissions (Tabs)</th>
                                <th className="px-6 py-3 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubAdmins.map((admin) => (
                                <tr key={admin.id} className="border-t border-stone-100 transition-colors hover:bg-stone-50">
                                    <td className="px-6 py-3.5 font-semibold text-black">{admin.name}</td>
                                    <td className="px-6 py-3.5 text-stone-600">{admin.email}</td>
                                    <td className="px-6 py-3.5">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-800">
                                            {admin.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <span className="text-xs font-medium text-stone-600">
                                            {admin.permissions?.length ? `${admin.permissions.length} tabs allowed` : 'No access'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3.5 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => setEditingSubAdmin(admin)}
                                                className="rounded-lg p-2 text-stone-300 transition-colors hover:bg-stone-100 hover:text-[#141414]"
                                                aria-label={`Edit ${admin.name}`}
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    startTransition(async () => { try { await deleteSubAdmin(admin.id); toast.success('Sub-admin deleted') } catch { toast.error('Failed to delete sub-admin') } })
                                                }
                                                className="rounded-lg p-2 text-stone-300 transition-colors hover:bg-rose-50 hover:text-rose-500"
                                                aria-label={`Delete ${admin.name}`}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {filteredSubAdmins.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-stone-500">
                                        {subAdmins.length === 0
                                            ? 'No sub-admins yet. Click "Add Sub Admin" to create your first one.'
                                            : 'No sub-admins match your search.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card Layout */}
            <div className="flex flex-col gap-4 md:hidden">
                {filteredSubAdmins.map((admin) => (
                    <div key={admin.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="font-semibold text-black">{admin.name}</h3>
                                <p className="text-xs text-stone-500 mt-0.5">{admin.email}</p>
                            </div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-[10px] font-medium text-stone-800 shrink-0">
                                {admin.role}
                            </span>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between">
                            <div>
                                <span className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400">Permissions</span>
                                <span className="mt-0.5 block text-xs font-medium text-stone-600">
                                    {admin.permissions?.length ? `${admin.permissions.length} tabs allowed` : 'No access'}
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setEditingSubAdmin(admin)}
                                    className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-black"
                                    aria-label={`Edit ${admin.name}`}
                                >
                                    <Pencil size={18} />
                                </button>
                                <button
                                    onClick={() => startTransition(async () => { try { await deleteSubAdmin(admin.id); toast.success('Sub-admin deleted') } catch { toast.error('Failed to delete sub-admin') } })}
                                    className="rounded-lg p-2 text-rose-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                    aria-label={`Delete ${admin.name}`}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredSubAdmins.length === 0 && (
                    <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">
                        {subAdmins.length === 0
                            ? 'No sub-admins yet. Click "Add Sub Admin" to create your first one.'
                            : 'No sub-admins match your search.'}
                    </div>
                )}
            </div>

            {showModal && <AddSubAdminModal onClose={() => setShowModal(false)} />}
            {editingSubAdmin && (
                <EditSubAdminModal
                    subAdmin={editingSubAdmin}
                    onClose={() => setEditingSubAdmin(null)}
                />
            )}
        </div>
    )
}