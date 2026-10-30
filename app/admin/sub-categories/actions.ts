'use server'

import { revalidatePath } from 'next/cache'
import { getAdminSupabase } from '@/lib/supabase/admin'

const BUCKET = 'subcategory-images'

// Priority only needs to be unique among sub-categories that share the same parent category
async function assertPriorityIsUnique(categoryId: string, priority: number, excludeId?: string) {
  const supabase = getAdminSupabase()
  let query = supabase
    .from('sub_categories')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', categoryId)
    .eq('priority', priority)

  if (excludeId) query = query.neq('id', excludeId)

  const { count, error } = await query

  if (error) throw new Error(error.message)
  if (count && count > 0) {
    throw new Error(`Priority ${priority} is already in use by another sub-category in this category`)
  }
}

export async function addSubCategory(formData: FormData) {
  try {
    const supabase = getAdminSupabase()
    const category_id = String(formData.get('category_id') || '').trim()
    const name = String(formData.get('name') || '').trim()
    const description = String(formData.get('description') || '').trim()
    const priority = Number(formData.get('priority') || 0)
    const file = formData.get('image') as File | null

    if (!category_id) return { success: false, error: 'Parent category is required' }
    if (!name) return { success: false, error: 'Sub-category name is required' }
    if (!file || file.size === 0) return { success: false, error: 'An image is required' }

    await assertPriorityIsUnique(category_id, priority)

    const ext = file.name.split('.').pop()
    const path = `${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false })

    if (uploadError) return { success: false, error: `Image upload failed: ${uploadError.message}` }

    const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path)
    const image_url = publicUrl.publicUrl

    const { error } = await supabase.from('sub_categories').insert({
      category_id,
      name,
      description,
      priority,
      image_url,
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/sub-categories')
    return { success: true }
  } catch (err: any) {
    console.error('addSubCategory error:', err)
    return { success: false, error: err?.message || 'Failed to add sub-category' }
  }
}

export async function updateSubCategory(id: string, formData: FormData) {
  try {
    const supabase = getAdminSupabase()
    const category_id = String(formData.get('category_id') || '').trim()
    const name = String(formData.get('name') || '').trim()
    const description = String(formData.get('description') || '').trim()
    const priority = Number(formData.get('priority') || 0)
    const file = formData.get('image') as File | null
    const existingImageUrl = String(formData.get('existingImageUrl') || '') || null

    if (!category_id) return { success: false, error: 'Parent category is required' }
    if (!name) return { success: false, error: 'Sub-category name is required' }
    if (!existingImageUrl && (!file || file.size === 0)) {
      return { success: false, error: 'An image is required' }
    }

    await assertPriorityIsUnique(category_id, priority, id)

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
      .from('sub_categories')
      .update({ category_id, name, description, priority, image_url })
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/sub-categories')
    return { success: true }
  } catch (err: any) {
    console.error('updateSubCategory error:', err)
    return { success: false, error: err?.message || 'Failed to update sub-category' }
  }
}

export async function toggleSubCategoryVisibility(id: string, nextValue: boolean) {
  try {
    const supabase = getAdminSupabase()
    const { error } = await supabase
      .from('sub_categories')
      .update({ is_visible: nextValue })
      .eq('id', id)

    if (error) throw new Error(error.message)
    revalidatePath('/admin/sub-categories')
    return { success: true }
  } catch (err: any) {
    throw new Error(err.message)
  }
}

export async function updateSubCategoryPriority(id: string, categoryId: string, priority: number) {
  try {
    await assertPriorityIsUnique(categoryId, priority, id)
    const supabase = getAdminSupabase()
    const { error } = await supabase
      .from('sub_categories')
      .update({ priority })
      .eq('id', id)

    if (error) throw new Error(error.message)
    revalidatePath('/admin/sub-categories')
    return { success: true }
  } catch (err: any) {
    throw new Error(err.message)
  }
}

export async function deleteSubCategory(id: string, imageUrl: string | null) {
  try {
    const supabase = getAdminSupabase()
    if (imageUrl) {
      const path = imageUrl.split(`${BUCKET}/`)[1]
      if (path) await supabase.storage.from(BUCKET).remove([path])
    }

    const { error } = await supabase.from('sub_categories').delete().eq('id', id)
    if (error) throw new Error(error.message)

    revalidatePath('/admin/sub-categories')
    return { success: true }
  } catch (err: any) {
    throw new Error(err.message)
  }
}