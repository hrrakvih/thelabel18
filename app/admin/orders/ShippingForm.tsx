'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { StoreOrder } from './OrdersClient'
import type { PickupLocation } from '@/lib/shiprocket'
import { bookOrderShipment, loadOrderShippingOptions } from './shipping-actions'

export default function ShippingForm({ orderId, disabled, shipment }: { orderId: string; disabled: boolean; shipment: StoreOrder }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [options, setOptions] = useState<{ email: string; locations: PickupLocation[] } | null>(null)
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    loadOrderShippingOptions(orderId).then(result => {
      if (!active) return
      if (result.success) setOptions({ email: result.email, locations: result.locations })
      else setLoadError(result.message)
    }).catch(() => { if (active) setLoadError('Unable to load shipping details. Please retry.') })
    return () => { active = false }
  }, [orderId, attempt])
  const router = useRouter()
  const booked = shipment.shipping_booking_state === 'pickup_requested'
  const locked = shipment.shipping_booking_state === 'booking'
  return <form className="my-4 space-y-3 rounded-xl border border-stone-200 bg-white p-4" onSubmit={async event => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true)
    setMessage('')
    try {
      const result = await bookOrderShipment(orderId, form)
      setMessage(result.message)
      router.refresh()
    } catch { setMessage('Connection failed. Check Shiprocket before retrying.') }
    finally { setBusy(false) }
  }}>
    <h3 className="text-sm font-semibold">Ship with Shiprocket</h3>
    <p className="text-xs text-stone-500">Enter packed parcel measurements. Booking assigns a courier and requests pickup using your Shiprocket wallet.</p>
    {shipment.tracking_number && <p className="text-xs">AWB: {shipment.tracking_number} · {shipment.courier_name}</p>}
    {booked && <p className="text-xs text-emerald-700">Pickup requested. Order marked as shipped.</p>}
    {locked && <p className="text-xs text-amber-700">Booking in progress or awaiting reconciliation. Check Shiprocket before creating another shipment.</p>}
    <fieldset disabled={busy || disabled || booked || locked || !options || !options.locations.length} className="space-y-3 disabled:opacity-50">
      <div className="grid grid-cols-2 gap-3">
        {([['length', 'Length (cm)'], ['breadth', 'Width (cm)'], ['height', 'Height (cm)'], ['weight', 'Weight (kg)']] as const).map(([name, label]) => <label key={name} className="block text-xs text-stone-600">{label}<input name={name} defaultValue={shipment.shipping_package?.[name]} readOnly={!!shipment.shipping_package} type="number" min={name === 'weight' ? '0.001' : '0.51'} step="any" required className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-black" /></label>)}
      </div>
      <label className="block text-xs text-stone-600">Pickup location
        {shipment.shipping_package ? <input name="pickup_location" value={shipment.shipping_package.pickup_location} readOnly className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-black" /> :
          <select key={options ? 'loaded' : 'loading'} name="pickup_location" required defaultValue={options?.locations.length === 1 ? options.locations[0].name : ''} className="mt-1 w-full rounded-lg border border-stone-300 bg-white p-2 text-black">
            <option value="">Select a Shiprocket pickup location</option>
            {options?.locations.map(location => <option key={location.name} value={location.name}>{location.name}{location.address ? ` — ${location.address}` : ''}</option>)}
          </select>}
      </label>
      <label className="block text-xs text-stone-600">Customer mobile number<input name="phone" defaultValue={shipment.ship_phone} readOnly={!!shipment.shiprocket_order_id} type="tel" inputMode="tel" autoComplete="tel" required placeholder="Real 10-digit Indian mobile number" className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-black" /></label>
      <label className="block text-xs text-stone-600">Customer email<input value={options?.email || shipment.shipping_package?.email || ''} readOnly placeholder="Loading customer email…" type="email" className="mt-1 w-full rounded-lg border border-stone-300 bg-stone-50 p-2 text-black" /></label>
      <button type="submit" className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white">{busy ? 'Booking shipment…' : booked ? 'Pickup requested' : locked ? 'Check booking in Shiprocket' : shipment.shiprocket_order_id ? 'Continue shipment booking' : 'Create shipment & request pickup'}</button>
    </fieldset>
    {!options && !loadError && <p role="status" className="text-xs text-stone-500">Loading pickup locations and customer email…</p>}
    {loadError && <div role="alert" className="text-xs text-rose-700">{loadError} <button type="button" onClick={() => { setLoadError(''); setAttempt(value => value + 1) }} className="underline">Retry</button></div>}
    {options && !options.locations.length && <p role="alert" className="text-xs text-amber-700">No pickup locations found. Add a pickup address in Shiprocket, then reopen this dialog.</p>}
    {disabled && <p className="text-xs text-stone-500">Shipping is unavailable until this order has product items and an eligible status.</p>}
    {message && <p role="status" className="text-xs text-stone-700">{message}</p>}
  </form>
}
