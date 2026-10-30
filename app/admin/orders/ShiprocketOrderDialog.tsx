'use client'

import { useEffect, useRef } from 'react'
import { Truck, X, ExternalLink } from 'lucide-react'
import type { StoreOrder } from './OrdersClient'
import { shippingAddress, SHIPPING_ADDRESS_LIMIT } from '@/lib/shipping-address'
import ShippingForm from './ShippingForm'

export default function ShiprocketOrderDialog({ order, onClose }: { order: StoreOrder; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = dialog.current
    if (element && !element.open) element.showModal()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      // Strict Mode replays this effect. Closing here must not dismiss the
      // selected order: the next setup immediately opens the dialog again.
      if (element?.open) element.close()
      document.body.style.overflow = previousOverflow
    }
  }, [])

  return <dialog ref={dialog} onCancel={onClose} aria-labelledby="shipping-dialog-title" className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-3xl border border-[#9c7d23]/20 bg-[#FAF7F1] p-5 text-[#141414] shadow-2xl backdrop:bg-black/50 sm:p-6">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 id="shipping-dialog-title" className="flex items-center gap-2 text-lg font-semibold"><Truck size={20} />{order.shiprocket_order_id ? 'Shipment details' : 'Shipping · enter parcel details'}</h2>
        <p className="mt-1 text-xs text-stone-500">Order #{order.id.slice(0, 8).toUpperCase()}</p>
      </div>
      <button type="button" onClick={onClose} aria-label="Close shipping dialog" className="rounded-full border border-stone-200 bg-white p-2 hover:bg-stone-100"><X size={18} /></button>
    </div>
    <div className="mt-4 rounded-xl border border-stone-200 bg-white p-4 text-sm">
      <p className="font-semibold">{order.ship_full_name}</p>
      <p className="mt-1 text-xs text-stone-600">{order.ship_line1}{order.ship_line2 ? `, ${order.ship_line2}` : ''}, {order.ship_city}, {order.ship_state} {order.ship_postal_code}</p>
      <p className="mt-1 text-xs text-stone-600">{order.ship_phone}</p>
      <p className="mt-2 text-xs">{order.items.reduce((sum, item) => sum + item.quantity, 0)} items · ₹{Number(order.total).toLocaleString('en-IN')} · {order.payment_method === 'cod' ? 'Cash on delivery' : order.payment_status === 'paid' ? 'Paid' : 'Payment not recorded'}</p>
      {order.shiprocket_order_id && <p className="mt-2 break-all text-xs">Shiprocket order: {order.shiprocket_order_id}</p>}
    </div>
    {order.shiprocket_order_id && <a href="https://app.shiprocket.in/" target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white"><ExternalLink size={16} />Open Shiprocket</a>}
    {shippingAddress(order.ship_line1, order.ship_line2).length > SHIPPING_ADDRESS_LIMIT && !order.shiprocket_order_id && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">Address lines 1 + 2: {shippingAddress(order.ship_line1, order.ship_line2).length}/{SHIPPING_ADDRESS_LIMIT} characters. Close this dialog and use Edit Address &amp; Phone to shorten the address before booking.</p>}
    {!order.items.length && <p role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">This order has no product items. A demo row in the orders table does not include products. Add the purchased items to order_items or place a complete order through checkout before booking shipping.</p>}
    <ShippingForm orderId={order.id} shipment={order} disabled={!order.items.length || ['cancelled', 'delivered'].includes(order.status)} />
  </dialog>
}
