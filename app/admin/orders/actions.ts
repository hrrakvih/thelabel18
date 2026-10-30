// app/admin/orders/actions.ts
'use server'

import { createClient } from '@supabase/supabase-js'
import { validateShippingAddress } from '@/lib/shipping-address'
import { revalidatePath } from 'next/cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VALID_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

export async function updateOrderStatus(orderId: string, status: string) {
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(`Invalid status: ${status}`)
  }

  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/orders')

  return { success: true }
}

export type UpdateOrderAddressInput = {
  ship_full_name: string
  ship_phone: string
  ship_line1: string
  ship_line2?: string | null
  ship_city: string
  ship_state: string
  ship_postal_code: string
  ship_country: string
}

export async function updateOrderAddress(orderId: string, data: UpdateOrderAddressInput) {
  if (!orderId) throw new Error('Order ID is required')
  if (!data.ship_full_name?.trim()) throw new Error('Customer full name is required')
  if (!data.ship_phone?.trim()) throw new Error('Phone number is required')
  if (!data.ship_line1?.trim()) throw new Error('Street address (Line 1) is required')
  if (!data.ship_city?.trim()) throw new Error('City is required')
  if (!data.ship_state?.trim()) throw new Error('State is required')
  if (!data.ship_postal_code?.trim()) throw new Error('Postal / PIN code is required')

  const address = validateShippingAddress(data.ship_line1, data.ship_line2)
  const updatePayload = {
    ship_full_name: data.ship_full_name.trim(),
    ship_phone: data.ship_phone.trim(),
    ship_line1: address.line1,
    ship_line2: address.line2 || null,
    ship_city: data.ship_city.trim(),
    ship_state: data.ship_state.trim(),
    ship_postal_code: data.ship_postal_code.trim(),
    ship_country: data.ship_country?.trim() || 'India',
  }

  const { error } = await supabase
    .from('orders')
    .update(updatePayload)
    .eq('id', orderId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/orders')
  revalidatePath('/admin/pre-orders')

  return { success: true, updated: updatePayload }
}