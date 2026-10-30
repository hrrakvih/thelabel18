// app/admin/pos/history/page.tsx
import { createClient } from '@supabase/supabase-js'
import HistoryClient, { type PosOrder } from './HistoryClient'

export const dynamic = 'force-dynamic'


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function PosHistoryPage() {
  const { data, error } = await supabase
    .from('pos_orders')
    .select(
      `
      id, order_number, subtotal, discount, tax, total, payment_method, status, cashier_name, created_at,
      items:pos_order_items ( id, variation_id, sku, product_name, size, color, unit_price, quantity, line_total )
    `
    )
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    return (
      <div
        className="min-h-screen bg-[#FAF7F1] px-4 py-6 md:px-10 md:py-10 font-outfit text-black"
        style={{ colorScheme: 'light' }}
      >
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-600">
          Failed to load POS history: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-[#FAF7F1] px-4 py-6 md:px-10 md:py-10 font-outfit text-black"
      style={{ colorScheme: 'light' }}
    >
      <HistoryClient orders={(data ?? []) as PosOrder[]} />
    </div>
  )
}