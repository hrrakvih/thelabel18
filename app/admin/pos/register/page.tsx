// app/admin/pos/register/page.tsx
import RegisterClient from './RegisterClient'
import { listAllVariations } from './actions'

export const dynamic = 'force-dynamic'


export default async function RegisterPage() {
  const initialProducts = await listAllVariations()

  return (
    <div
      className="min-h-screen bg-[#FAF7F1] px-4 py-6 md:px-10 md:py-10 font-outfit text-black"
      style={{ colorScheme: 'light' }}
    >
      <RegisterClient initialProducts={initialProducts} />
    </div>
  )
}