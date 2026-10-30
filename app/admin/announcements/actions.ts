'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function addAnnouncement(formData: FormData) {
  const text = (formData.get('text') as string)?.trim()
  if (!text) throw new Error('Announcement text is required')

  const { error } = await supabase
    .from('announcements')
    .insert({ text, is_active: true })

  if (error) throw new Error(error.message)
  revalidatePath('/admin/announcements')
  revalidatePath('/')
}

export async function updateAnnouncement(id: string, formData: FormData) {
  const text = (formData.get('text') as string)?.trim()
  if (!text) throw new Error('Announcement text is required')

  const { error } = await supabase
    .from('announcements')
    .update({ text })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/announcements')
  revalidatePath('/')
}

export async function toggleAnnouncementActive(id: string, isActive: boolean) {
  const { error } = await supabase
    .from('announcements')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/announcements')
  revalidatePath('/')
}

export async function deleteAnnouncement(id: string) {
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/announcements')
  revalidatePath('/')
}
