// app/admin/orders/page.tsx
import { createClient } from '@supabase/supabase-js'
import OrdersClient, { type StoreOrder } from './OrdersClient'



const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function OrdersPage() {
  const query = supabase
    .from('orders')
    .select(
      `
      id, status, subtotal, discount_amount, total, coupon_code, created_at,
      payment_method, payment_status, razorpay_payment_id,
      shiprocket_order_id, tracking_number, courier_name, shipping_booking_state, shipping_package,
      ship_full_name, ship_phone, ship_line1, ship_line2, ship_city, ship_state, ship_postal_code, ship_country,
      items:order_items (
        id, product_id, variation_id, product_name, variation_label, unit_price, quantity, line_total,
        product_variations ( image_url, image_urls, size, color, sku ),
        products ( image_url, product_variations ( image_url, image_urls ) )
      )
    `
    )
    // Hide checkout attempts that were never paid (NULL = placed before online payments)
    .or('payment_status.is.null,payment_status.eq.paid')

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    return (
      <div
        className="min-h-screen bg-[#FAF7F1] px-4 py-6 md:px-10 md:py-10 font-outfit text-black"
        style={{ colorScheme: 'light' }}
      >
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-600">
          Failed to load orders: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-[#FAF7F1] px-4 py-6 md:px-10 md:py-10 font-outfit text-black"
      style={{ colorScheme: 'light' }}
    >
      <OrdersClient orders={(data ?? []) as unknown as StoreOrder[]} />
    </div>
  )
}