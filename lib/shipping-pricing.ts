export type ShippingRate = { id: string; region: string; pin_from: number; pin_to: number; amount: number; active: boolean }

export function parseShippingAmount(value: unknown): number {
  const raw = String(value ?? '').trim()
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) throw new Error('Enter a non-negative amount with at most two decimal places.')
  const amount = Number(raw)
  if (!Number.isFinite(amount) || amount > 100000) throw new Error('Shipping charge must be between ₹0 and ₹100,000.')
  return amount
}

export function parsePin(value: unknown): number {
  const pin = String(value ?? '').trim()
  if (!/^[1-9]\d{5}$/.test(pin)) throw new Error('Enter a valid six-digit Indian PIN code.')
  return Number(pin)
}

export function payableWithShipping(subtotal: number, discount: number, shipping: number): number {
  return (Math.max(0, Math.round(subtotal * 100) - Math.round(discount * 100)) + Math.round(shipping * 100)) / 100
}
