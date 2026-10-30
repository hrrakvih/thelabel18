'use client'

import { useMemo, useState, useTransition } from 'react'
import Image from 'next/image'
import { Poppins } from 'next/font/google'
import { Plus, Trash2, ImageOff, X, Pencil, Search, Layers, CheckCircle2, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import {
    addSubSubCategory,
    toggleSubSubCategoryVisibility,
    updateSubSubCategoryPriority,
    updateSubSubCategory,
    deleteSubSubCategory,
} from './actions'
import { handleFileSelection } from '@/lib/utils/image-helpers'

const poppins = Poppins({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
})

export type SubCategoryOption = {
    id: string
    name: string
    category_name: string
}

export type SubSubCategory = {
    id: string
    sub_category_id: string
    sub_category_name: string
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
                        await toggleSubSubCategoryVisibility(id, next)
                        toast.success(next ? 'Sub-sub-category is now visible' : 'Sub-sub-category is now hidden')
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
    subCategoryId,
    value,
}: {
    id: string
    subCategoryId: string
    value: number
}) {
    const [val, setVal] = useState(value)
    const [error, setError] = useState<string | null>(null)
    const [, startTransition] = useTransition()

    function commit() {
        if (val === value) return
        startTransition(async () => {
            try {
                await updateSubSubCategoryPriority(id, subCategoryId, val)
                setError(null)
                toast.success('Priority updated')
            } catch (err) {
                setVal(value) // revert on failure (e.g. priority already taken in this sub-category)
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

function EditSubSubCategoryModal({
    subSubCategory,
    subCategoryOptions,
    onClose,
}: {
    subSubCategory: SubSubCategory
    subCategoryOptions: SubCategoryOption[]
    onClose: () => void
}) {
    const [pending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(subSubCategory.image_url)

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
                    <h2 className="text-lg font-medium text-[#141414]">Edit Sub-Sub-Category</h2>
                    <button onClick={onClose} className="text-[#8b8478] hover:text-[#141414]">
                        <X size={18} />
                    </button>
                </div>

                <form
                    action={async (formData) => {
                        setError(null)
                        formData.set('existingImageUrl', subSubCategory.image_url ?? '')
                        try {
                            const res = await updateSubSubCategory(subSubCategory.id, formData)
                            if (res && !res.success) {
                                setError(res.error || 'Failed to update sub-sub-category')
                                toast.error(res.error || 'Failed to update sub-sub-category')
                                return
                            }
                            toast.success('Sub-sub-category updated successfully')
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
                            Parent Sub-Category
                        </label>
                        <select
                            name="sub_category_id"
                            required
                            defaultValue={subSubCategory.sub_category_id}
                            className="w-full rounded-xl border border-[#E4DDCE] bg-[#FAF7F1] px-3.5 py-2.5 text-sm text-[#141414] outline-none focus:border-[#141414]"
                        >
                            {subCategoryOptions.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.category_name} / {s.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium uppercase tracking-wider text-[#8b8478]">
                            Sub-Sub-Category Name
                        </label>
                        <input
                            name="name"
                            required
                            defaultValue={subSubCategory.name}
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
                            defaultValue={subSubCategory.description ?? ''}
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
                            defaultValue={subSubCategory.priority}
                            className="w-full rounded-xl border border-[#E4DDCE] bg-[#FAF7F1] px-3.5 py-2.5 text-sm text-[#141414] outline-none focus:border-[#141414]"
                        />
                        <p className="text-[11px] text-[#8b8478]">
                            Must be unique within the selected parent sub-category.
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
                                        alt="Sub-sub-category preview"
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

function AddSubSubCategoryModal({
    subCategoryOptions,
    onClose,
}: {
    subCategoryOptions: SubCategoryOption[]
    onClose: () => void
}) {
    const [pending, startTransition] = useTransition()
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
                    <h2 className="text-lg font-medium text-[#141414]">Add Sub-Sub-Category</h2>
                    <button onClick={onClose} className="text-[#8b8478] hover:text-[#141414]">
                        <X size={18} />
                    </button>
                </div>

                {subCategoryOptions.length === 0 ? (
                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-700">
                        Create a sub-category first — sub-sub-categories need a parent sub-category to belong to.
                    </div>
                ) : (
                    <form
                        action={async (formData) => {
                            setError(null)
                            try {
                                const res = await addSubSubCategory(formData)
                                if (res && !res.success) {
                                    setError(res.error || 'Failed to add sub-sub-category')
                                    toast.error(res.error || 'Failed to add sub-sub-category')
                                    return
                                }
                                toast.success('Sub-sub-category added successfully')
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
                                Parent Sub-Category
                            </label>
                            <select
                                name="sub_category_id"
                                required
                                defaultValue=""
                                className="w-full rounded-xl border border-[#E4DDCE] bg-[#FAF7F1] px-3.5 py-2.5 text-sm text-[#141414] outline-none focus:border-[#141414]"
                            >
                                <option value="" disabled>
                                    Select a sub-category…
                                </option>
                                {subCategoryOptions.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.category_name} / {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium uppercase tracking-wider text-[#8b8478]">
                                Sub-Sub-Category Name
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
                                Must be unique within the selected parent sub-category.
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
                                            alt="Sub-sub-category preview"
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

                        <button
                            type="submit"
                            disabled={pending}
                            className="w-full rounded-xl bg-[#141414] py-3 text-xs font-bold uppercase tracking-widest text-[#F5F1E8] transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                            {pending ? 'Saving…' : 'Save Sub-Sub-Category'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}

export default function SubSubCategoriesClient({
    subSubCategories,
    subCategoryOptions,
}: {
    subSubCategories: SubSubCategory[]
    subCategoryOptions: SubCategoryOption[]
}) {
    const [showModal, setShowModal] = useState(false)
    const [editingSubSubCategory, setEditingSubSubCategory] = useState<SubSubCategory | null>(null)
    const [search, setSearch] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')
    const [subCategoryFilter, setSubCategoryFilter] = useState('')
    const [, startTransition] = useTransition()

    const visibleCount = subSubCategories.filter((s) => s.is_visible).length
    const hiddenCount = subSubCategories.length - visibleCount

    // Unique list of parent categories, derived from subCategoryOptions
    // (there's no separate categoryOptions prop, so we build it from category_name).
    const categoryNames = useMemo(() => {
        const names = new Set(subCategoryOptions.map((s) => s.category_name))
        return Array.from(names).sort((a, b) => a.localeCompare(b))
    }, [subCategoryOptions])

    // Sub-category dropdown narrows to the selected category, if any.
    const availableSubCategoryOptions = useMemo(() => {
        if (!categoryFilter) return subCategoryOptions
        return subCategoryOptions.filter((s) => s.category_name === categoryFilter)
    }, [subCategoryOptions, categoryFilter])

    const filteredSubSubCategories = useMemo(() => {
        const q = search.trim().toLowerCase()
        return subSubCategories.filter((item) => {
            const matchesSearch =
                !q ||
                item.name.toLowerCase().includes(q) ||
                (item.description || '').toLowerCase().includes(q) ||
                item.sub_category_name.toLowerCase().includes(q) ||
                item.category_name.toLowerCase().includes(q)
            const matchesCategory = !categoryFilter || item.category_name === categoryFilter
            const matchesSubCategory = !subCategoryFilter || item.sub_category_id === subCategoryFilter
            return matchesSearch && matchesCategory && matchesSubCategory
        })
    }, [subSubCategories, search, categoryFilter, subCategoryFilter])

    const selectClass =
        'rounded-xl border border-[#E4DDCE] bg-[#FAF7F1] px-3.5 py-2.5 text-sm text-[#141414] outline-none focus:border-[#141414]'

    return (
        <div className={poppins.className}>
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white px-4 py-5 md:px-6 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-black">Sub-Sub-Categories</h1>
                    <p className="mt-1 text-sm font-medium text-stone-600">
                        {subSubCategories.length} sub-sub-categor{subSubCategories.length === 1 ? 'y' : 'ies'} · toggle to control storefront visibility
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex w-full md:w-auto justify-center items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.99]"
                >
                    <Plus size={15} strokeWidth={2} />
                    Add Sub-Sub-Category
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
                            Total Sub-Sub-Categories
                        </p>
                        <p className="mt-0.5 text-2xl font-bold text-black">{subSubCategories.length}</p>
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

            {/* Search + filters */}
            <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                <div className="relative min-w-[220px] flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, description, category or sub-category…"
                        className="w-full rounded-xl border border-stone-300 bg-white py-2.5 pl-10 pr-3.5 text-sm text-black outline-none focus:border-black"
                    />
                </div>

                <select
                    value={categoryFilter}
                    onChange={(e) => {
                        const nextCategory = e.target.value
                        setCategoryFilter(nextCategory)
                        // Reset sub-category filter if it no longer belongs to the newly picked category
                        setSubCategoryFilter((prev) => {
                            if (!prev) return prev
                            const stillValid = subCategoryOptions.some(
                                (s) => s.id === prev && (!nextCategory || s.category_name === nextCategory)
                            )
                            return stillValid ? prev : ''
                        })
                    }}
                    className={selectClass}
                >
                    <option value="">All Categories</option>
                    {categoryNames.map((name) => (
                        <option key={name} value={name}>
                            {name}
                        </option>
                    ))}
                </select>

                <select
                    value={subCategoryFilter}
                    onChange={(e) => setSubCategoryFilter(e.target.value)}
                    className={selectClass}
                >
                    <option value="">All Sub-Categories</option>
                    {availableSubCategoryOptions.map((s) => (
                        <option key={s.id} value={s.id}>
                            {categoryFilter ? s.name : `${s.category_name} / ${s.name}`}
                        </option>
                    ))}
                </select>

                {(search || categoryFilter || subCategoryFilter) && (
                    <button
                        onClick={() => {
                            setSearch('')
                            setCategoryFilter('')
                            setSubCategoryFilter('')
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
                                <th className="px-6 py-3 font-semibold">Name</th>
                                <th className="px-6 py-3 font-semibold">Category / Sub-Category</th>
                                <th className="px-6 py-3 font-semibold">Description</th>
                                <th className="px-6 py-3 font-semibold">Priority</th>
                                <th className="px-6 py-3 font-semibold">Visible</th>
                                <th className="px-6 py-3 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubSubCategories.map((item) => (
                                <tr key={item.id} className="border-t border-stone-100 transition-colors hover:bg-stone-50">
                                    <td className="px-6 py-3.5">
                                        {item.image_url ? (
                                            <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
                                                <Image src={item.image_url} alt={item.name} fill sizes="48px" className="object-cover" />
                                            </div>
                                        ) : (
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-stone-300">
                                                <ImageOff size={18} />
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-3.5 font-semibold text-black">{item.name}</td>
                                    <td className="px-6 py-3.5">
                                        <span className="inline-flex rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">
                                            {item.category_name} / {item.sub_category_name}
                                        </span>
                                    </td>
                                    <td className="max-w-xs truncate px-6 py-3.5 text-stone-600">
                                        {item.description || '—'}
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <PriorityInput id={item.id} subCategoryId={item.sub_category_id} value={item.priority} />
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <VisibilityToggle id={item.id} isVisible={item.is_visible} />
                                    </td>
                                    <td className="px-6 py-3.5 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => setEditingSubSubCategory(item)}
                                                className="rounded-lg p-2 text-stone-300 transition-colors hover:bg-stone-100 hover:text-[#141414]"
                                                aria-label={`Edit ${item.name}`}
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm('Warning: Deleting this sub-sub-category will permanently delete ALL products inside it. Are you absolutely sure?')) {
                                                        startTransition(async () => {
                                                            try {
                                                                await deleteSubSubCategory(item.id, item.image_url)
                                                                toast.success('Sub-sub-category deleted successfully')
                                                            } catch (err: any) {
                                                                toast.error(err.message || 'Failed to delete sub-sub-category')
                                                            }
                                                        })
                                                    }
                                                }}
                                                className="rounded-lg p-2 text-stone-300 transition-colors hover:bg-rose-50 hover:text-rose-500"
                                                aria-label={`Delete ${item.name}`}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {filteredSubSubCategories.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-stone-500">
                                        {subSubCategories.length === 0
                                            ? 'No sub-sub-categories yet. Click "Add Sub-Sub-Category" to create your first one.'
                                            : 'No sub-sub-categories match your search or filter.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card Layout */}
            <div className="flex flex-col gap-4 md:hidden">
                {filteredSubSubCategories.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start gap-4">
                            {item.image_url ? (
                                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
                                    <Image src={item.image_url} alt={item.name} fill sizes="64px" className="object-cover" />
                                </div>
                            ) : (
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-stone-300">
                                    <ImageOff size={24} />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-black truncate">{item.name}</h3>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                    <span className="inline-flex rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600">
                                        {item.category_name} / {item.sub_category_name}
                                    </span>
                                </div>
                                <p className="mt-1.5 text-xs text-stone-500 line-clamp-2">
                                    {item.description || 'No description'}
                                </p>
                            </div>
                        </div>
                        
                        <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-4">
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-medium uppercase tracking-wider text-stone-400">Visible</span>
                                    <VisibilityToggle id={item.id} isVisible={item.is_visible} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-medium uppercase tracking-wider text-stone-400">Priority</span>
                                    <PriorityInput id={item.id} subCategoryId={item.sub_category_id} value={item.priority} />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setEditingSubSubCategory(item)}
                                    className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-black"
                                    aria-label={`Edit ${item.name}`}
                                >
                                    <Pencil size={18} />
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm('Warning: Deleting this sub-sub-category will permanently delete ALL products inside it. Are you absolutely sure?')) {
                                            startTransition(async () => {
                                                            try {
                                                                await deleteSubSubCategory(item.id, item.image_url)
                                                                toast.success('Sub-sub-category deleted successfully')
                                                            } catch (err: any) {
                                                                toast.error(err.message || 'Failed to delete sub-sub-category')
                                                            }
                                                        })
                                        }
                                    }}
                                    className="rounded-lg p-2 text-rose-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                    aria-label={`Delete ${item.name}`}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredSubSubCategories.length === 0 && (
                    <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">
                        {subSubCategories.length === 0
                            ? 'No sub-sub-categories yet. Click "Add Sub-Sub-Category" to create your first one.'
                            : 'No sub-sub-categories match your search or filter.'}
                    </div>
                )}
            </div>

            {showModal && (
                <AddSubSubCategoryModal
                    subCategoryOptions={subCategoryOptions}
                    onClose={() => setShowModal(false)}
                />
            )}
            {editingSubSubCategory && (
                <EditSubSubCategoryModal
                    subSubCategory={editingSubSubCategory}
                    subCategoryOptions={subCategoryOptions}
                    onClose={() => setEditingSubSubCategory(null)}
                />
            )}
        </div>
    )
}