import { getAdminSupabase } from '@/lib/supabase/admin'
import SubCategoriesClient, { type SubCategory, type CategoryOption } from './SubCategoriesClient'

export const dynamic = 'force-dynamic'

export default async function SubCategoriesPage() {
  const supabase = getAdminSupabase()
  const [subCategoriesRes, categoriesRes] = await Promise.all([
    supabase
      .from('sub_categories')
      .select('id, category_id, name, description, image_url, priority, is_visible, categories(name)')
      .order('priority', { ascending: true }),
    supabase
      .from('categories')
      .select('id, name')
      .order('name', { ascending: true }),
  ])

  if (subCategoriesRes.error) {
    return (
      <div
        className="min-h-screen bg-[#FAF7F1] px-4 py-6 md:px-10 md:py-10 font-outfit text-[#141414]"
        style={{ colorScheme: 'light' }}
      >
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-600">
          Failed to load sub-categories: {subCategoriesRes.error.message}
        </div>
      </div>
    )
  }

  if (categoriesRes.error) {
    return (
      <div
        className="min-h-screen bg-[#FAF7F1] px-4 py-6 md:px-10 md:py-10 font-outfit text-[#141414]"
        style={{ colorScheme: 'light' }}
      >
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-600">
          Failed to load categories: {categoriesRes.error.message}
        </div>
      </div>
    )
  }

  // Flatten the joined category name onto each row for easy client-side use.
  const subCategories: SubCategory[] = (subCategoriesRes.data ?? []).map((row: any) => ({
    id: row.id,
    category_id: row.category_id,
    category_name: row.categories?.name ?? 'Unknown',
    name: row.name,
    description: row.description,
    image_url: row.image_url,
    priority: row.priority,
    is_visible: row.is_visible,
  }))

  const categoryOptions: CategoryOption[] = (categoriesRes.data ?? []) as CategoryOption[]

  return (
    <div
      className="min-h-screen bg-[#FAF7F1] px-4 py-6 md:px-10 md:py-10 font-outfit text-[#141414]"
      style={{ colorScheme: 'light' }}
    >
      <SubCategoriesClient subCategories={subCategories} categoryOptions={categoryOptions} />
    </div>
  )
}