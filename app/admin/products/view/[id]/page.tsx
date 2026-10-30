// app/admin/products/view/[id]/page.tsx
import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ImageOff } from 'lucide-react'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function ViewProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: product } = await supabase
    .from('products')
    .select(
      `
      id, sku, name, description, image_url, is_visible,
      category:categories ( name ),
      sub_category:sub_categories ( name ),
      sub_sub_category:sub_sub_categories ( name ),
      variations:product_variations ( id, sku, size, color, color_hex, image_url, stock_quantity, price, compare_at_price, is_visible )
    `
    )
    .eq('id', id)
    .single()

  if (!product) notFound()

  return (
    <div
      className="min-h-screen bg-[#FAF7F1] px-4 py-6 md:px-10 md:py-10 font-sans text-black"
      style={{ colorScheme: 'light' }}
    >
      <Link
        href="/admin/products/list"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-black"
      >
        <ArrowLeft size={15} />
        Back to Products
      </Link>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex gap-5">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
            {product.image_url ? (
              <Image src={product.image_url} alt={product.name} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-stone-300">
                <ImageOff size={24} />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-black">{product.name}</h1>
            <p className="mt-1 font-mono text-sm text-stone-500">{product.sku}</p>
            <p className="mt-2 text-sm text-stone-600">
              {(product.category as any)?.name}
              {(product.sub_category as any)?.name ? ` › ${(product.sub_category as any).name}` : ''}
              {(product.sub_sub_category as any)?.name ? ` › ${(product.sub_sub_category as any).name}` : ''}
            </p>
            <span
              className={`mt-3 inline-block rounded-full px-2.5 py-1 text-[11px] font-medium ${
                product.is_visible
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-stone-100 text-stone-500'
              }`}
            >
              {product.is_visible ? 'Visible' : 'Hidden'}
            </span>
          </div>
        </div>

        {product.description && (
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-stone-600">
            {product.description}
          </p>
        )}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-200 px-6 py-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500">
            Variations
          </h2>
        </div>
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
            </tr>
          </thead>
          <tbody>
            {product.variations.map((v) => (
              <tr key={v.id} className="border-t border-stone-100">
                <td className="px-6 py-2.5">
                  {v.image_url ? (
                    <div className="relative h-9 w-9 overflow-hidden rounded-md border border-stone-200 bg-white">
                      <Image src={v.image_url} alt={v.color || ''} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-300">
                      <ImageOff size={14} />
                    </div>
                  )}
                </td>
                <td className="px-6 py-2.5 font-mono text-xs text-stone-600">{v.sku || '—'}</td>
                <td className="px-6 py-2.5 text-stone-700">{v.size || '—'}</td>
                <td className="px-6 py-2.5 text-stone-700">{v.color || '—'}</td>
                <td className="px-6 py-2.5 text-stone-700">{v.stock_quantity}</td>
                <td className="px-6 py-2.5 text-stone-700">₹{Number(v.price).toLocaleString()}</td>
                <td className="px-6 py-2.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      v.is_visible ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {v.is_visible ? 'Visible' : 'Hidden'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}