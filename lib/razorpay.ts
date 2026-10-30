// Server-only Razorpay helpers. Never import this from a client component —
// it reads RAZORPAY_KEY_SECRET.
import crypto from 'crypto'

const API_BASE = 'https://api.razorpay.com/v1'

export type RazorpayOrder = {
  id: string
  amount: number
  currency: string
  receipt: string | null
  status: string
}

export type RazorpayPayment = {
  id: string
  order_id: string | null
  amount: number
  currency: string
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed'
  method: string | null
}

function getCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) {
    throw new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.')
  }
  return { keyId, keySecret }
}

export function getRazorpayKeyId() {
  return getCredentials().keyId
}

// Razorpay works in the smallest currency unit (paise for INR).
export function toPaise(amountInRupees: number) {
  return Math.round(Number(amountInRupees) * 100)
}

async function razorpayRequest<T>(path: string, method: 'GET' | 'POST' = 'GET', body?: unknown): Promise<T> {
  const { keyId, keySecret } = getCredentials()
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const description = data?.error?.description || `Razorpay request failed (${res.status})`
    throw new Error(description)
  }
  return data as T
}

export function createRazorpayOrder(params: {
  amount: number
  receipt: string
  notes?: Record<string, string>
}) {
  return razorpayRequest<RazorpayOrder>('/orders', 'POST', {
    amount: params.amount,
    currency: 'INR',
    receipt: params.receipt,
    notes: params.notes,
  })
}

export function fetchRazorpayPayment(paymentId: string) {
  return razorpayRequest<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}`)
}

export function captureRazorpayPayment(paymentId: string, amount: number, currency: string) {
  return razorpayRequest<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}/capture`, 'POST', {
    amount,
    currency,
  })
}

function safeEqual(expected: string, received: string) {
  const a = Buffer.from(expected)
  const b = Buffer.from(received)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

// Signature returned to the browser by Checkout after a successful payment.
export function verifyPaymentSignature(razorpayOrderId: string, razorpayPaymentId: string, signature: string) {
  const expected = crypto
    .createHmac('sha256', getCredentials().keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex')
  return safeEqual(expected, signature)
}
