import 'server-only'
import { revalidatePath } from 'next/cache'
import { getAdminSupabase } from '@/lib/supabase/admin'
import { fetchRazorpayOrderPayments, fetchRazorpayPayment, captureRazorpayPayment, toPaise } from '@/lib/razorpay'
import { finalizePaidOrder } from '@/lib/order-payments'
import { paymentFailureDetails, type PaymentSyncResult } from '@/lib/payment-status'

/** Capture only an existing, matching authorized payment; never retry failed payments. */
export async function reconcileOrderPayment(orderId: string): Promise<PaymentSyncResult> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Server payment sync is not configured.')
  const db = getAdminSupabase()
  const { data: order, error } = await db.from('orders')
    .select('id, razorpay_order_id, payment_status, payment_method, total, status')
    .eq('id', orderId).single()
  if (error || !order) throw new Error('Order not found.')
  if (order.payment_status === 'paid') return { status: 'paid' as const, message: 'Payment already confirmed.' }
  if (order.payment_method !== 'razorpay' || !order.razorpay_order_id) throw new Error('No Razorpay order is linked to this order.')

  const response = await fetchRazorpayOrderPayments(order.razorpay_order_id)
  if (!Array.isArray(response.items)) throw new Error('Razorpay returned an invalid payment response.')
  const attempts = response.items.filter(payment => payment.order_id === order.razorpay_order_id)
  const validAmount = (payment: { amount: number; currency: string }) => payment.currency === 'INR' && payment.amount === toPaise(order.total)
  // Captured payments win over older attempts. Capture at most one authorized payment.
  if (!attempts.some(payment => payment.status === 'captured')) {
    const authorized = attempts.find(payment => payment.status === 'authorized')
    if (authorized) {
      if (!validAmount(authorized)) throw new Error('Authorized payment amount or currency does not match this order. Capture was not attempted.')
      if (order.status === 'cancelled') throw new Error('Cancelled orders cannot be captured automatically.')
      let capturedPayment
      try {
        capturedPayment = await captureRazorpayPayment(authorized.id, authorized.amount, authorized.currency)
      } catch (error) {
        // The provider may have captured concurrently or accepted a timed-out request.
        // Re-read the same payment before deciding; never blindly submit capture again.
        const current = await fetchRazorpayPayment(authorized.id).catch(() => null)
        if (current?.status !== 'captured') throw new Error(`Automatic capture could not be confirmed: ${error instanceof Error ? error.message : 'Razorpay is unavailable'}. Sync again to check its status.`)
        capturedPayment = current
      }
      if (capturedPayment.id !== authorized.id || capturedPayment.order_id !== order.razorpay_order_id || !validAmount(capturedPayment) || capturedPayment.status !== 'captured') {
        throw new Error('Razorpay did not confirm capture of the expected payment. Order remains unpaid.')
      }
      attempts.push(capturedPayment)
    }
  }
  const captured = attempts.filter(payment => payment.status === 'captured')
  if (captured.length) {
    const payment = captured.find(payment => payment.currency === 'INR' && payment.amount === toPaise(order.total))
    if (!payment) throw new Error('Captured payment amount or currency does not match this order. Review in Razorpay.')
    if (order.status === 'cancelled') throw new Error('Payment was captured for a cancelled order. Review this order manually.')
    await finalizePaidOrder(order.id, payment.id)
    const saved = await db.from('orders').select('payment_status').eq('id', order.id).single()
    if (saved.error || saved.data?.payment_status !== 'paid') throw new Error('Unable to confirm the payment in the store database. Please retry.')
    return { status: 'paid' as const, message: 'Captured payment verified. Order confirmed.' }
  }

  // Only failed attempts justify Failed. Closing a payment window is not failure.
  if (attempts.length && attempts.every(payment => payment.status === 'failed')) {
    const result = await db.from('orders').update({ payment_status: 'failed' })
      .eq('id', order.id).eq('razorpay_order_id', order.razorpay_order_id)
      .in('payment_status', ['pending', 'failed']).select('id')
    if (result.error) throw new Error('Unable to save the failed payment status.')
    revalidatePath('/admin/orders')
    revalidatePath('/orders')
    if (result.data?.length) {
      const latestAttempt = [...attempts].sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0))[0]
      const details = paymentFailureDetails(latestAttempt)
      return { status: 'failed', message: 'Payment failed', ...details }
    }
    // A concurrent captured callback may already have confirmed this order.
    const latest = await db.from('orders').select('payment_status').eq('id', order.id).single()
    if (latest.data?.payment_status === 'paid') return { status: 'paid' as const, message: 'Payment already confirmed.' }
    throw new Error('Order changed during payment sync. Refresh and check its status.')
  }
  if (attempts.some(payment => payment.status === 'refunded')) throw new Error('This payment was refunded. Review the order in Razorpay.')
  if (order.payment_status === 'failed') {
    const pending = await db.from('orders').update({ payment_status: 'pending' })
      .eq('id', order.id).eq('razorpay_order_id', order.razorpay_order_id)
      .eq('payment_status', 'failed').select('id')
    if (pending.error) throw new Error('Unable to save the current payment status.')
    revalidatePath('/admin/orders')
    revalidatePath('/orders')
  }
  return { status: 'pending', message: 'Payment pending', reason: attempts.length
    ? 'Razorpay has not authorized or captured this payment yet. The customer may still need to complete the payment.'
    : 'Razorpay has no payment attempts recorded for this order yet. There is no authorized payment to capture.' }

}
