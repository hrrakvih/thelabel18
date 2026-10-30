/** Safe display fields from Razorpay; never includes card, bank or contact data. */
export type PaymentDetails = {
  reason?: string
  paymentId?: string
  errorCode?: string
  errorSource?: string
  errorStep?: string
}
export type PaymentSyncResult = PaymentDetails & { status: 'paid' | 'pending' | 'failed'; message: string }

type ProviderFailure = {
  id?: string
  error_description?: string | null
  error_reason?: string | null
  error_code?: string | null
  error_source?: string | null
  error_step?: string | null
}
function display(value?: string | null) { return value?.trim().slice(0, 1000) || undefined }
export function paymentFailureDetails(payment: ProviderFailure): PaymentDetails {
  return {
    reason: display(payment.error_description) || display(payment.error_reason)?.replaceAll('_', ' ') || 'Razorpay did not provide a failure reason.',
    paymentId: display(payment.id), errorCode: display(payment.error_code),
    errorSource: display(payment.error_source), errorStep: display(payment.error_step),
  }
}
