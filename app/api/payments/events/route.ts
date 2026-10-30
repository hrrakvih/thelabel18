import { NextResponse } from 'next/server'
import { verifyRazorpayWebhook } from '@/lib/razorpay'
import { getAdminSupabase } from '@/lib/supabase/admin'
import { reconcileOrderPayment } from '@/lib/payment-reconciliation'
import { asRecord } from '@/lib/shipment-status'

export const runtime = 'nodejs'
export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret || !process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: 'Payment webhook is not configured.' }, { status: 503 })
  const body = await request.text()
  if (!verifyRazorpayWebhook(body, request.headers.get('x-razorpay-signature') ?? '', secret)) {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 })
  }
  let event: Record<string, unknown>
  try { event = asRecord(JSON.parse(body)) } catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }) }
  if (!['payment.authorized', 'payment.captured', 'order.paid', 'payment.failed'].includes(String(event.event))) return NextResponse.json({ received: true })
  const payload = asRecord(event.payload)
  const payment = asRecord(asRecord(payload.payment).entity)
  const order = asRecord(asRecord(payload.order).entity)
  const providerId = payment.order_id ?? order.id
  if (typeof providerId !== 'string' || !providerId.startsWith('order_')) return NextResponse.json({ error: 'Missing Razorpay order.' }, { status: 400 })
  try {
    const { data, error } = await getAdminSupabase().from('orders').select('id').eq('razorpay_order_id', providerId).maybeSingle()
    if (error) throw new Error('Unable to find the store order.')
    if (!data) return NextResponse.json({ received: true, matched: false })
    const result = await reconcileOrderPayment(data.id)
    return NextResponse.json({ received: true, status: result.status })
  } catch (error) {
    console.error('Payment webhook reconciliation failed:', error)
    return NextResponse.json({ error: 'Unable to sync payment. Retry this event.' }, { status: 500 })
  }
}
