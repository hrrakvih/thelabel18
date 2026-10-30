'use server'

import { revalidatePath } from 'next/cache'
import { getAdminSupabase } from '@/lib/supabase/admin'

const BUCKET = 'subsubcategory-images'

// Priority only needs to be unique among sub-sub-categories that share the same parent sub-category
async function assertPriorityIsUnique(subCategoryId: string, priority: number, excludeId?: string) {
  const supabase = getAdminSupabase()
  let query = supabase
    .from('sub_sub_categories')
    .select('id', { count: 'exact', head: true })
    .eq('sub_category_id', subCategoryId)
    .eq('priority', priority)

  if (excludeId) query = query.neq('id', excludeId)

  const { count, error } = await query

  if (error) throw new Error(error.message)
  if (count && count > 0) {
    throw new Error(`Priority ${priority} is already in use by another sub-sub-category in this sub-category`)
  }
}

export async function addSubSubCategory(formData: FormData) {
  try {
    const supabase = getAdminSupabase()
    const sub_category_id = String(formData.get('sub_category_id') || '').trim()
    const name = String(formData.get('name') || '').trim()
    const description = String(formData.get('description') || '').trim()
    const priority = Number(formData.get('priority') || 0)
    const file = formData.get('image') as File | null

    if (!sub_category_id) return { success: false, error: 'Parent sub-category is required' }
    if (!name) return { success: false, error: 'Sub-sub-category name is required' }
    if (!file || file.size === 0) return { success: false, error: 'An image is required' }

    await assertPriorityIsUnique(sub_category_id, priority)

    const ext = file.name.split('.').pop()
    const path = `${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false })

    if (uploadError) return { success: false, error: `Image upload failed: ${uploadError.message}` }

    const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path)
    const image_url = publicUrl.publicUrl

    const { error } = await supabase.from('sub_sub_categories').insert({
      sub_category_id,
      name,
      description,
      priority,
      image_url,
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/sub-sub-categories')
    return { success: true }
  } catch (err: any) {
    console.error('addSubSubCategory error:', err)
    return { success: false, error: err?.message || 'Failed to add sub-sub-category' }
  }
}

export async function updateSubSubCategory(id: string, formData: FormData) {
  try {
    const supabase = getAdminSupabase()
    const sub_category_id = String(formData.get('sub_category_id') || '').trim()
    const name = String(formData.get('name') || '').trim()
    const description = String(formData.get('description') || '').trim()
    const priority = Number(formData.get('priority') || 0)
    const file = formData.get('image') as File | null
    const existingImageUrl = String(formData.get('existingImageUrl') || '') || null

    if (!sub_category_id) return { success: false, error: 'Parent sub-category is required' }
    if (!name) return { success: false, error: 'Sub-sub-category name is required' }
    if (!existingImageUrl && (!file || file.size === 0)) {
      return { success: false, error: 'An image is required' }
    }

    await assertPriorityIsUnique(sub_category_id, priority, id)

    let image_url = existingImageUrl

    if (file && file.size > 0) {
      if (existingImageUrl) {
        const oldPath = existingImageUrl.split(`${BUCKET}/`)[1]
        if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath])
      }

      const ext = file.name.split('.').pop()
      const path = `${crypto.randomUUID()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false })

      if (uploadError) return { success: false, error: `Image upload failed: ${uploadError.message}` }

      const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path)
      image_url = publicUrl.publicUrl
    }

    const { error } = await supabase
      .from('sub_sub_categories')
      .update({ sub_category_id, name, description, priority, image_url })
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/sub-sub-categories')
    return { success: true }
  } catch (err: any) {
    console.error('updateSubSubCategory error:', err)
    return { success: false, error: err?.message || 'Failed to update sub-sub-category' }
  }
}

export async function toggleSubSubCategoryVisibility(id: string, nextValue: boolean) {
  try {
    const supabase = getAdminSupabase()
    const { error } = await supabase
      .from('sub_sub_categories')
      .update({ is_visible: nextValue })
      .eq('id', id)

    if (error) throw new Error(error.message)
    revalidatePath('/admin/sub-sub-categories')
    return { success: true }
  } catch (err: any) {
    throw new Error(err.message)
  }
}

export async function updateSubSubCategoryPriority(id: string, subCategoryId: string, priority: number) {
  try {
    await assertPriorityIsUnique(subCategoryId, priority, id)
    const supabase = getAdminSupabase()
    const { error } = await supabase
      .from('sub_sub_categories')
      .update({ priority })
      .eq('id', id)

    if (error) throw new Error(error.message)
    revalidatePath('/admin/sub-sub-categories')
    return { success: true }
  } catch (err: any) {
    throw new Error(err.message)
  }
}

export async function deleteSubSubCategory(id: string, imageUrl: string | null) {
  try {
    const supabase = getAdminSupabase()
    if (imageUrl) {
      const path = imageUrl.split(`${BUCKET}/`)[1]
      if (path) await supabase.storage.from(BUCKET).remove([path])
    }

    const { error } = await supabase.from('sub_sub_categories').delete().eq('id', id)
    if (error) throw new Error(error.message)

    revalidatePath('/admin/sub-sub-categories')
    return { success: true }
  } catch (err: any) {
    throw new Error(err.message)
  }
}