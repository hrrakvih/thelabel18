import 'server-only'
import { getAdminSupabase } from '@/lib/supabase/admin'
import { parsePin, parseShippingAmount } from '@/lib/shipping-pricing'

export async function shippingChargeForAddress(address: { postal_code: string; country: string }) {
  if (!['india', 'in'].includes(address.country.trim().toLowerCase())) throw new Error('Shipping is currently available only to Indian addresses.')
  const pin = parsePin(address.postal_code)
  const db = getAdminSupabase()
  const [{ data: rates, error }, { data: settings, error: settingsError }] = await Promise.all([
    db.from('shipping_pin_rates').select('amount').eq('active', true).lte('pin_from', pin).gte('pin_to', pin).limit(2),
    db.from('shipping_settings').select('default_amount').eq('id', true).single(),
  ])
  if (error || settingsError || !settings || (rates?.length ?? 0) > 1) throw new Error('Shipping rates are unavailable. Please contact the store or try again later.')
  return parseShippingAmount(rates?.[0]?.amount ?? settings.default_amount)
}
