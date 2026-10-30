// app/admin/products/add/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { getAdminSupabase } from '@/lib/supabase/admin'

const BUCKET = 'product-images'

async function uploadImage(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null

  const supabase = getAdminSupabase()
  const ext = file.name.split('.').pop()
  const path = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) throw new Error(`Image upload failed: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

// Upload a single image file — called from the client one image at a time
// so every request stays well under Vercel's 4.5 MB payload cap.
export async function uploadSingleImageAction(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const file = formData.get('file') as File | null
    if (!file || file.size === 0) return { success: false, error: 'No file provided' }
    const url = await uploadImage(file)
    return { success: true, url: url || undefined }
  } catch (err: any) {
    console.error('uploadSingleImageAction error:', err)
    return { success: false, error: err?.message || 'Image upload failed' }
  }
}

function slug(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 10)
}

export async function createProduct(formData: FormData) {
  try {
    const supabase = getAdminSupabase()
    const sku = String(formData.get('sku') || '').trim()
    const name = String(formData.get('name') || '').trim()
    const category_id = String(formData.get('category_id') || '')
    const sub_category_id = String(formData.get('sub_category_id') || '') || null
    const sub_sub_category_id = String(formData.get('sub_sub_category_id') || '') || null
    const description = String(formData.get('description') || '').trim()
    // Images are pre-uploaded one-by-one from the client; grab the URL.
    const image_url = String(formData.get('main_image_url') || '') || null

    if (!sku) return { success: false, error: 'SKU is required' }
    if (!name) return { success: false, error: 'Product name is required' }
    if (!category_id) return { success: false, error: 'Category is required' }

    // 1. Create the product itself
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        sku,
        name,
        category_id,
        sub_category_id,
        sub_sub_category_id,
        description,
        image_url,
      })
      .select('id')
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    // 2. Create each variation (size / color / stock / price / its own image)
    const variationCount = Number(formData.get('variation_count') || 0)

    for (let i = 0; i < variationCount; i++) {
      const size = (String(formData.get(`variations[${i}][size]`) || '').trim()) || null
      const color = (String(formData.get(`variations[${i}][color]`) || '').trim()) || null
      const color_hex = (String(formData.get(`variations[${i}][color_hex]`) || '').trim()) || null
      const stock_quantity = Number(formData.get(`variations[${i}][stock]`) || 0)
      const price = Number(formData.get(`variations[${i}][price]`) || 0)
      const compareRaw = formData.get(`variations[${i}][compare_at_price]`)
      const compare_at_price = compareRaw && String(compareRaw).trim() !== '' ? Number(compareRaw) : null
      // All images are pre-uploaded; their URLs arrive as existing_image_urls
      const validVariationImageUrls = formData.getAll(`variations[${i}][existing_image_urls][]`) as string[]

      const suffix = [slug(color || ''), slug(size || '')].filter(Boolean).join('-')
      const variationSku = suffix ? `${sku}-${suffix}` : `${sku}-${i + 1}`

      const { error: varError } = await supabase.from('product_variations').insert({
        product_id: product.id,
        sku: variationSku,
        size,
        color,
        color_hex,
        stock_quantity,
        price,
        compare_at_price,
        image_url: validVariationImageUrls.length > 0 ? validVariationImageUrls[0] : null,
        image_urls: validVariationImageUrls,
      })

      if (varError) {
        return { success: false, error: `Variation ${i + 1}: ${varError.message}` }
      }
    }

    revalidatePath('/admin/products/list')
    return { success: true }
  } catch (err: any) {
    console.error('createProduct error:', err)
    return { success: false, error: err?.message || 'Failed to create product' }
  }
}

export async function updateProduct(productId: string, formData: FormData) {
  try {
    const supabase = getAdminSupabase()
    const sku = String(formData.get('sku') || '').trim()
    const name = String(formData.get('name') || '').trim()
    const category_id = String(formData.get('category_id') || '')
    const sub_category_id = String(formData.get('sub_category_id') || '') || null
    const sub_sub_category_id = String(formData.get('sub_sub_category_id') || '') || null
    const description = String(formData.get('description') || '').trim()
    // Images are pre-uploaded; grab the URL if a new one was uploaded.
    const preUploadedUrl = String(formData.get('main_image_url') || '') || null
    const existingImageUrl = String(formData.get('existing_image_url') || '') || null

    if (!sku) return { success: false, error: 'SKU is required' }
    if (!name) return { success: false, error: 'Product name is required' }
    if (!category_id) return { success: false, error: 'Category is required' }

    const image_url = preUploadedUrl ?? existingImageUrl

    const { error } = await supabase
      .from('products')
      .update({ sku, name, category_id, sub_category_id, sub_sub_category_id, description, image_url })
      .eq('id', productId)

    if (error) {
      return { success: false, error: error.message }
    }

    // Replace all variations: delete existing, insert submitted set.
    await supabase.from('product_variations').delete().eq('product_id', productId)

    const variationCount = Number(formData.get('variation_count') || 0)
    for (let i = 0; i < variationCount; i++) {
      const size = (String(formData.get(`variations[${i}][size]`) || '').trim()) || null
      const color = (String(formData.get(`variations[${i}][color]`) || '').trim()) || null
      const color_hex = (String(formData.get(`variations[${i}][color_hex]`) || '').trim()) || null
      const stock_quantity = Number(formData.get(`variations[${i}][stock]`) || 0)
      const price = Number(formData.get(`variations[${i}][price]`) || 0)
      const compareRaw = formData.get(`variations[${i}][compare_at_price]`)
      const compare_at_price = compareRaw && String(compareRaw).trim() !== '' ? Number(compareRaw) : null
      const variationImageFiles = formData.getAll(`variations[${i}][images][]`) as File[]
      const existingVariationImages = formData.getAll(`variations[${i}][existing_image_urls][]`) as string[]

      const uploadedUrls = await Promise.all(variationImageFiles.map(f => uploadImage(f)))
      const validUploadedUrls = uploadedUrls.filter(Boolean) as string[]

      const variationImageUrls = [...existingVariationImages, ...validUploadedUrls]

      const suffix = [slug(color || ''), slug(size || '')].filter(Boolean).join('-')
      const variationSku = suffix ? `${sku}-${suffix}` : `${sku}-${i + 1}`

      const { error: varError } = await supabase.from('product_variations').insert({
        product_id: productId,
        sku: variationSku,
        size,
        color,
        color_hex,
        stock_quantity,
        price,
        compare_at_price,
        image_url: variationImageUrls.length > 0 ? variationImageUrls[0] : null,
        image_urls: variationImageUrls,
      })

      if (varError) {
        return { success: false, error: `Variation ${i + 1}: ${varError.message}` }
      }
    }

    revalidatePath('/admin/products/list')
    return { success: true }
  } catch (err: any) {
    console.error('updateProduct error:', err)
    return { success: false, error: err?.message || 'Failed to update product' }
  }
}
