export function normalizeShippingPhone(value: unknown): string {
  const raw = String(value ?? '').trim()
  if (!/^[+\d\s().-]+$/.test(raw)) throw new Error('Customer phone contains invalid characters. Update ship_phone with the real Indian mobile number.')
  let phone = raw.replace(/[\s().-]/g, '')
  if (phone.startsWith('+91')) phone = phone.slice(3)
  else if (phone.length === 14 && phone.startsWith('0091')) phone = phone.slice(4)
  else if (phone.length === 12 && phone.startsWith('91')) phone = phone.slice(2)
  else if (phone.length === 11 && phone.startsWith('0')) phone = phone.slice(1)
  if (!/^[6-9]\d{9}$/.test(phone) || /^(\d)\1{9}$/.test(phone)) {
    throw new Error('Customer phone must be a real 10-digit Indian mobile number starting with 6, 7, 8 or 9. Demo numbers such as 9999999999 cannot be used for shipping. Update ship_phone on this order.')
  }
  return phone
}
