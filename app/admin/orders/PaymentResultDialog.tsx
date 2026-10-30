'use client'
import { useEffect, useRef } from 'react'
import type { PaymentSyncResult } from '@/lib/payment-status'

type Result = Partial<PaymentSyncResult> & { orderId: string; message: string; ok: boolean }
export default function PaymentResultDialog({ result, onClose }: { result: Result; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const node = dialog.current
    if (node && !node.open) node.showModal()
    return () => { if (node?.open) node.close() }
  }, [])
  const color = result.status === 'paid' ? 'text-emerald-700' : result.status === 'pending' ? 'text-amber-700' : 'text-rose-700'
  return <dialog ref={dialog} onCancel={onClose} aria-labelledby="payment-result-title" className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-stone-200 bg-white p-6 text-stone-900 shadow-2xl backdrop:bg-black/50">
    <div className="flex items-start justify-between gap-4"><div><p className="text-xs text-stone-500">Order #{result.orderId.slice(0, 8).toUpperCase()}</p><h2 id="payment-result-title" className={`mt-1 text-lg font-semibold ${color}`}>{result.message}</h2></div><button type="button" onClick={onClose} aria-label="Close payment details" className="rounded-lg px-3 py-1 text-xl text-stone-500">×</button></div>
    {result.reason && <div className="mt-4 rounded-xl bg-stone-50 p-4"><h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">{result.status === 'failed' ? 'Failure reason' : 'Reason'}</h3><p className="mt-2 break-words text-sm leading-relaxed">{result.reason}</p></div>}
    <dl className="mt-4 space-y-2 text-sm">{[['Payment ID', result.paymentId], ['Error code', result.errorCode], ['Source', result.errorSource], ['Step', result.errorStep]].map(([label, value]) => value ? <div key={label} className="flex flex-wrap justify-between gap-2"><dt className="text-stone-500">{label}</dt><dd className="break-all font-mono text-xs">{value}</dd></div> : null)}</dl>
    <button type="button" onClick={onClose} className="mt-5 w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white">Close</button>
  </dialog>
}
