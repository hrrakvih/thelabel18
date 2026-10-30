import Sidebar from './components/Sidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      {/* Sidebar uses `fixed` positioning (see Sidebar.tsx), which takes it out
          of normal document flow — flexbox/`flex-1` on <main> does NOT push.
          past a fixed element. That's why content was rendering underneath it. */}
      <Sidebar />

      {/* md:pl-72 reserves exactly the sidebar's width (w-72 = 18rem) on desktop 
          so content sits beside it instead of behind it. On mobile, it's full width. */}
      <main className="md:pl-72">
        {children}
      </main>
    </div>
  )
}