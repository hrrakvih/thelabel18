// app/admin/products/list/page.tsx
import { getAdminSupabase } from '@/lib/supabase/admin'
import ProductsListClient, { type ProductRow } from './ProductsListClient'

export const dynamic = 'force-dynamic'

export default async function ProductsListPage() {
  const supabase = getAdminSupabase()
  const { data, error } = await supabase
    .from('products')
    .select(
      `
      id, sku, name, description, image_url, is_visible, created_at,
      category:categories ( name, is_visible ),
      sub_category:sub_categories ( name, is_visible ),
      sub_sub_category:sub_sub_categories ( name, is_visible ),
      variations:product_variations (
        id, sku, size, color, color_hex, image_url,
        stock_quantity, price, compare_at_price, is_visible
      )
    `
    )
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div
        className="min-h-screen bg-[#FAF7F1] px-4 py-6 md:px-10 md:py-10 font-outfit text-black"
        style={{ colorScheme: 'light' }}
      >
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-600">
          Failed to load products: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-[#FAF7F1] px-4 py-6 md:px-10 md:py-10 font-outfit text-black"
      style={{ colorScheme: 'light' }}
    >
      <ProductsListClient products={(data ?? []) as unknown as ProductRow[]} />
    </div>
  )
}