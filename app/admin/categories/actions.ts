'use server'

import { revalidatePath } from 'next/cache'
import { getAdminSupabase } from '@/lib/supabase/admin'

const BUCKET = 'category-images'

// Checks if another category already uses this priority value.
async function assertPriorityIsUnique(priority: number, excludeId?: string) {
  const supabase = getAdminSupabase()
  let query = supabase
    .from('categories')
    .select('id', { count: 'exact', head: true })
    .eq('priority', priority)

  if (excludeId) query = query.neq('id', excludeId)

  const { count, error } = await query

  if (error) throw new Error(error.message)
  if (count && count > 0) {
    throw new Error(`Priority ${priority} is already in use by another category`)
  }
}

export async function addCategory(formData: FormData) {
  try {
    const supabase = getAdminSupabase()
    const name = String(formData.get('name') || '').trim()
    const description = String(formData.get('description') || '').trim()
    const priority = Number(formData.get('priority') || 0)
    const file = formData.get('image') as File | null

    if (!name) return { success: false, error: 'Category name is required' }
    if (!file || file.size === 0) return { success: false, error: 'An image is required' }

    await assertPriorityIsUnique(priority)

    const ext = file.name.split('.').pop()
    const path = `${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false })

    if (uploadError) return { success: false, error: `Image upload failed: ${uploadError.message}` }

    const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path)
    const image_url = publicUrl.publicUrl

    const { error } = await supabase.from('categories').insert({
      name,
      description,
      priority,
      image_url,
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/categories')
    return { success: true }
  } catch (err: any) {
    console.error('addCategory error:', err)
    return { success: false, error: err?.message || 'Failed to add category' }
  }
}

export async function updateCategory(id: string, formData: FormData) {
  try {
    const supabase = getAdminSupabase()
    const name = String(formData.get('name') || '').trim()
    const description = String(formData.get('description') || '').trim()
    const priority = Number(formData.get('priority') || 0)
    const file = formData.get('image') as File | null
    const existingImageUrl = String(formData.get('existingImageUrl') || '') || null

    if (!name) return { success: false, error: 'Category name is required' }
    if (!existingImageUrl && (!file || file.size === 0)) {
      return { success: false, error: 'An image is required' }
    }

    await assertPriorityIsUnique(priority, id)

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
      .from('categories')
      .update({ name, description, priority, image_url })
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/categories')
    return { success: true }
  } catch (err: any) {
    console.error('updateCategory error:', err)
    return { success: false, error: err?.message || 'Failed to update category' }
  }
}

export async function toggleCategoryVisibility(id: string, nextValue: boolean) {
  try {
    const supabase = getAdminSupabase()
    const { error } = await supabase
      .from('categories')
      .update({ is_visible: nextValue })
      .eq('id', id)

    if (error) throw new Error(error.message)
    revalidatePath('/admin/categories')
    return { success: true }
  } catch (err: any) {
    throw new Error(err.message)
  }
}

export async function updateCategoryPriority(id: string, priority: number) {
  try {
    await assertPriorityIsUnique(priority, id)
    const supabase = getAdminSupabase()
    const { error } = await supabase
      .from('categories')
      .update({ priority })
      .eq('id', id)

    if (error) throw new Error(error.message)
    revalidatePath('/admin/categories')
    return { success: true }
  } catch (err: any) {
    throw new Error(err.message)
  }
}

export async function deleteCategory(id: string, imageUrl: string | null) {
  try {
    const supabase = getAdminSupabase()
    if (imageUrl) {
      const path = imageUrl.split(`${BUCKET}/`)[1]
      if (path) await supabase.storage.from(BUCKET).remove([path])
    }

    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw new Error(error.message)

    revalidatePath('/admin/categories')
    return { success: true }
  } catch (err: any) {
    throw new Error(err.message)
  }
}