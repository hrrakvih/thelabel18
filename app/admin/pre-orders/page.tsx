// app/admin/pre-orders/page.tsx
import { createClient } from '@supabase/supabase-js'
import PreOrdersClient, { type PreOrder } from './PreOrdersClient'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function AdminPreOrdersPage() {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      id, status, subtotal, discount_amount, total, coupon_code, created_at,
      payment_method, payment_status, razorpay_payment_id,
      ship_full_name, ship_phone, ship_line1, ship_line2, ship_city, ship_state, ship_postal_code, ship_country,
      items:order_items (
        id, product_id, variation_id, product_name, variation_label, unit_price, quantity, line_total,
        product:products ( id, name, is_pre_order, launch_date, pre_order_note ),
        product_variations ( image_url, size, color, sku )
      )
    `
    )
    .or('payment_status.is.null,payment_status.eq.paid')
    .order('created_at', { ascending: false })
    .limit(300)

  if (error) {
    return (
      <div
        className="min-h-screen bg-[#FAF7F1] px-4 py-6 md:px-10 md:py-10 font-outfit text-black"
        style={{ colorScheme: 'light' }}
      >
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-600">
          Failed to load pre-orders: {error.message}
        </div>
      </div>
    )
  }

  // Filter only orders that contain pre-order items
  const preOrders = ((data ?? []) as unknown as PreOrder[]).filter((o) =>
    o.items && o.items.some((it) => it.product?.is_pre_order)
  )

  return (
    <div
      className="min-h-screen bg-[#FAF7F1] px-4 py-6 md:px-10 md:py-10 font-outfit text-black"
      style={{ colorScheme: 'light' }}
    >
      <PreOrdersClient orders={preOrders} />
    </div>
  )
}
