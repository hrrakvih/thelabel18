'use client'

import { useMemo, useState, useTransition } from 'react'
import { useFormStatus } from 'react-dom'
import Image from 'next/image'
import { Poppins } from 'next/font/google'
import { Plus, Trash2, ImageOff, X, Pencil, Search, Layers, CheckCircle2, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import {
    addSubCategory,
    toggleSubCategoryVisibility,
    updateSubCategoryPriority,
    updateSubCategory,
    deleteSubCategory,
} from './actions'
import { handleFileSelection } from '@/lib/utils/image-helpers'

const poppins = Poppins({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
})

export type CategoryOption = {
    id: string
    name: string
}

export type SubCategory = {
    id: string
    category_id: string
    category_name: string
    name: string
    description: string | null
    image_url: string | null
    priority: number
    is_visible: boolean
}

function VisibilityToggle({ id, isVisible }: { id: string; isVisible: boolean }) {
    const [pending, startTransition] = useTransition()
    const [checked, setChecked] = useState(isVisible)

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
                        await toggleSubCategoryVisibility(id, next)
                        toast.success(next ? 'Sub-category is now visible' : 'Sub-category is now hidden')
                    } catch {
                        setChecked(!next) // revert on failure
                        toast.error('Failed to update visibility')
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

function PriorityInput({
    id,
    categoryId,
    value,
}: {
    id: string
    categoryId: string
    value: number
}) {
    const [val, setVal] = useState(value)
    const [error, setError] = useState<string | null>(null)
    const [, startTransition] = useTransition()

    function commit() {
        if (val === value) return
        startTransition(async () => {
            try {
                await updateSubCategoryPriority(id, categoryId, val)
                setError(null)
                toast.success('Priority updated')
            } catch (err) {
                setVal(value) // revert on failure (e.g. priority already taken in this category)
                setError(err instanceof Error ? err.message : 'Update failed')
            }
        })
    }

    return (
        <div className="flex flex-col gap-1">
            <input
                type="number"
                value={val}
                onChange={(e) => setVal(Number(e.target.value))}
                onBlur={commit}
                className={[
                    'w-16 rounded-lg border bg-[#FAF7F1] px-2 py-1.5 text-center text-sm text-[#141414] outline-none focus:border-[#141414]',
                    error ? 'border-rose-400' : 'border-[#E4DDCE]',
                ].join(' ')}
            />
            {error && <span className="text-[10px] leading-tight text-rose-500">{error}</span>}
        </div>
    )
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-[#141414] py-3 text-xs font-bold uppercase tracking-widest text-[#F5F1E8] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
            {pending ? pendingLabel : label}
        </button>
    )
}

function EditSubCategoryModal({
    subCategory,
    categoryOptions,
    onClose,
}: {
    subCategory: SubCategory
    categoryOptions: CategoryOption[]
    onClose: () => void
}) {
    const [error, setError] = useState<string | null>(null)
    // Preview shown in the modal: starts as the existing image, swaps to the
    // newly picked file's preview once the user selects one. An image is
    // always required, so this can never be cleared to null by the user.
    const [previewUrl, setPreviewUrl] = useState<string | null>(subCategory.image_url)

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) {
            handleFileSelection([file], (processed) => {
                const processedFile = processed[0]
                const objectUrl = URL.createObjectURL(processedFile)
                setPreviewUrl(objectUrl)
                
                // Inject the converted file back into the input for form submission
                const dt = new DataTransfer()
                dt.items.add(processedFile)
                e.target.files = dt.files
            })
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="w-full max-w-md rounded-2xl border border-[#E4DDCE] bg-[#FFFEFB] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.15)]">
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-lg font-medium text-[#141414]">Edit Sub-Category</h2>
                    <button onClick={onClose} className="text-[#8b8478] hover:text-[#141414]">
                        <X size={18} />
                    </button>
                </div>

                <form
                    action={async (formData) => {
                        setError(null)
                        formData.set('existingImageUrl', subCategory.image_url ?? '')
                        try {
                            const res = await updateSubCategory(subCategory.id, formData)
                            if (res && !res.success) {
                                setError(res.error || 'Failed to update sub-category')
                                toast.error(res.error || 'Failed to update sub-category')
                                return
                            }
                            toast.success('Sub-category updated successfully')
                            onClose()
                        } catch (err) {
                            setError(err instanceof Error ? err.message : 'Something went wrong')
                            toast.error('Operation failed')
                        }
                    }}
                    className="space-y-4"
                >
                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium uppercase tracking-wider text-[#8b8478]">
                            Parent Category
                        </label>
                        <select
                            name="category_id"
                            required
                            defaultValue={subCategory.category_id}
                            className="w-full rounded-xl border border-[#E4DDCE] bg-[#FAF7F1] px-3.5 py-2.5 text-sm text-[#141414] outline-none focus:border-[#141414]"
                        >
                            {categoryOptions.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium uppercase tracking-wider text-[#8b8478]">
                            Sub-Category Name
                        </label>
                        <input
                            name="name"
                            required
                            defaultValue={subCategory.name}
                            className="w-full rounded-xl border border-[#E4DDCE] bg-[#FAF7F1] px-3.5 py-2.5 text-sm text-[#141414] outline-none focus:border-[#141414]"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium uppercase tracking-wider text-[#8b8478]">
                            Description
                        </label>
                        <textarea
                            name="description"
                            rows={3}
                            defaultValue={subCategory.description ?? ''}
                            className="w-full resize-none rounded-xl border border-[#E4DDCE] bg-[#FAF7F1] px-3.5 py-2.5 text-sm text-[#141414] outline-none focus:border-[#141414]"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium uppercase tracking-wider text-[#8b8478]">
                            Priority
                        </label>
                        <input
                            name="priority"
                            type="number"
                            required
                            defaultValue={subCategory.priority}
                            className="w-full rounded-xl border border-[#E4DDCE] bg-[#FAF7F1] px-3.5 py-2.5 text-sm text-[#141414] outline-none focus:border-[#141414]"
                        />
                        <p className="text-[11px] text-[#8b8478]">
                            Must be unique within the selected parent category.
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium uppercase tracking-wider text-[#8b8478]">
                            Image <span className="text-rose-500">*</span>
                        </label>

                        {/* Live image preview */}
                        <div className="flex items-center gap-4">
                            {previewUrl ? (
                                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[#E4DDCE] bg-[#FAF7F1]">
                                    <Image
                                        src={previewUrl}
                                        alt="Sub-category preview"
                                        fill
                                        sizes="80px"
                                        className="object-cover"
                                        unoptimized={previewUrl.startsWith('blob:')}
                                    />
                                </div>
                            ) : (
                                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-[#E4DDCE] bg-[#FAF7F1] text-[#c9c1b1]">
                                    <ImageOff size={22} />
                                </div>
                            )}

                            <div className="flex flex-1 flex-col gap-2">
                                <input
                                    name="image"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="w-full text-xs text-[#8b8478] file:mr-3 file:rounded-lg file:border-0 file:bg-[#141414] file:px-3 file:py-2 file:text-xs file:font-medium file:text-[#F5F1E8] file:cursor-pointer"
                                />
                                <p className="text-[11px] text-[#8b8478]">
                                    An image is required. Leave blank to keep the current one.
                                </p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-600">
                            {error}
                        </div>
                    )}

                    <SubmitButton label="Save Changes" pendingLabel="Saving…" />
                </form>
            </div>
        </div>
    )
}

function AddSubCategoryModal({
    categoryOptions,
    onClose,
}: {
    categoryOptions: CategoryOption[]
    onClose: () => void
}) {
    const [error, setError] = useState<string | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) {
            handleFileSelection([file], (processed) => {
                const processedFile = processed[0]
                const objectUrl = URL.createObjectURL(processedFile)
                setPreviewUrl(objectUrl)
                
                // Inject the converted file back into the input for form submission
                const dt = new DataTransfer()
                dt.items.add(processedFile)
                e.target.files = dt.files
            })
        } else {
            setPreviewUrl(null)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="w-full max-w-md rounded-2xl border border-[#E4DDCE] bg-[#FFFEFB] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.15)]">
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-lg font-medium text-[#141414]">Add Sub-Category</h2>
                    <button onClick={onClose} className="text-[#8b8478] hover:text-[#141414]">
                        <X size={18} />
                    </button>
                </div>

                {categoryOptions.length === 0 ? (
                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-700">
                        Create a category first — sub-categories need a parent category to belong to.
                    </div>
                ) : (
                    <form
                        action={async (formData) => {
                            setError(null)
                            try {
                                const res = await addSubCategory(formData)
                                if (res && !res.success) {
                                    setError(res.error || 'Failed to add sub-category')
                                    toast.error(res.error || 'Failed to add sub-category')
                                    return
                                }
                                toast.success('Sub-category added successfully')
                                onClose()
                            } catch (err) {
                                setError(err instanceof Error ? err.message : 'Something went wrong')
                                toast.error('Operation failed')
                            }
                        }}
                        className="space-y-4"
                    >
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium uppercase tracking-wider text-[#8b8478]">
                                Parent Category
                            </label>
                            <select
                                name="category_id"
                                required
                                defaultValue=""
                                className="w-full rounded-xl border border-[#E4DDCE] bg-[#FAF7F1] px-3.5 py-2.5 text-sm text-[#141414] outline-none focus:border-[#141414]"
                            >
                                <option value="" disabled>
                                    Select a category…
                                </option>
                                {categoryOptions.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium uppercase tracking-wider text-[#8b8478]">
                                Sub-Category Name
                            </label>
                            <input
                                name="name"
                                required
                                className="w-full rounded-xl border border-[#E4DDCE] bg-[#FAF7F1] px-3.5 py-2.5 text-sm text-[#141414] outline-none focus:border-[#141414]"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium uppercase tracking-wider text-[#8b8478]">
                                Description
                            </label>
                            <textarea
                                name="description"
                                rows={3}
                                className="w-full resize-none rounded-xl border border-[#E4DDCE] bg-[#FAF7F1] px-3.5 py-2.5 text-sm text-[#141414] outline-none focus:border-[#141414]"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium uppercase tracking-wider text-[#8b8478]">
                                Priority
                            </label>
                            <input
                                name="priority"
                                type="number"
                                required
                                defaultValue={0}
                                className="w-full rounded-xl border border-[#E4DDCE] bg-[#FAF7F1] px-3.5 py-2.5 text-sm text-[#141414] outline-none focus:border-[#141414]"
                            />
                            <p className="text-[11px] text-[#8b8478]">
                                Must be unique within the selected parent category.
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium uppercase tracking-wider text-[#8b8478]">
                                Image <span className="text-rose-500">*</span>
                            </label>

                            <div className="flex items-center gap-4">
                                {previewUrl ? (
                                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[#E4DDCE] bg-[#FAF7F1]">
                                        <Image
                                            src={previewUrl}
                                            alt="Sub-category preview"
                                            fill
                                            sizes="80px"
                                            className="object-cover"
                                            unoptimized
                                        />
                                    </div>
                                ) : (
                                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-[#E4DDCE] bg-[#FAF7F1] text-[#c9c1b1]">
                                        <ImageOff size={22} />
                                    </div>
                                )}

                                <input
                                    name="image"
                                    type="file"
                                    accept="image/*"
                                    required
                                    onChange={handleFileChange}
                                    className="flex-1 text-xs text-[#8b8478] file:mr-3 file:rounded-lg file:border-0 file:bg-[#141414] file:px-3 file:py-2 file:text-xs file:font-medium file:text-[#F5F1E8] file:cursor-pointer"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-600">
                                {error}
                            </div>
                        )}

                        <SubmitButton label="Save Sub-Category" pendingLabel="Saving…" />
                    </form>
                )}
            </div>
        </div>
    )
}

export default function SubCategoriesClient({
    subCategories,
    categoryOptions,
}: {
    subCategories: SubCategory[]
    categoryOptions: CategoryOption[]
}) {
    const [showModal, setShowModal] = useState(false)
    const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null)
    const [search, setSearch] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')
    const [, startTransition] = useTransition()

    const visibleCount = subCategories.filter((s) => s.is_visible).length
    const hiddenCount = subCategories.length - visibleCount

    const filteredSubCategories = useMemo(() => {
        const q = search.trim().toLowerCase()
        return subCategories.filter((s) => {
            const matchesSearch =
                !q ||
                s.name.toLowerCase().includes(q) ||
                (s.description || '').toLowerCase().includes(q) ||
                s.category_name.toLowerCase().includes(q)
            const matchesCategory = !categoryFilter || s.category_id === categoryFilter
            return matchesSearch && matchesCategory
        })
    }, [subCategories, search, categoryFilter])

    const selectClass =
        'rounded-xl border border-[#E4DDCE] bg-[#FAF7F1] px-3.5 py-2.5 text-sm text-[#141414] outline-none focus:border-[#141414]'

    return (
        <div className={poppins.className}>
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white px-4 py-5 md:px-6 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-black">Sub-Categories</h1>
                    <p className="mt-1 text-sm font-medium text-stone-600">
                        {subCategories.length} sub-categor{subCategories.length === 1 ? 'y' : 'ies'} · toggle to control storefront visibility
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex w-full md:w-auto justify-center items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.99]"
                >
                    <Plus size={15} strokeWidth={2} />
                    Add Sub-Category
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
                            Total Sub-Categories
                        </p>
                        <p className="mt-0.5 text-2xl font-bold text-black">{subCategories.length}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 rounded-2xl border border-stone-200 bg-white p-3.5 sm:p-5 shadow-sm">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <CheckCircle2 size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                            Visible
                        </p>
                        <p className="mt-0.5 text-2xl font-bold text-black">{visibleCount}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 rounded-2xl border border-stone-200 bg-white p-3.5 sm:p-5 shadow-sm">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                        <EyeOff size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                            Hidden
                        </p>
                        <p className="mt-0.5 text-2xl font-bold text-black">{hiddenCount}</p>
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
                        placeholder="Search by sub-category name or description…"
                        className="w-full rounded-xl border border-stone-300 bg-white py-2.5 pl-10 pr-3.5 text-sm text-black outline-none focus:border-black"
                    />
                </div>

                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className={selectClass}
                >
                    <option value="">All Categories</option>
                    {categoryOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>

                {(search || categoryFilter) && (
                    <button
                        onClick={() => {
                            setSearch('')
                            setCategoryFilter('')
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
                                <th className="px-6 py-3 font-semibold">Image</th>
                                <th className="px-6 py-3 font-semibold">Sub-Category Name</th>
                                <th className="px-6 py-3 font-semibold">Category</th>
                                <th className="px-6 py-3 font-semibold">Description</th>
                                <th className="px-6 py-3 font-semibold">Priority</th>
                                <th className="px-6 py-3 font-semibold">Visible</th>
                                <th className="px-6 py-3 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubCategories.map((sub) => (
                                <tr key={sub.id} className="border-t border-stone-100 transition-colors hover:bg-stone-50">
                                    <td className="px-6 py-3.5">
                                        {sub.image_url ? (
                                            <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
                                                <Image src={sub.image_url} alt={sub.name} fill sizes="48px" className="object-cover" />
                                            </div>
                                        ) : (
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-stone-300">
                                                <ImageOff size={18} />
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-3.5 font-semibold text-black">{sub.name}</td>
                                    <td className="px-6 py-3.5">
                                        <span className="inline-flex rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">
                                            {sub.category_name}
                                        </span>
                                    </td>
                                    <td className="max-w-xs truncate px-6 py-3.5 text-stone-600">
                                        {sub.description || '—'}
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <PriorityInput id={sub.id} categoryId={sub.category_id} value={sub.priority} />
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <VisibilityToggle id={sub.id} isVisible={sub.is_visible} />
                                    </td>
                                    <td className="px-6 py-3.5 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => setEditingSubCategory(sub)}
                                                className="rounded-lg p-2 text-stone-300 transition-colors hover:bg-stone-100 hover:text-[#141414]"
                                                aria-label={`Edit ${sub.name}`}
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm('Warning: Deleting this sub-category will permanently delete ALL products inside it. Are you absolutely sure?')) {
                                                        startTransition(async () => {
                                                            try {
                                                                await deleteSubCategory(sub.id, sub.image_url)
                                                                toast.success('Sub-category deleted successfully')
                                                            } catch (err: any) {
                                                                toast.error(err.message || 'Failed to delete sub-category')
                                                            }
                                                        })
                                                    }
                                                }}
                                                className="rounded-lg p-2 text-stone-300 transition-colors hover:bg-rose-50 hover:text-rose-500"
                                                aria-label={`Delete ${sub.name}`}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {filteredSubCategories.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-stone-500">
                                        {subCategories.length === 0
                                            ? 'No sub-categories yet. Click "Add Sub-Category" to create your first one.'
                                            : 'No sub-categories match your search or filter.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card Layout */}
            <div className="flex flex-col gap-4 md:hidden">
                {filteredSubCategories.map((sub) => (
                    <div key={sub.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start gap-4">
                            {sub.image_url ? (
                                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
                                    <Image src={sub.image_url} alt={sub.name} fill sizes="64px" className="object-cover" />
                                </div>
                            ) : (
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-stone-300">
                                    <ImageOff size={24} />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-black truncate">{sub.name}</h3>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className="inline-flex rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600">
                                        {sub.category_name}
                                    </span>
                                </div>
                                <p className="mt-1.5 text-xs text-stone-500 line-clamp-2">
                                    {sub.description || 'No description'}
                                </p>
                            </div>
                        </div>
                        
                        <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-4">
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-medium uppercase tracking-wider text-stone-400">Visible</span>
                                    <VisibilityToggle id={sub.id} isVisible={sub.is_visible} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-medium uppercase tracking-wider text-stone-400">Priority</span>
                                    <PriorityInput id={sub.id} categoryId={sub.category_id} value={sub.priority} />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setEditingSubCategory(sub)}
                                    className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-black"
                                    aria-label={`Edit ${sub.name}`}
                                >
                                    <Pencil size={18} />
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm('Warning: Deleting this sub-category will permanently delete ALL products inside it. Are you absolutely sure?')) {
                                            startTransition(async () => {
                                                            try {
                                                                await deleteSubCategory(sub.id, sub.image_url)
                                                                toast.success('Sub-category deleted successfully')
                                                            } catch (err: any) {
                                                                toast.error(err.message || 'Failed to delete sub-category')
                                                            }
                                                        })
                                        }
                                    }}
                                    className="rounded-lg p-2 text-rose-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                    aria-label={`Delete ${sub.name}`}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredSubCategories.length === 0 && (
                    <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">
                        {subCategories.length === 0
                            ? 'No sub-categories yet. Click "Add Sub-Category" to create your first one.'
                            : 'No sub-categories match your search or filter.'}
                    </div>
                )}
            </div>

            {showModal && (
                <AddSubCategoryModal categoryOptions={categoryOptions} onClose={() => setShowModal(false)} />
            )}
            {editingSubCategory && (
                <EditSubCategoryModal
                    subCategory={editingSubCategory}
                    categoryOptions={categoryOptions}
                    onClose={() => setEditingSubCategory(null)}
                />
            )}
        </div>
    )
}