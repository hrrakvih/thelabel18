// app/admin/products/list/ProductsListClient.tsx
'use client'

import { Fragment, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ChevronDown,
  Eye,
  Pencil,
  Trash2,
  ImageOff,
  Barcode as BarcodeIcon,
  X,
  Printer,
  Download,
  Search,
  Package,
  CheckCircle2,
  EyeOff,
  ArrowUpDown,
  Plus,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { toggleProductVisibility, toggleVariationVisibility, deleteProduct } from './actions'

export type Variation = {
  id: string
  sku: string | null
  size: string | null
  color: string | null
  color_hex: string | null
  image_url: string | null
  stock_quantity: number
  price: number
  compare_at_price: number | null
  is_visible: boolean
}

export type ProductRow = {
  id: string
  sku: string
  name: string
  description: string | null
  image_url: string | null
  is_visible: boolean
  category: { name: string, is_visible: boolean } | null
  sub_category: { name: string, is_visible: boolean } | null
  sub_sub_category: { name: string, is_visible: boolean } | null
  variations: Variation[]
}

type StockSort = 'none' | 'low-high' | 'high-low'

function StatusToggle({
  isVisible,
  onChange,
}: {
  isVisible: boolean
  onChange: (next: boolean) => Promise<void>
}) {
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
        setChecked(next)
        startTransition(async () => {
          try {
            await onChange(next)
            toast.success(next ? 'Visibility updated: Visible' : 'Visibility updated: Hidden')
          } catch (err: any) {
            setChecked(!next)
            toast.error(err?.message || 'Failed to update visibility')
          }
        })
      }}
      className={[
        'relative inline-block h-6 w-11 shrink-0 rounded-full align-middle transition-colors duration-200 disabled:opacity-50',
        checked ? 'bg-black' : 'bg-stone-200',
      ].join(' ')}
    >
      <span
        className={[
          'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  )
}
// ---------------------------------------------------------------------------
// Barcode modal — renders a CODE128 barcode for a variation's SKU with
// print and download actions. Requires: npm install jsbarcode
// ---------------------------------------------------------------------------
function BarcodeModal({ sku, onClose }: { sku: string; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    import('jsbarcode').then((JsBarcodeModule) => {
      if (cancelled || !canvasRef.current) return
      const JsBarcode = JsBarcodeModule.default
      JsBarcode(canvasRef.current, sku, {
        format: 'CODE128',
        width: 2,
        height: 70,
        displayValue: true,
        fontSize: 14,
        margin: 10,
      })
      setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [sku])

  function handleDownload() {
    if (!canvasRef.current) return
    const url = canvasRef.current.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `${sku}-barcode.png`
    a.click()
  }

  function handlePrint() {
    if (!canvasRef.current) return
    const url = canvasRef.current.toDataURL('image/png')
    const win = window.open('', '_blank', 'width=400,height=300')
    if (!win) return
    win.document.write(`
      <html>
        <head><title>${sku} barcode</title></head>
        <body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
          <img src="${url}" onload="window.print(); window.onafterprint = () => window.close();" />
        </body>
      </html>
    `)
    win.document.close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold text-black">Barcode</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-black">
            <X size={18} />
          </button>
        </div>

        <div className="flex justify-center rounded-xl border border-stone-200 bg-white p-4">
          <canvas ref={canvasRef} />
        </div>

        <div className="mt-5 flex gap-3">
          <button
            onClick={handlePrint}
            disabled={!ready}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-stone-300 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
          >
            <Printer size={15} />
            Print
          </button>
          <button
            onClick={handleDownload}
            disabled={!ready}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-black py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            <Download size={15} />
            Download
          </button>
        </div>
      </div>
    </div>
  )
}

function VariationsPanel({ variations }: { variations: Variation[] }) {
  const [barcodeSku, setBarcodeSku] = useState<string | null>(null)

  if (variations.length === 0) {
    return <p className="px-6 py-4 text-sm text-stone-400">No variations for this product.</p>
  }

  return (
    <>
      <table className="min-w-[900px] w-full text-left text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-stone-400">
            <th className="px-6 py-2 font-semibold">Image</th>
            <th className="px-6 py-2 font-semibold">SKU</th>
            <th className="px-6 py-2 font-semibold">Size</th>
            <th className="px-6 py-2 font-semibold">Color</th>
            <th className="px-6 py-2 font-semibold">Stock</th>
            <th className="px-6 py-2 font-semibold">Price</th>
            <th className="px-6 py-2 font-semibold">Status</th>
            <th className="px-6 py-2 font-semibold text-right">Barcode</th>
          </tr>
        </thead>
        <tbody>
          {variations.map((v) => (
            <tr key={v.id} className="border-t border-stone-100">
              <td className="px-6 py-2.5">
                {v.image_url ? (
                  <div className="relative h-9 w-9 overflow-hidden rounded-md border border-stone-200 bg-white">
                    <Image src={v.image_url} alt={v.color || v.sku || ''} fill sizes="36px" className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-300">
                    <ImageOff size={14} />
                  </div>
                )}
              </td>
              <td className="px-6 py-2.5 font-outfit text-xs text-stone-600">{v.sku || '—'}</td>
              <td className="px-6 py-2.5 text-stone-700">{v.size || '—'}</td>
              <td className="px-6 py-2.5">
                <span className="flex items-center gap-2 text-stone-700">
                  {v.color_hex && (
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-stone-300"
                      style={{ backgroundColor: v.color_hex }}
                    />
                  )}
                  {v.color || '—'}
                </span>
              </td>
              <td className="px-6 py-2.5 text-stone-700">{v.stock_quantity}</td>
              <td className="px-6 py-2.5 text-stone-700">
                ₹{Number(v.price).toLocaleString()}
                {v.compare_at_price && (
                  <span className="ml-1.5 text-xs text-stone-400 line-through">
                    ₹{Number(v.compare_at_price).toLocaleString()}
                  </span>
                )}
              </td>
              <td className="px-6 py-2.5 align-middle">
                <div className="flex items-center">
                  <StatusToggle
                    isVisible={v.is_visible}
                    onChange={(next) => toggleVariationVisibility(v.id, next)}
                  />
                </div>
              </td>
              <td className="px-6 py-2.5 text-right">
                <button
                  onClick={() => v.sku && setBarcodeSku(v.sku)}
                  disabled={!v.sku}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40"
                >
                  <BarcodeIcon size={13} />
                  Generate
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {barcodeSku && <BarcodeModal sku={barcodeSku} onClose={() => setBarcodeSku(null)} />}
    </>
  )
}

function totalStock(p: ProductRow) {
  return p.variations.reduce((sum, v) => sum + (v.stock_quantity || 0), 0)
}

export default function ProductsListClient({ products }: { products: ProductRow[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [subCategoryFilter, setSubCategoryFilter] = useState('')
  const [subSubCategoryFilter, setSubSubCategoryFilter] = useState('')
  const [stockSort, setStockSort] = useState<StockSort>('none')

  // --- Stats -----------------------------------------------------------
  const totalCount = products.length
  const activeCount = products.filter((p) => p.is_visible).length
  const inactiveCount = totalCount - activeCount

  // --- Filter option lists, cascading off what's actually in the data --
  const categoryOptions = useMemo(
    () => Array.from(new Set(products.map((p) => p.category?.name).filter(Boolean))) as string[],
    [products]
  )
  const subCategoryOptions = useMemo(() => {
    const pool = categoryFilter
      ? products.filter((p) => p.category?.name === categoryFilter)
      : products
    return Array.from(new Set(pool.map((p) => p.sub_category?.name).filter(Boolean))) as string[]
  }, [products, categoryFilter])
  const subSubCategoryOptions = useMemo(() => {
    const pool = products.filter(
      (p) =>
        (!categoryFilter || p.category?.name === categoryFilter) &&
        (!subCategoryFilter || p.sub_category?.name === subCategoryFilter)
    )
    return Array.from(
      new Set(pool.map((p) => p.sub_sub_category?.name).filter(Boolean))
    ) as string[]
  }, [products, categoryFilter, subCategoryFilter])

  // --- Apply search + filters + sort ------------------------------------
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()

    let result = products.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.variations.some((v) => (v.sku || '').toLowerCase().includes(q))

      const matchesCategory = !categoryFilter || p.category?.name === categoryFilter
      const matchesSubCategory = !subCategoryFilter || p.sub_category?.name === subCategoryFilter
      const matchesSubSubCategory =
        !subSubCategoryFilter || p.sub_sub_category?.name === subSubCategoryFilter

      return matchesSearch && matchesCategory && matchesSubCategory && matchesSubSubCategory
    })

    if (stockSort !== 'none') {
      result = [...result].sort((a, b) =>
        stockSort === 'low-high' ? totalStock(a) - totalStock(b) : totalStock(b) - totalStock(a)
      )
    }

    return result
  }, [products, search, categoryFilter, subCategoryFilter, subSubCategoryFilter, stockSort])

  const selectClass =
    'rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-black outline-none focus:border-black disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <div>
      {/* Header */}
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white px-4 py-5 md:px-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black">Products</h1>
          <p className="mt-1 text-sm font-medium text-stone-600">
            {products.length} product{products.length === 1 ? '' : 's'} · expand a row to manage its variations
          </p>
        </div>
        <Link
          href="/admin/products/add"
          className="flex w-full md:w-auto justify-center items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.99]"
        >
          <Plus size={15} strokeWidth={2} />
          Add Product
        </Link>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        <div className="flex items-center gap-3 sm:gap-4 rounded-2xl border border-stone-200 bg-white p-3.5 sm:p-5 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600 shrink-0">
            <Package size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Total Products
            </p>
            <p className="mt-0.5 text-2xl font-bold text-black">{totalCount}</p>
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
            <EyeOff size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Inactive
            </p>
            <p className="mt-0.5 text-2xl font-bold text-black">{inactiveCount}</p>
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
            placeholder="Search by product name or SKU…"
            className="w-full rounded-xl border border-stone-300 bg-white py-2.5 pl-10 pr-3.5 text-sm text-black outline-none focus:border-black"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value)
            setSubCategoryFilter('')
            setSubSubCategoryFilter('')
          }}
          className={selectClass}
        >
          <option value="">All Categories</option>
          {categoryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={subCategoryFilter}
          onChange={(e) => {
            setSubCategoryFilter(e.target.value)
            setSubSubCategoryFilter('')
          }}
          disabled={subCategoryOptions.length === 0}
          className={selectClass}
        >
          <option value="">All Sub Categories</option>
          {subCategoryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={subSubCategoryFilter}
          onChange={(e) => setSubSubCategoryFilter(e.target.value)}
          disabled={subSubCategoryOptions.length === 0}
          className={selectClass}
        >
          <option value="">All Sub Sub Categories</option>
          {subSubCategoryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <div className="relative">
          <ArrowUpDown
            size={14}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <select
            value={stockSort}
            onChange={(e) => setStockSort(e.target.value as StockSort)}
            className={`${selectClass} pl-9`}
          >
            <option value="none">Sort by Stock</option>
            <option value="low-high">Stock: Low to High</option>
            <option value="high-low">Stock: High to Low</option>
          </select>
        </div>

        {(search || categoryFilter || subCategoryFilter || subSubCategoryFilter || stockSort !== 'none') && (
          <button
            onClick={() => {
              setSearch('')
              setCategoryFilter('')
              setSubCategoryFilter('')
              setSubSubCategoryFilter('')
              setStockSort('none')
            }}
            className="rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50"
          >
            Clear
          </button>
        )}
      </div>

      <div className="hidden md:block overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table className="min-w-[900px] w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-[11px] uppercase tracking-wider text-stone-500">
              <th className="px-6 py-3 font-semibold w-8"></th>
              <th className="px-6 py-3 font-semibold">Image</th>
              <th className="px-6 py-3 font-semibold">SKU</th>
              <th className="px-6 py-3 font-semibold">Product Name</th>
              <th className="px-6 py-3 font-semibold">Category</th>
              <th className="px-6 py-3 font-semibold">Sub Category</th>
              <th className="px-6 py-3 font-semibold">Sub Sub Category</th>
              <th className="px-6 py-3 font-semibold">Stock</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p) => {
              const isOpen = expanded === p.id
              return (
                <Fragment key={p.id}>
                  <tr className="border-t border-stone-100 hover:bg-stone-50">
                    <td className="px-6 py-3.5">
                      <button
                        onClick={() => setExpanded(isOpen ? null : p.id)}
                        className="text-stone-400 hover:text-black"
                        aria-label="Toggle variations"
                      >
                        <ChevronDown
                          size={16}
                          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-3.5">
                      {p.image_url ? (
                        <div className="relative h-11 w-11 overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
                          <Image src={p.image_url} alt={p.name} fill sizes="44px" className="object-cover" />
                        </div>
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-stone-300">
                          <ImageOff size={16} />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3.5 font-outfit text-xs text-stone-600">{p.sku}</td>
                    <td className="px-6 py-3.5 font-semibold text-black">{p.name}</td>
                    <td className="px-6 py-3.5 text-stone-600">{p.category?.name || '—'}</td>
                    <td className="px-6 py-3.5 text-stone-600">{p.sub_category?.name || '—'}</td>
                    <td className="px-6 py-3.5 text-stone-600">{p.sub_sub_category?.name || '—'}</td>
                    <td className="px-6 py-3.5 text-stone-600">{totalStock(p)}</td>
                    <td className="px-6 py-3.5">
                      <StatusToggle
                        isVisible={p.is_visible}
                        onChange={(next) => toggleProductVisibility(p.id, next)}
                      />
                      {p.category?.is_visible === false ? (
                        <div className="mt-1.5 text-[10px] text-rose-500 font-medium leading-tight max-w-[120px]">
                          Hidden (Category inactive)
                        </div>
                      ) : p.sub_category?.is_visible === false ? (
                        <div className="mt-1.5 text-[10px] text-rose-500 font-medium leading-tight max-w-[120px]">
                          Hidden (Sub-category inactive)
                        </div>
                      ) : p.sub_sub_category?.is_visible === false ? (
                        <div className="mt-1.5 text-[10px] text-rose-500 font-medium leading-tight max-w-[120px]">
                          Hidden (Sub-sub-category inactive)
                        </div>
                      ) : null}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/products/view/${p.id}`}
                          className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-black"
                          aria-label="View"
                        >
                          <Eye size={16} />
                        </Link>
                        <Link
                          href={`/admin/products/add?edit_id=${p.id}`}
                          className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-black"
                          aria-label="Edit"
                        >
                          <Pencil size={16} />
                        </Link>
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${p.name}"? This cannot be undone.`)) {
                              startTransition(async () => {
                                try {
                                  await deleteProduct(p.id, p.image_url)
                                  toast.success('Product deleted successfully')
                                } catch (err: any) {
                                  toast.error(err.message)
                                }
                              })
                            }
                          }}
                          className="rounded-lg p-2 text-stone-400 hover:bg-rose-50 hover:text-rose-500"
                          aria-label="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={10} className="bg-stone-50/60 px-0 py-0">
                        <VariationsPanel variations={p.variations} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}

            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-sm text-stone-500">
                  {products.length === 0
                    ? 'No products yet.'
                    : 'No products match your search or filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="flex flex-col gap-4 md:hidden">
        {filteredProducts.map((p) => {
          const isOpen = expanded === p.id
          return (
            <div key={p.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm flex flex-col gap-4">
              <div className="flex items-start gap-4">
                {p.image_url ? (
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
                    <Image src={p.image_url} alt={p.name} fill sizes="80px" className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-stone-300">
                    <ImageOff size={24} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-black truncate">{p.name}</h3>
                  <p className="font-outfit text-xs text-stone-500 mt-0.5">SKU: {p.sku}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.category && <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-600">{p.category.name}</span>}
                    {p.sub_category && <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-600">{p.sub_category.name}</span>}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 border-t border-stone-100 pt-4">
                <div>
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-stone-500">Total Stock</span>
                  <span className="mt-0.5 block text-sm font-medium text-black">{totalStock(p)} units</span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-stone-500">Visible</span>
                  <div className="mt-0.5">
                    <StatusToggle
                      isVisible={p.is_visible}
                      onChange={(next) => toggleProductVisibility(p.id, next)}
                    />
                    {p.category?.is_visible === false ? (
                      <div className="mt-1.5 text-[10px] text-rose-500 font-medium leading-tight">
                        Hidden (Category inactive)
                      </div>
                    ) : p.sub_category?.is_visible === false ? (
                      <div className="mt-1.5 text-[10px] text-rose-500 font-medium leading-tight">
                        Hidden (Sub-category inactive)
                      </div>
                    ) : p.sub_sub_category?.is_visible === false ? (
                      <div className="mt-1.5 text-[10px] text-rose-500 font-medium leading-tight">
                        Hidden (Sub-sub-category inactive)
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-stone-100 pt-4">
                <button
                  onClick={() => setExpanded(isOpen ? null : p.id)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-black"
                >
                  <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  {isOpen ? 'Hide Variations' : 'Show Variations'}
                </button>
                <div className="flex items-center gap-1">
                  <Link href={`/admin/products/view/${p.id}`} className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-black">
                    <Eye size={16} />
                  </Link>
                  <Link href={`/admin/products/add?edit_id=${p.id}`} className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-black">
                    <Pencil size={16} />
                  </Link>
                  <button onClick={() => {
                    if (confirm(`Delete "${p.name}"? This cannot be undone.`)) {
                      startTransition(async () => {
                        try {
                          await deleteProduct(p.id, p.image_url)
                          toast.success('Product deleted successfully')
                        } catch (err: any) {
                          toast.error(err.message)
                        }
                      })
                    }
                  }} className="rounded-lg p-2 text-stone-400 hover:bg-rose-50 hover:text-rose-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              {isOpen && (
                <div className="mt-2 rounded-xl bg-stone-50 overflow-hidden">
                  <VariationsPanel variations={p.variations} />
                </div>
              )}
            </div>
          )
        })}

        {filteredProducts.length === 0 && (
          <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">
            {products.length === 0 ? 'No products yet.' : 'No products match your search or filters.'}
          </div>
        )}
      </div>
    </div>
  )
}