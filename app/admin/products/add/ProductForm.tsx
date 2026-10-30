'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  Plus,
  Trash2,
  ImageOff,
  X,
  RotateCcw,
  Info,
  Layers,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Check
} from 'lucide-react'
import toast from 'react-hot-toast'
import { createProduct, updateProduct, uploadSingleImageAction } from './actions'
import { handleFileSelection } from '@/lib/utils/image-helpers'

type Category = { id: string; name: string }
type SubCategory = { id: string; name: string; category_id: string }
type SubSubCategory = { id: string; name: string; sub_category_id: string }


type ExistingProduct = {
  id: string
  sku: string
  name: string
  description: string | null
  image_url: string | null
  category_id: string
  sub_category_id: string | null
  sub_sub_category_id: string | null
  variations: {
    size: string | null
    color: string | null
    color_hex: string | null
    stock_quantity: number
    price: number
    compare_at_price: number | null
    image_url: string | null
    image_urls?: string[]
  }[]
}

type Variation = {
  key: string
  size: string
  color: string
  color_hex: string
  stock: string
  price: string
  compare_at_price: string
  images: File[]
  existing_image_urls: string[]
}

function emptyVariation(): Variation {
  return {
    key: crypto.randomUUID(),
    size: '',
    color: '',
    color_hex: '',
    stock: '0',
    price: '',
    compare_at_price: '',
    images: [],
    existing_image_urls: [],
  }
}

// ---- Color palette --------------------------------------------------------
// Every shade belongs to a "family". Storing color_family alongside the
// specific shade lets a storefront search for "Pink" and match every
// variation whose family is Pink, regardless of which exact shade it is.

const COLOR_PALETTE: { family: string; hex: string; shades: { name: string; hex: string }[] }[] = [
  {
    family: 'Pink',
    hex: '#FF66CC',
    shades: [
      { name: 'Baby Pink', hex: '#F4C2C2' },
      { name: 'Blush Pink', hex: '#DE5D83' },
      { name: 'Rose Pink', hex: '#FF66CC' },
      { name: 'Hot Pink', hex: '#FF69B4' },
      { name: 'Fuchsia', hex: '#FF00FF' },
      { name: 'Salmon Pink', hex: '#FF91A4' },
      { name: 'Magenta', hex: '#D6336C' },
    ],
  },
  {
    family: 'Red',
    hex: '#E53935',
    shades: [
      { name: 'Crimson', hex: '#DC143C' },
      { name: 'Scarlet', hex: '#FF2400' },
      { name: 'Maroon', hex: '#800000' },
      { name: 'Brick Red', hex: '#B22222' },
      { name: 'Cherry Red', hex: '#D2042D' },
    ],
  },
  {
    family: 'Orange',
    hex: '#FB8C00',
    shades: [
      { name: 'Burnt Orange', hex: '#CC5500' },
      { name: 'Tangerine', hex: '#F28500' },
      { name: 'Peach', hex: '#FFCBA4' },
      { name: 'Amber', hex: '#FFBF00' },
    ],
  },
  {
    family: 'Yellow',
    hex: '#FDD835',
    shades: [
      { name: 'Mustard', hex: '#E1AD01' },
      { name: 'Lemon Yellow', hex: '#FFF44F' },
      { name: 'Gold', hex: '#D4AF37' },
      { name: 'Cream', hex: '#FFFDD0' },
    ],
  },
  {
    family: 'Green',
    hex: '#43A047',
    shades: [
      { name: 'Olive', hex: '#808000' },
      { name: 'Sage Green', hex: '#9CAF88' },
      { name: 'Emerald', hex: '#50C878' },
      { name: 'Forest Green', hex: '#228B22' },
      { name: 'Mint', hex: '#98FF98' },
      { name: 'Khaki', hex: '#C3B091' },
    ],
  },
  {
    family: 'Blue',
    hex: '#1E88E5',
    shades: [
      { name: 'Navy Blue', hex: '#001F54' },
      { name: 'Sky Blue', hex: '#87CEEB' },
      { name: 'Royal Blue', hex: '#4169E1' },
      { name: 'Denim Blue', hex: '#1560BD' },
      { name: 'Teal', hex: '#008080' },
      { name: 'Turquoise', hex: '#40E0D0' },
    ],
  },
  {
    family: 'Purple',
    hex: '#8E24AA',
    shades: [
      { name: 'Lavender', hex: '#B57EDC' },
      { name: 'Lilac', hex: '#C8A2C8' },
      { name: 'Violet', hex: '#7F00FF' },
      { name: 'Plum', hex: '#8E4585' },
    ],
  },
  {
    family: 'Brown',
    hex: '#6D4C41',
    shades: [
      { name: 'Tan', hex: '#D2B48C' },
      { name: 'Camel', hex: '#C19A6B' },
      { name: 'Chocolate Brown', hex: '#7B3F00' },
      { name: 'Chestnut', hex: '#954535' },
      { name: 'Beige', hex: '#F5F5DC' },
    ],
  },
  {
    family: 'Neutral',
    hex: '#9E9E9E',
    shades: [
      { name: 'Black', hex: '#000000' },
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Ivory', hex: '#FFFFF0' },
      { name: 'Charcoal Grey', hex: '#36454F' },
      { name: 'Light Grey', hex: '#D3D3D3' },
      { name: 'Silver', hex: '#C0C0C0' },
    ],
  },
]

function findShade(colorFamily: string, colorName: string) {
  const fam = COLOR_PALETTE.find((f) => f.family === colorFamily)
  return fam?.shades.find((s) => s.name === colorName) ?? null
}

// ---- SKU auto-numbering helpers ----------------------------------------
// Counters are kept in localStorage, one per label, so numbering continues
// from wherever it last left off for that label (e.g. "TL18-BAG" -> 0007
// next time even after a page refresh). Swap this for a server-driven
// counter (e.g. a DB sequence per label) if you want it shared across users.

const SKU_COUNTER_PREFIX = 'sku_counter:'

function normalizeLabel(label: string) {
  return label.trim().toUpperCase().replace(/\s+/g, '-')
}

function getNextSkuNumber(label: string): number {
  if (typeof window === 'undefined' || !label) return 1
  const key = SKU_COUNTER_PREFIX + label
  const raw = window.localStorage.getItem(key)
  const next = raw ? parseInt(raw, 10) + 1 : 1
  return Number.isFinite(next) ? next : 1
}

function commitSkuNumber(label: string, usedNumber: number) {
  if (typeof window === 'undefined' || !label) return
  const key = SKU_COUNTER_PREFIX + label
  window.localStorage.setItem(key, String(usedNumber))
}

function buildSku(label: string, num: number) {
  const padded = String(num).padStart(4, '0')
  return label ? `${label}-${padded}` : ''
}
// -------------------------------------------------------------------------

// ---- "No color" swatch -----------------------------------------------
// A blank white circle looks like "white was picked" or like a loading
// state. This renders the classic Illustrator/Figma "no color" swatch:
// a circle with a single diagonal line through it, so an unset color is
// visually unambiguous wherever a swatch is shown.
function NoColorSwatch({ size = 20 }: { size?: number }) {
  return (
    <span
      className="relative shrink-0 rounded-full border border-stone-300 bg-white overflow-hidden"
      style={{ width: size, height: size }}
    >
      <span
        className="absolute left-1/2 top-1/2 h-[140%] w-px -translate-x-1/2 -translate-y-1/2 bg-rose-300"
        style={{ transform: 'translate(-50%, -50%) rotate(45deg)' }}
      />
    </span>
  )
}

function ImagePicker({
  file,
  existingUrl,
  onChange,
  label,
}: {
  file: File | null
  existingUrl?: string | null
  onChange: (f: File | null) => void
  label: string
}) {
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : existingUrl), [file, existingUrl])

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-white">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-300">
            <ImageOff size={18} />
          </div>
        )}
      </div>
      <label className="cursor-pointer rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-stone-700 transition-colors hover:border-black hover:text-black">
        {file ? 'Change image' : 'Upload image'}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? [])
            if (files.length > 0) {
              handleFileSelection(files, (processed) => onChange(processed[0]))
            } else {
              onChange(null)
            }
          }}
        />
      </label>
      {file && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-stone-300 hover:text-rose-500"
          aria-label="Remove image"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}

function MultiImagePicker({
  files,
  existingUrls,
  onChange,
  label,
}: {
  files: File[]
  existingUrls: string[]
  onChange: (files: File[], urls: string[]) => void
  label: string
}) {
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files])

  const handleAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const rawFiles = Array.from(e.target.files)
      handleFileSelection(rawFiles, (processedNewFiles) => {
        onChange([...files, ...processedNewFiles], existingUrls)
      })
    }
  }

  const handleRemoveFile = (index: number) => {
    const newFiles = [...files]
    newFiles.splice(index, 1)
    onChange(newFiles, existingUrls)
  }

  const handleRemoveExisting = (index: number) => {
    const newUrls = [...existingUrls]
    newUrls.splice(index, 1)
    onChange(files, newUrls)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {existingUrls.map((url, i) => {
          const isCover = i === 0;
          return (
            <div key={`existing-${i}`} className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-white ${isCover ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-stone-200'}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`${label} existing ${i}`} className="h-full w-full object-cover" />
              <span className={`absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-white backdrop-blur-xs ${isCover ? 'bg-amber-600' : 'bg-black/75'}`}>
                {isCover ? 'Cover #1' : `Angle #${i + 1}`}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveExisting(i)}
                className="absolute top-1 right-1 rounded-full bg-white/90 p-1 text-stone-600 hover:text-rose-500 shadow-sm backdrop-blur"
                aria-label="Remove image"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
        {previews.map((preview, i) => {
          const globalIdx = existingUrls.length + i;
          const isCover = globalIdx === 0;
          return (
            <div key={`new-${i}`} className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-white ${isCover ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-stone-200'}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt={`${label} new ${i}`} className="h-full w-full object-cover" />
              <span className={`absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-white backdrop-blur-xs ${isCover ? 'bg-amber-600' : `Angle #${globalIdx + 1}`}`}>
                {isCover ? 'Cover #1' : `Angle #${globalIdx + 1}`}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveFile(i)}
                className="absolute top-1 right-1 rounded-full bg-white/90 p-1 text-stone-600 hover:text-rose-500 shadow-sm backdrop-blur"
                aria-label="Remove image"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
        {existingUrls.length === 0 && files.length === 0 && (
          <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-50 text-stone-400">
            <ImageOff size={20} />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <div>
          <label className="inline-block cursor-pointer rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 transition-colors hover:border-black hover:text-black">
            + Add images
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleAdd}
            />
          </label>
        </div>
        <p className="text-[11px] text-stone-500 leading-relaxed">
          <strong className="text-stone-700">Cover #1</strong> is shown on the left-side thumbnail. Additional angles appear in the bottom-right gallery inside the big photo on the product page.
        </p>
        <p className="text-[11px] text-amber-600 leading-relaxed">
          ⚠️ Max <strong>4MB per image</strong>. Large photos are auto-compressed, but very high-res files may be rejected.
        </p>
      </div>
    </div>
  )
}

// ---- Color picker (Family -> Shade) ---------------------------------------
// Search-friendly: picking "Pink" as the family, then a specific shade,
// stores both the exact shade (color/color_hex) and the broader family
// (color_family) so a storefront filter for "Pink" matches every shade.

function ColorPicker({
  colorName,
  colorHex,
  onChange,
}: {
  colorName: string
  colorHex: string
  onChange: (patch: { color?: string; color_hex?: string }) => void
}) {
  const [open, setOpen] = useState(false)
  const activeFamily = COLOR_PALETTE.find((f) => f.shades.some(s => s.name === colorName))
  const colorFamily = activeFamily?.family || ''
  const swatchHex = colorHex || activeFamily?.hex || '#E5E5E5'

  // Lock body scroll while the modal is open so the page doesn't scroll
  // behind it.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-between gap-2 rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm text-black outline-none transition-colors focus:border-black"
        >
          <span className="flex items-center gap-2 truncate">
            {colorName ? (
              <span
                className="h-5 w-5 shrink-0 rounded-full border border-stone-300"
                style={{ backgroundColor: swatchHex }}
              />
            ) : (
              <NoColorSwatch size={20} />
            )}
            <span className="truncate text-left">
              {colorName ? (
                <>
                  {colorName}
                  <span className="ml-1 text-stone-400">· {colorFamily}</span>
                </>
              ) : (
                <span className="text-stone-400">No color / select</span>
              )}
            </span>
          </span>
          <ChevronDown size={14} className="shrink-0 text-stone-400" />
        </button>
        {colorName && (
          <button
            type="button"
            onClick={() => onChange({ color: '', color_hex: '' })}
            className="shrink-0 text-stone-300 hover:text-rose-500"
            aria-label="Clear color"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
              <div>
                <h3 className="text-sm font-bold text-black">Select Color</h3>
                <p className="text-xs text-stone-400">Pick a family, then the exact shade</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-stone-400 hover:text-black"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  onChange({ color: '', color_hex: '' })
                  setOpen(false)
                }}
                className={`mb-5 flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-colors ${!colorName
                  ? 'border-black bg-stone-100 text-black'
                  : 'border-dashed border-stone-300 text-stone-500 hover:border-stone-400'
                  }`}
              >
                <NoColorSwatch size={16} />
                No Color (this variation doesn't have one)
              </button>

              {COLOR_PALETTE.map((fam) => (
                <div key={fam.family} className="mb-5 last:mb-0">
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                    <span
                      className="h-3 w-3 rounded-full border border-stone-300"
                      style={{ backgroundColor: fam.hex }}
                    />
                    {fam.family}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {fam.shades.map((shade) => {
                      const active = colorFamily === fam.family && colorName === shade.name
                      return (
                        <button
                          key={shade.name}
                          type="button"
                          onClick={() => {
                            onChange({

                              color: shade.name,
                              color_hex: shade.hex,
                            })
                            setOpen(false)
                          }}
                          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-medium transition-colors ${active
                            ? 'border-black bg-stone-100 text-black'
                            : 'border-stone-200 text-stone-600 hover:border-stone-400'
                            }`}
                        >
                          <span
                            className="h-4 w-4 shrink-0 rounded-full border border-stone-300"
                            style={{ backgroundColor: shade.hex }}
                          />
                          <span className="truncate">{shade.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function ProductForm({
  product,
  categories,
  subCategories,
  subSubCategories,
}: {
  product?: ExistingProduct | null
  categories: Category[]
  subCategories: SubCategory[]
  subSubCategories: SubSubCategory[]
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const isEdit = !!product
  const [categoryId, setCategoryId] = useState(product?.category_id || '')
  const [subCategoryId, setSubCategoryId] = useState(product?.sub_category_id || '')
  const [subSubCategoryId, setSubSubCategoryId] = useState(product?.sub_sub_category_id || '')
  const [mainImage, setMainImage] = useState<File | null>(null)
  const [variations, setVariations] = useState<Variation[]>(
    isEdit && product && product.variations.length > 0
      ? product.variations.map((v) => ({
        key: crypto.randomUUID(),
        size: v.size || '',
        color: v.color || '',
        color_hex: v.color_hex || '',
        stock: String(v.stock_quantity),
        price: String(v.price),
        compare_at_price: v.compare_at_price != null ? String(v.compare_at_price) : '',
        images: [],
        existing_image_urls: v.image_urls && v.image_urls.length > 0
          ? v.image_urls
          : v.image_url ? [v.image_url] : [],
      }))
      : [emptyVariation()]
  )

  // Label the user types (e.g. "TL18-BAG") drives the auto-generated SKU.
  const [skuLabel, setSkuLabel] = useState('')
  const [skuNumber, setSkuNumber] = useState<number>(1)

  const normalizedLabel = normalizeLabel(skuLabel)
  const generatedSku = buildSku(normalizedLabel, skuNumber)

  // Whenever the label changes, look up (or start) that label's next number.
  useEffect(() => {
    setSkuNumber(getNextSkuNumber(normalizedLabel))
  }, [normalizedLabel])

  const filteredSubCategories = useMemo(
    () => subCategories.filter((s) => s.category_id === categoryId),
    [subCategories, categoryId]
  )
  const filteredSubSubCategories = useMemo(
    () => subSubCategories.filter((s) => s.sub_category_id === subCategoryId),
    [subSubCategories, subCategoryId]
  )

  function updateVariation(key: string, patch: Partial<Variation>) {
    setVariations((prev) => prev.map((v) => (v.key === key ? { ...v, ...patch } : v)))
  }

  function removeVariation(key: string) {
    setVariations((prev) => prev.filter((v) => v.key !== key))
  }

  function resetAll() {
    if (isEdit && product) {
      setVariations(
        product.variations.length > 0
          ? product.variations.map((v) => ({
            key: crypto.randomUUID(),
            size: v.size || '',
            color: v.color || '',
            color_hex: v.color_hex || '',
            stock: String(v.stock_quantity),
            price: String(v.price),
            compare_at_price: v.compare_at_price != null ? String(v.compare_at_price) : '',
            images: [],
            existing_image_urls: v.image_urls && v.image_urls.length > 0
              ? v.image_urls
              : v.image_url ? [v.image_url] : [],
          }))
          : [emptyVariation()]
      )
      setMainImage(null)
      setCategoryId(product.category_id || '')
      setSubCategoryId(product.sub_category_id || '')
      setSubSubCategoryId(product.sub_sub_category_id || '')
    } else {
      setVariations([emptyVariation()])
      setMainImage(null)
      setCategoryId('')
      setSubCategoryId('')
      setSubSubCategoryId('')
      setSkuLabel('')
    }
    setError(null)
    setSuccess(false)
      ; (document.getElementById('add-product-form') as HTMLFormElement)?.reset()
  }

  function handleSubmit(formData: FormData) {
    setError(null)
    setSuccess(false)

    if (!isEdit && !normalizedLabel) {
      setError('Enter a label to generate the SKU.')
      return
    }

    // Build the text-only fields into formData right away
    if (isEdit && product) {
      formData.set('existing_image_url', product.image_url || '')
    } else {
      formData.set('sku', generatedSku)
      formData.set('sku_label', normalizedLabel)
    }

    formData.set('variation_count', String(variations.length))
    variations.forEach((v, i) => {
      formData.set(`variations[${i}][size]`, v.size)
      formData.set(`variations[${i}][color]`, v.color)
      formData.set(`variations[${i}][color_hex]`, v.color_hex)
      formData.set(`variations[${i}][stock]`, v.stock)
      formData.set(`variations[${i}][price]`, v.price)
      formData.set(`variations[${i}][compare_at_price]`, v.compare_at_price)

      // Keep any existing image URLs that are already on the server
      if (isEdit) {
        v.existing_image_urls.forEach((url) => {
          formData.append(`variations[${i}][existing_image_urls][]`, url)
        })
      }
      // NOTE: We do NOT append v.images (raw files) into formData anymore.
      // Instead we upload them one-by-one below and pass their URLs.
    })

    startTransition(async () => {
      try {
        // Count how many images need uploading
        const totalImages =
          (mainImage ? 1 : 0) +
          variations.reduce((sum, v) => sum + v.images.length, 0)
        let uploaded = 0
        let toastId: string | undefined

        if (totalImages > 0) {
          toastId = toast.loading(`Uploading images (0/${totalImages})…`)
        }

        // --- Helper: upload one file, update progress toast ----------------
        async function uploadOne(file: File): Promise<string> {
          const fd = new FormData()
          fd.set('file', file)
          const res = await uploadSingleImageAction(fd)
          if (!res.success || !res.url) {
            throw new Error(res.error || 'Image upload failed')
          }
          uploaded++
          if (toastId) {
            toast.loading(`Uploading images (${uploaded}/${totalImages})…`, { id: toastId })
          }
          return res.url
        }

        // 1️⃣  Upload main product image (if any)
        if (mainImage) {
          const url = await uploadOne(mainImage)
          formData.set('main_image_url', url)
        }

        // 2️⃣  Upload each variation's images one-by-one
        for (let i = 0; i < variations.length; i++) {
          for (const img of variations[i].images) {
            const url = await uploadOne(img)
            // Pass the uploaded URL as an "existing" URL so the server
            // action doesn't need to receive any File blobs at all.
            formData.append(`variations[${i}][existing_image_urls][]`, url)
          }
        }

        // 3️⃣  Now save the product — formData contains ONLY text & URLs,
        //      so it's just a few KB and will never hit any size limit.
        if (toastId) toast.loading('Saving product…', { id: toastId })

        if (isEdit && product) {
          const res = await updateProduct(product.id, formData)
          if (toastId) toast.dismiss(toastId)
          if (res && !res.success) {
            setError(res.error || 'Failed to update product')
            toast.error(res.error || 'Failed to update product')
            return
          }
          toast.success('Product updated successfully')
          setSuccess(true)
          window.location.href = '/admin/products/list'
        } else {
          const res = await createProduct(formData)
          if (toastId) toast.dismiss(toastId)
          if (res && !res.success) {
            setError(res.error || 'Failed to create product')
            toast.error(res.error || 'Failed to create product')
            return
          }
          commitSkuNumber(normalizedLabel, skuNumber)
          toast.success('Product created successfully')
          setSuccess(true)
          setTimeout(() => setSuccess(false), 3000)
          setVariations([emptyVariation()])
          setMainImage(null)
          setCategoryId('')
          setSubCategoryId('')
          setSubSubCategoryId('')
          setSkuLabel('')
            ; (document.getElementById('add-product-form') as HTMLFormElement)?.reset()
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
        toast.error(err instanceof Error ? err.message : 'Failed to save product')
      }
    })
  }

  const inputClass =
    'w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-black outline-none transition-colors focus:border-black'
  const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-stone-500'

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white px-4 py-5 md:px-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black">{isEdit ? 'Edit Product' : 'Add Product'}</h1>
          <p className="mt-1 text-sm font-medium text-stone-600">
            {variations.length} variation{variations.length === 1 ? '' : 's'} · {isEdit ? 'Update product info and variations' : 'Assign a category and add size/color options'}
          </p>
        </div>
        <button
          type="button"
          onClick={resetAll}
          className="flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition-colors hover:border-black hover:text-black active:scale-[0.99]"
        >
          <RotateCcw size={15} strokeWidth={2} />
          Clear Form
        </button>
      </div>

      <form
        id="add-product-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(new FormData(e.currentTarget));
        }}
        className="space-y-6"
      >
        {/* Basic info */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-600">
              <Info size={15} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-black">Product Details</h2>
              <p className="text-xs text-stone-400">Core info shown across the storefront</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {isEdit ? (
              <div className="space-y-1.5 sm:col-span-2">
                <label className={labelClass}>SKU Number</label>
                <input name="sku" required defaultValue={product?.sku} className={inputClass} />
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className={labelClass}>Label</label>
                  <input
                    value={skuLabel}
                    onChange={(e) => setSkuLabel(e.target.value)}
                    required
                    placeholder="TL18-BAG"
                    className={inputClass}
                  />
                  <p className="text-[11px] text-stone-400">
                    A short prefix — the SKU number continues from wherever this label last left off.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>SKU Number (auto-generated)</label>
                  <input
                    name="sku"
                    value={generatedSku}
                    readOnly
                    placeholder="Enter a label first"
                    className={`${inputClass} cursor-not-allowed bg-stone-50 text-stone-500`}
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5 sm:col-span-2">
              <label className={labelClass}>Product Name</label>
              <input name="name" required defaultValue={product?.name} placeholder="Signature Tote" className={inputClass} />
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Category</label>
              <select
                name="category_id"
                required
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value)
                  setSubCategoryId('')
                  setSubSubCategoryId('')
                }}
                className={inputClass}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Sub Category</label>
              <select
                name="sub_category_id"
                value={subCategoryId}
                onChange={(e) => {
                  setSubCategoryId(e.target.value)
                  setSubSubCategoryId('')
                }}
                disabled={!categoryId}
                className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <option value="">
                  {categoryId ? 'Select sub category (optional)' : 'Choose a category first'}
                </option>
                {filteredSubCategories.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className={labelClass}>Sub Sub Category</label>
              <select
                name="sub_sub_category_id"
                value={subSubCategoryId}
                onChange={(e) => setSubSubCategoryId(e.target.value)}
                disabled={!subCategoryId}
                className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-50 sm:max-w-xs`}
              >
                <option value="">
                  {subCategoryId ? 'Select sub sub category (optional)' : 'Choose a sub category first'}
                </option>
                {filteredSubSubCategories.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className={labelClass}>Description</label>
              <textarea
                name="description"
                rows={4}
                defaultValue={product?.description || ""}
                placeholder="A short, storefront-facing description of the product…"
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2 border-t border-stone-100 pt-5">
              <label className={labelClass}>Overall Product Image</label>
              <p className="mb-2 text-xs text-stone-400">
                The single main image for this product (used when no specific variation image applies).
              </p>
              <ImagePicker file={mainImage} existingUrl={product?.image_url} onChange={setMainImage} label="Product image" />
            </div>
          </div>
        </div>

        {/* Variations */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-600">
                <Layers size={15} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-black">Variations</h2>
                <p className="text-xs text-stone-400">
                  One row per size/color combo — each can have its own stock, price, and image
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setVariations((prev) => [...prev, emptyVariation()])}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-stone-300 px-3.5 py-2.5 text-xs font-semibold text-stone-700 transition-colors hover:border-black hover:text-black"
            >
              <Plus size={14} />
              Add Variation
            </button>
          </div>

          <div className="space-y-4">
            {variations.map((v, i) => (
              <div
                key={v.key}
                className="rounded-xl border border-stone-200 bg-stone-50 p-4 transition-colors hover:border-stone-300"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="inline-flex items-center rounded-md bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-stone-500 ring-1 ring-stone-200">
                    Variation {i + 1}
                  </span>
                  {variations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariation(v.key)}
                      className="text-stone-400 hover:text-rose-500"
                      aria-label="Remove variation"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-stone-500">Size</label>
                    <input
                      value={v.size}
                      onChange={(e) => updateVariation(v.key, { size: e.target.value })}
                      placeholder="M"
                      className={inputClass}
                    />
                  </div>
                  <div className="col-span-2 space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-medium text-stone-500">Color</label>
                    <ColorPicker
                      colorName={v.color}
                      colorHex={v.color_hex}
                      onChange={(patch) => updateVariation(v.key, patch)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-stone-500">Stock Amount</label>
                    <input
                      type="number"
                      min={0}
                      value={v.stock}
                      onChange={(e) => updateVariation(v.key, { stock: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-stone-500">Selling Price</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      required
                      value={v.price}
                      onChange={(e) => updateVariation(v.key, { price: e.target.value })}
                      placeholder="0.00"
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-stone-500">
                      Compare-at Price
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={v.compare_at_price}
                      onChange={(e) =>
                        updateVariation(v.key, { compare_at_price: e.target.value })
                      }
                      placeholder="Optional"
                      className={inputClass}
                    />
                  </div>
                  <div className="col-span-2 space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-medium text-stone-500">
                      Images for this variation
                    </label>
                    <MultiImagePicker
                      files={v.images}
                      existingUrls={v.existing_image_urls}
                      onChange={(files, urls) => updateVariation(v.key, { images: files, existing_image_urls: urls })}
                      label={`${v.color || 'No Color'} image`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-600">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {/* Sticky submit bar */}
        <div className="sticky bottom-4 z-10 flex justify-end rounded-2xl border border-stone-200 bg-white/90 px-5 py-4 shadow-lg backdrop-blur">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-black px-10 py-3 text-sm font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? 'Saving…' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  )
}