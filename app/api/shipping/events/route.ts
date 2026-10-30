import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase/admin'
import { asRecord, isDeliveredShipment } from '@/lib/shipment-status'
import { saveDeliveredShipment } from '@/lib/shipment-sync'

export const runtime = 'nodejs'

/** Shiprocket tracking callback. Configure a matching x-api-key in its dashboard. */
export async function POST(request: Request) {
  const secret = process.env.SHIPROCKET_WEBHOOK_TOKEN
  if (!secret || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Shipping webhook is not configured.' }, { status: 503 })
  }
  const supplied = Buffer.from(request.headers.get('x-api-key') ?? '')
  const expected = Buffer.from(secret)
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let payload: Record<string, unknown>
  try { payload = asRecord(await request.json()) } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const awb = typeof payload.awb === 'string' ? payload.awb.trim() : ''
  if (!awb) return NextResponse.json({ error: 'awb is required' }, { status: 400 })
  // Use shipment_status_id, never current_status_id (a different status table).
  const label = typeof payload.shipment_status === 'string' && payload.shipment_status.trim()
    ? payload.shipment_status : payload.current_status
  if (!isDeliveredShipment(label, payload.shipment_status_id)) {
    return NextResponse.json({ received: true, updated: false })
  }
  try {
    const { data: orders, error } = await getAdminSupabase().from('orders')
      .select('id').eq('tracking_number', awb).limit(2)
    if (error) throw new Error('Cannot find shipment.')
    // Do not guess an order if the AWB is unknown or duplicated.
    if (!orders?.length) return NextResponse.json({ received: true, updated: false })
    if (orders.length !== 1) throw new Error('Shipment reference is ambiguous.')
    const updated = await saveDeliveredShipment(orders[0].id, awb)
    return NextResponse.json({ received: true, updated })
  } catch (error) {
    console.error('Shipping webhook sync failed:', error)
    return NextResponse.json({ error: 'Unable to sync shipment. Retry this event.' }, { status: 500 })
  }
}
