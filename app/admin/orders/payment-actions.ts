'use server'
import { requireAdminPath } from '@/lib/admin-access'
import { reconcileOrderPayment } from '@/lib/payment-reconciliation'

export async function syncOrderPayment(orderId: string) {
  try {
    await requireAdminPath('/admin/orders')
    return { ok: true as const, ...await reconcileOrderPayment(orderId) }
  } catch (error) {
    return { ok: false as const, message: error instanceof Error ? error.message : 'Unable to check payment.' }
  }
}
