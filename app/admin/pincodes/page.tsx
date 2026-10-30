import { requireAdminPath } from '@/lib/admin-access'
import type { ShippingRate } from '@/lib/shipping-pricing'
import PinRatesClient from './PinRatesClient'

export const dynamic = 'force-dynamic'
export default async function PinCodesPage() {
  const db = await requireAdminPath('/admin/pincodes')
  const [rates, settings] = await Promise.all([
    db.from('shipping_pin_rates').select('*').order('pin_from'),
    db.from('shipping_settings').select('default_amount').eq('id', true).single(),
  ])
  if (rates.error || settings.error) return <div className="p-6 text-rose-700">Shipping setup is required. Run supabase/migrations/add_shipping_pin_rates.sql in Supabase before using this page.</div>
  return <PinRatesClient rates={(rates.data ?? []) as ShippingRate[]} defaultAmount={Number(settings.data.default_amount)} />
}
