import { createClient } from '@supabase/supabase-js'
import CouponsClient, { type Coupon } from './CouponsClient'

export const dynamic = 'force-dynamic'


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function CouponsPage() {
  const { data, error } = await supabase
    .from('coupons')
    .select(
      'id, code, description, discount_type, discount_value, max_discount_amount, min_order_value, usage_limit, used_count, valid_from, valid_until, is_active'
    )
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div
        className="min-h-screen bg-[#FAF7F1] px-4 py-6 md:px-10 md:py-10 font-outfit text-[#141414]"
        style={{ colorScheme: 'light' }}
      >
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-600">
          Failed to load coupons: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-[#FAF7F1] px-4 py-6 md:px-10 md:py-10 font-outfit text-[#141414]"
      style={{ colorScheme: 'light' }}
    >
      <CouponsClient coupons={(data ?? []) as Coupon[]} />
    </div>
  )
}