import { getAdminSupabase } from '@/lib/supabase/admin'
import SubSubCategoriesClient, {
  type SubSubCategory,
  type SubCategoryOption,
} from './SubSubCategoriesClient'

export const dynamic = 'force-dynamic'

export default async function SubSubCategoriesPage() {
  const supabase = getAdminSupabase()
  const [subSubRes, subCategoriesRes] = await Promise.all([
    supabase
      .from('sub_sub_categories')
      .select(
        'id, sub_category_id, name, description, image_url, priority, is_visible, sub_categories(name, categories(name))'
      )
      .order('priority', { ascending: true }),
    supabase
      .from('sub_categories')
      .select('id, name, categories(name)')
      .order('name', { ascending: true }),
  ])

  if (subSubRes.error) {
    return (
      <div
        className="min-h-screen bg-[#FAF7F1] px-4 py-6 md:px-10 md:py-10 font-outfit text-[#141414]"
        style={{ colorScheme: 'light' }}
      >
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-600">
          Failed to load sub-sub-categories: {subSubRes.error.message}
        </div>
      </div>
    )
  }

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

  // Flatten joined names onto each row.
  const subSubCategories: SubSubCategory[] = (subSubRes.data ?? []).map((row: any) => ({
    id: row.id,
    sub_category_id: row.sub_category_id,
    sub_category_name: row.sub_categories?.name ?? 'Unknown',
    category_name: row.sub_categories?.categories?.name ?? 'Unknown',
    name: row.name,
    description: row.description,
    image_url: row.image_url,
    priority: row.priority,
    is_visible: row.is_visible,
  }))

  const subCategoryOptions: SubCategoryOption[] = (subCategoriesRes.data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    category_name: row.categories?.name ?? 'Unknown',
  }))

  return (
    <div
      className="min-h-screen bg-[#FAF7F1] px-4 py-6 md:px-10 md:py-10 font-outfit text-[#141414]"
      style={{ colorScheme: 'light' }}
    >
      <SubSubCategoriesClient
        subSubCategories={subSubCategories}
        subCategoryOptions={subCategoryOptions}
      />
    </div>
  )
}