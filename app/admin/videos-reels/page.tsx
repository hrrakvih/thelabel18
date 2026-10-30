import ReelsClient from './ReelsClient'
import { listReels } from './actions'

export const dynamic = 'force-dynamic'


export default async function VideosReelsPage() {
  const reels = await listReels()

  return (
    <div
      className="min-h-screen bg-[#FAF7F1] px-4 py-6 md:px-10 md:py-10 font-outfit text-black"
      style={{ colorScheme: 'light' }}
    >
      <ReelsClient initialReels={reels} />
    </div>
  )
}