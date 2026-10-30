import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import crypto from 'node:crypto'
import { asRecord } from '../lib/shipment-status.ts'
const code = ts.transpileModule(readFileSync(new URL('../app/api/payments/events/route.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
function fixture({ secret = 'webhook-secret', matched = true, failure = false } = {}) {
  let calls = 0
  const exports = {}
  const modules = {
    'next/server': { NextResponse: { json: (data, init) => Response.json(data, init) } },
    '@/lib/razorpay': { verifyRazorpayWebhook: (body, signature, key) => signature === crypto.createHmac('sha256', key).update(body).digest('hex') },
    '@/lib/shipment-status': { asRecord },
    '@/lib/supabase/admin': { getAdminSupabase: () => ({ from: () => ({ select: () => ({ eq: (_key, value) => {
      assert.equal(value, 'order_provider')
      return { maybeSingle: async () => ({ data: matched ? { id: 'store-order' } : null, error: null }) }
    } }) }) }) },
    '@/lib/payment-reconciliation': { reconcileOrderPayment: async id => {
      calls++; assert.equal(id, 'store-order')
      if (failure) throw new Error('Provider unavailable')
      return { status: 'paid' }
    } },
  }
  vm.runInNewContext(code, { exports, require: name => modules[name], console: { error() {} }, process: { env: { RAZORPAY_WEBHOOK_SECRET: secret, SUPABASE_SERVICE_ROLE_KEY: 'test-service' } } })
  return { post: exports.POST, calls: () => calls }
}
function request(body, valid = true) {
  const raw = JSON.stringify(body)
  return new Request('https://store.example/api/payments/events', { method: 'POST', body: raw,
    headers: { 'x-razorpay-signature': valid ? crypto.createHmac('sha256', 'webhook-secret').update(raw).digest('hex') : 'invalid' } })
}
const payload = { event: 'payment.captured', payload: { payment: { entity: { order_id: 'order_provider' } } } }

test('payment webhook rejects forged requests and unconfigured endpoints before reconciliation', async () => {
  const f = fixture()
  assert.equal((await f.post(request(payload, false))).status, 401)
  assert.equal(f.calls(), 0)
  assert.equal((await fixture({ secret: '' }).post(request(payload))).status, 503)
})
test('signed capture and order-paid events reconcile the linked store order', async () => {
  for (const body of [{ ...payload, event: 'payment.authorized' }, payload, { event: 'order.paid', payload: { order: { entity: { id: 'order_provider' } } } }]) {
    const f = fixture()
    const result = await f.post(request(body))
    assert.equal(result.status, 200)
    assert.equal((await result.json()).status, 'paid')
    assert.equal(f.calls(), 1)
  }
})
test('unknown orders and irrelevant events are acknowledged without payment updates', async () => {
  const unknown = fixture({ matched: false })
  assert.equal((await unknown.post(request(payload))).status, 200)
  assert.equal(unknown.calls(), 0)
  const irrelevant = fixture()
  assert.equal((await irrelevant.post(request({ event: 'refund.processed' }))).status, 200)
  assert.equal(irrelevant.calls(), 0)
})
test('provider failures return a retryable response instead of acknowledging a lost update', async () => {
  assert.equal((await fixture({ failure: true }).post(request(payload))).status, 500)
})
