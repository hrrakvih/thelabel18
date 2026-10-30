import { createClient } from '@supabase/supabase-js'
import AnnouncementsClient, { type Announcement } from './AnnouncementsClient'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function AnnouncementsPage() {
  const { data, error } = await supabase
    .from('announcements')
    .select('id, text, is_active, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF7F1] px-4 py-6 md:px-10 md:py-10 font-outfit text-[#141414]">
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-600">
          Failed to load announcements: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF7F1] px-4 py-6 md:px-10 md:py-10 font-outfit text-[#141414]">
      <AnnouncementsClient announcements={(data ?? []) as Announcement[]} />
    </div>
  )
}
