import { getAdminSupabase } from '@/lib/supabase/admin'
import ProductForm from './ProductForm'

export const dynamic = 'force-dynamic'

export default async function AddProductPage(props: { searchParams?: any }) {
  const supabase = getAdminSupabase()
  const searchParams = await (props.searchParams || Promise.resolve({}))
  const editId = searchParams.edit_id

  let existingProduct = null
  if (editId) {
    const { data } = await supabase
      .from('products')
      .select('*, variations:product_variations(*)')
      .eq('id', editId)
      .single()
      
    if (data) {
      // sort variations so they appear consistently
      data.variations.sort((a: any, b: any) => a.sku.localeCompare(b.sku))
      existingProduct = data
    }
  }

  const [{ data: categories }, { data: subCategories }, { data: subSubCategories }] =
    await Promise.all([
      supabase.from('categories').select('id, name').order('priority', { ascending: true }),
      supabase
        .from('sub_categories')
        .select('id, name, category_id')
        .order('priority', { ascending: true }),
      supabase
        .from('sub_sub_categories')
        .select('id, name, sub_category_id')
        .order('priority', { ascending: true }),
    ])

  return (
    <div
      className="min-h-screen bg-[#FAF7F1] px-4 py-6 md:px-10 md:py-10 font-outfit text-black"
      style={{ colorScheme: 'light' }}
    >
      <ProductForm
        product={existingProduct}
        categories={categories ?? []}
        subCategories={subCategories ?? []}
        subSubCategories={subSubCategories ?? []}
      />
    </div>
  )
}