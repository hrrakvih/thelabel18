export const SHIPPING_ADDRESS_LIMIT = 190

export function shippingAddress(line1: string, line2?: string | null) {
  const first = line1.trim().replace(/\s+/g, ' ')
  const second = (line2 || '').trim().replace(/\s+/g, ' ')
  return { line1: first, line2: second, length: first.length + second.length }
}

export function validateShippingAddress(line1: string, line2?: string | null) {
  const address = shippingAddress(line1, line2)
  if (address.length > SHIPPING_ADDRESS_LIMIT) {
    throw new Error(`Address lines 1 and 2 contain ${address.length} characters; Shiprocket allows ${SHIPPING_ADDRESS_LIMIT} combined. Shorten the address by at least ${address.length - SHIPPING_ADDRESS_LIMIT} characters using Edit Address & Phone, then retry.`)
  }
  return address
}
