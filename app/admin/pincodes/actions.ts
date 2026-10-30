'use server'
import { revalidatePath } from 'next/cache'
import { requireAdminPath } from '@/lib/admin-access'
import { parsePin, parseShippingAmount } from '@/lib/shipping-pricing'

export async function savePinRate(form: FormData) {
  const db = await requireAdminPath('/admin/pincodes')
  const region = String(form.get('region') ?? '').trim()
  if (!region || region.length > 100) throw new Error('Enter a region name of up to 100 characters.')
  const pin_from = parsePin(form.get('pin_from'))
  const pin_to = parsePin(form.get('pin_to'))
  if (pin_to < pin_from) throw new Error('End PIN must be greater than or equal to start PIN.')
  const amount = parseShippingAmount(form.get('amount'))
  const active = form.get('active') === 'on'
  const id = String(form.get('id') ?? '')
  const values = { region, pin_from, pin_to, amount, active }
  const result = id ? await db.from('shipping_pin_rates').update(values).eq('id', id).select('id').single()
    : await db.from('shipping_pin_rates').insert(values).select('id').single()
  if (result.error) throw new Error(result.error.code === '23P01' ? 'This PIN range overlaps another active region. Edit or disable that region first.' : 'Unable to save this shipping rate.')
  revalidatePath('/admin/pincodes')
}

export async function saveDefaultShipping(form: FormData) {
  const db = await requireAdminPath('/admin/pincodes')
  const amount = parseShippingAmount(form.get('default_amount'))
  const { error } = await db.from('shipping_settings').update({ default_amount: amount }).eq('id', true).select('id').single()
  if (error) throw new Error('Unable to save the default charge.')
  revalidatePath('/admin/pincodes')
}
