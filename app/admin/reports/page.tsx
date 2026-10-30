import ReportsClient from './ReportsClient'

export const dynamic = 'force-dynamic'


export default function ReportsPage() {
  return (
    <div
      className="min-h-screen bg-[#FAF7F1] px-8 py-8 lg:px-10 lg:py-10 font-outfit text-[#141414]"
      style={{ colorScheme: 'light' }}
    >
      <ReportsClient />
    </div>
  )
}