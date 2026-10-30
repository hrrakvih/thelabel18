// Server-only. Kept out of the 'use server' actions file on purpose: anything
// exported from there becomes a publicly callable endpoint, and this must only
// run after a payment has been verified.
import { revalidatePath } from 'next/cache'
import { getAdminSupabase } from '@/lib/supabase/admin'

/**
 * Marks an order as paid and applies its side effects (stock, cart, coupon).
 * Safe to call more than once for the same order (e.g. a double-submitted
 * verification) — only the first call does any work.
 * Returns true if this call finalized the order.
 */
export async function finalizePaidOrder(orderId: string, razorpayPaymentId: string | null) {
  const supabaseAdmin = getAdminSupabase()

  // 1. Claim the order atomically: only a pending/failed order can become paid.
  const { data: order, error: claimErr } = await supabaseAdmin
    .from('orders')
    .update({
      payment_status: 'paid',
      status: 'confirmed',
      razorpay_payment_id: razorpayPaymentId,
      paid_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .in('payment_status', ['pending', 'failed'])
    .select('id, user_id, coupon_code')
    .maybeSingle()

  if (claimErr) throw new Error(`Failed to mark order as paid: ${claimErr.message}`)
  if (!order) return false

  // 2. Decrease stock for each purchased variation
  const { data: items } = await supabaseAdmin
    .from('order_items')
    .select('variation_id, quantity')
    .eq('order_id', order.id)

  for (const item of items ?? []) {
    if (!item.variation_id || !item.quantity) continue
    const { data: current } = await supabaseAdmin
      .from('product_variations')
      .select('stock_quantity')
      .eq('id', item.variation_id)
      .single()

    if (current && typeof current.stock_quantity === 'number') {
      await supabaseAdmin
        .from('product_variations')
        .update({ stock_quantity: Math.max(0, current.stock_quantity - item.quantity) })
        .eq('id', item.variation_id)
    }
  }

  // 3. Clear user's cart
  await supabaseAdmin.from('cart_items').delete().eq('user_id', order.user_id)

  // 4. Increment coupon usage if applied
  if (order.coupon_code) {
    const { data: coupon } = await supabaseAdmin
      .from('coupons')
      .select('id, used_count')
      .eq('code', order.coupon_code)
      .maybeSingle()
    if (coupon) {
      await supabaseAdmin
        .from('coupons')
        .update({ used_count: (coupon.used_count ?? 0) + 1 })
        .eq('id', coupon.id)
    }
  }

  revalidatePath('/orders')
  revalidatePath(`/orders/${order.id}`)
  revalidatePath('/admin/orders')
  revalidatePath('/admin/dashboard')
  revalidatePath('/cart')

  return true
}
