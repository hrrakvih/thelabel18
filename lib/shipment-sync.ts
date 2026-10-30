import 'server-only'
import { revalidatePath } from 'next/cache'
import { getAdminSupabase } from '@/lib/supabase/admin'

/** Only trusted provider responses may call this; customers cannot set status. */
export async function saveDeliveredShipment(orderId: string, awb: string): Promise<boolean> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Shipping sync requires SUPABASE_SERVICE_ROLE_KEY.')
  const { data, error } = await getAdminSupabase().from('orders')
    .update({ status: 'delivered' })
    .eq('id', orderId)
    .eq('tracking_number', awb)
    .in('status', ['pending', 'confirmed', 'shipped', 'out_for_delivery'])
    .select('id')
  if (error) throw new Error('Unable to save the delivery status.')
  if (!data?.length) return false
  revalidatePath('/admin/orders')
  revalidatePath('/admin/dashboard')
  revalidatePath('/orders')
  revalidatePath(`/orders/${orderId}`)
  return true
}
