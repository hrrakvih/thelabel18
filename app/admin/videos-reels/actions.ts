'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type Reel = {
  id: string
  type: 'upload' | 'instagram'
  video_url: string | null
  storage_path: string | null
  instagram_url: string | null
  caption: string | null
  created_at: string
}

export async function listReels(): Promise<Reel[]> {
  const { data, error } = await supabase
    .from('reels')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('listReels error:', error.message)
    return []
  }
  return data ?? []
}

// Option 1: raw video file upload
export async function uploadVideoReel(formData: FormData) {
  const file = formData.get('file') as File | null
  const caption = (formData.get('caption') as string) || null

  if (!file || file.size === 0) throw new Error('No file selected')
  if (!file.type.startsWith('video/')) throw new Error('File must be a video')

  const ext = file.name.split('.').pop() || 'mp4'
  const path = `reels/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const bytes = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('reels')
    .upload(path, Buffer.from(bytes), { contentType: file.type, upsert: false })

  if (uploadError) throw new Error(uploadError.message)

  const { data: publicUrl } = supabase.storage.from('reels').getPublicUrl(path)

  const { error: insertError } = await supabase.from('reels').insert({
    type: 'upload',
    video_url: publicUrl.publicUrl,
    storage_path: path,
    caption,
  })

  if (insertError) {
    // roll back the uploaded file if the DB insert fails
    await supabase.storage.from('reels').remove([path])
    throw new Error(insertError.message)
  }

  revalidatePath('/admin/videos-reels')
}

// Option 2: Instagram link
export async function addInstagramReel(params: { url: string; caption?: string }) {
  const url = params.url.trim()
  if (!url) throw new Error('Instagram link is required')
  if (!/^https?:\/\/(www\.)?instagram\.com\/(reel|p)\//i.test(url)) {
    throw new Error('Enter a valid Instagram reel or post URL')
  }

  const { error } = await supabase.from('reels').insert({
    type: 'instagram',
    instagram_url: url,
    caption: params.caption || null,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/admin/videos-reels')
}

export async function deleteReel(id: string, storagePath: string | null) {
  if (storagePath) {
    await supabase.storage.from('reels').remove([storagePath])
  }
  const { error } = await supabase.from('reels').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/videos-reels')
}