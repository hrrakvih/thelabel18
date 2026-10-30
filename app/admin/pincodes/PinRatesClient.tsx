'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ShippingRate } from '@/lib/shipping-pricing'
import { savePinRate, saveDefaultShipping } from './actions'

const inputClass = 'mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900'
export default function PinRatesClient({ rates, defaultAmount }: { rates: ShippingRate[]; defaultAmount: number }) {
  const router = useRouter()
  const [editing, setEditing] = useState<ShippingRate | null>(null)
  const [version, setVersion] = useState(0)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  async function submit(event: React.FormEvent<HTMLFormElement>, kind: 'rate' | 'default') {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true); setMessage(''); setError('')
    try {
      if (kind === 'rate') await savePinRate(form)
      else await saveDefaultShipping(form)
      setMessage(kind === 'rate' ? 'Shipping rate saved.' : 'Default shipping charge saved.')
      if (kind === 'rate') { setEditing(null); setVersion((v) => v + 1) }
      router.refresh()
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save shipping charges.') }
    finally { setBusy(false) }
  }
  return <main className="min-h-screen bg-[#FAF7F1] p-4 text-stone-900 sm:p-8">
    <h1 className="text-2xl font-bold">PIN Codes &amp; Shipping</h1>
    <p className="mt-2 max-w-2xl text-sm text-stone-600">Enter the shipping charge for each PIN-code range. Checkout adds this amount to the total after product discounts. ₹0 means free shipping.</p>
    {message && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
    {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-stone-100 p-4"><h2 className="font-semibold">Regional shipping charges</h2><button disabled={busy} onClick={() => { setEditing(null); setVersion(v => v + 1) }} className="rounded-xl border border-stone-300 px-3 py-2 text-sm">Add region</button></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[570px] text-left text-sm"><thead className="bg-stone-50 text-xs text-stone-500"><tr>{['Region', 'PIN range', 'Charge', 'Status', ''].map(label => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead>
          <tbody>{rates.map(rate => <tr key={rate.id} className="border-t border-stone-100"><td className="px-4 py-4 font-medium">{rate.region}</td><td className="px-4 py-4 whitespace-nowrap">{rate.pin_from}–{rate.pin_to}</td><td className="px-4 py-4">₹{Number(rate.amount).toLocaleString('en-IN')}</td><td className="px-4 py-4"><span className={rate.active ? 'text-emerald-700' : 'text-stone-500'}>{rate.active ? 'Active' : 'Disabled'}</span></td><td className="px-4 py-4"><button disabled={busy} onClick={() => { setEditing(rate); setVersion(v => v + 1) }} className="rounded-lg border border-stone-200 px-3 py-2" aria-label={`Edit ${rate.region}`}>Edit</button></td></tr>)}</tbody>
        </table></div>
      </section>
      <div className="space-y-6">
        <form key={version} onSubmit={e => submit(e, 'rate')} className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="mb-4 font-semibold">{editing ? `Edit ${editing.region}` : 'Add PIN-code range'}</h2>
          <input type="hidden" name="id" value={editing?.id ?? ''} />
          <fieldset disabled={busy} className="space-y-3 disabled:opacity-60">
            <label className="block text-sm">Region<input className={inputClass} name="region" defaultValue={editing?.region ?? ''} required maxLength={100} /></label>
            <div className="grid grid-cols-2 gap-3"><label className="block text-sm">Start PIN<input className={inputClass} name="pin_from" defaultValue={editing?.pin_from ?? ''} inputMode="numeric" pattern="[1-9][0-9]{5}" required maxLength={6} /></label><label className="block text-sm">End PIN<input className={inputClass} name="pin_to" defaultValue={editing?.pin_to ?? ''} inputMode="numeric" pattern="[1-9][0-9]{5}" required maxLength={6} /></label></div>
            <label className="block text-sm">Shipping charge (₹)<input className={inputClass} type="number" name="amount" min="0" max="100000" step="0.01" defaultValue={editing?.amount ?? 0} required /></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={editing?.active ?? true} />Active</label>
            <button className="w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white">{busy ? 'Saving…' : 'Save shipping rate'}</button>
          </fieldset>
        </form>
        <form onSubmit={e => submit(e, 'default')} className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="font-semibold">Other PIN codes</h2><p className="mt-1 text-xs text-stone-500">Default charge when no active range matches the delivery PIN.</p>
          <label className="mt-3 block text-sm">Default shipping charge (₹)<input key={defaultAmount} className={inputClass} name="default_amount" type="number" min="0" max="100000" step="0.01" defaultValue={defaultAmount} disabled={busy} required /></label>
          <button disabled={busy} className="mt-3 w-full rounded-xl border border-stone-300 py-2.5 text-sm font-semibold disabled:opacity-50">Save default charge</button>
        </form>
      </div>
    </div>
  </main>
}
