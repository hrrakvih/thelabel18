import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import crypto from 'node:crypto'
import * as paymentStatus from '../lib/payment-status.ts'

function compile(path, modules, extra = {}) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, Buffer, console, process: { env: { SUPABASE_SERVICE_ROLE_KEY: 'test-service' } }, require: name => {
    if (!(name in modules)) throw new Error(`Unexpected dependency: ${name}`)
    return modules[name]
  }, ...extra })
  return exports
}
function fixture({ attempts, total = 3639, paymentStatus: initialPaymentStatus = 'pending', status = 'pending', captureError = false, afterCapture = null } = {}) {
  const row = { id: 'store-order', razorpay_order_id: 'order_provider', payment_method: 'razorpay', total, payment_status: initialPaymentStatus, status }
  let finalized = 0, fetched = 0, failedWrites = 0
  const captures = []
  const db = { from() {
    let update, matched = true
    const q = { select() { return q }, eq(key, value) { matched &&= row[key] === value; return q },
      in(key, values) { matched &&= values.includes(row[key]); return q },
      update(values) { update = values; return q },
      async single() { return { data: matched ? { ...row } : null, error: null } },
      then(resolve, reject) {
        if (matched && update) { Object.assign(row, update); failedWrites++ }
        return Promise.resolve({ data: matched ? [{ id: row.id }] : [], error: null }).then(resolve, reject)
      },
    }
    return q
  } }
  const modules = {
    'server-only': {}, 'next/cache': { revalidatePath() {} },
    '@/lib/supabase/admin': { getAdminSupabase: () => db },
    '@/lib/payment-status': paymentStatus,
    '@/lib/razorpay': { toPaise: n => Math.round(n * 100), fetchRazorpayOrderPayments: async () => { fetched++; return { items: attempts ?? [] } },
      captureRazorpayPayment: async (id, amount, currency) => {
        captures.push({ id, amount, currency })
        if (captureError) throw new Error('Capture request timed out')
        return { ...attempts.find(p => p.id === id), status: 'captured' }
      },
      fetchRazorpayPayment: async id => afterCapture ?? attempts.find(p => p.id === id),
    },
    '@/lib/order-payments': { finalizePaidOrder: async (_id, payment) => { finalized++; row.payment_status = 'paid'; row.status = 'confirmed'; row.payment = payment; return true } },
  }
  return { reconcile: compile('../lib/payment-reconciliation.ts', modules).reconcileOrderPayment, row, captures,
    counts: () => ({ finalized, fetched, failedWrites }) }
}
const captured = { id: 'pay_verified', order_id: 'order_provider', amount: 363900, currency: 'INR', status: 'captured' }

test('exact captured payment confirms order and repeated sync has no second side effects', async () => {
  const f = fixture({ attempts: [captured] })
  assert.equal((await f.reconcile('store-order')).status, 'paid')
  assert.equal(f.row.payment, 'pay_verified')
  assert.equal((await f.reconcile('store-order')).status, 'paid')
  assert.deepEqual(f.counts(), { finalized: 1, fetched: 1, failedWrites: 0 })
})
test('a captured retry wins over a previous failed attempt', async () => {
  const f = fixture({ paymentStatus: 'failed', attempts: [{ ...captured, id: 'pay_old', status: 'failed' }, captured] })
  assert.equal((await f.reconcile('store-order')).status, 'paid')
})
test('wrong amount, currency, unrelated order, or cancelled order cannot confirm fulfillment', async () => {
  for (const overrides of [{ amount: 1 }, { currency: 'USD' }]) {
    const f = fixture({ attempts: [{ ...captured, ...overrides }] })
    await assert.rejects(f.reconcile('store-order'), /does not match/)
    assert.equal(f.counts().finalized, 0)
  }
  const unrelated = fixture({ attempts: [{ ...captured, order_id: 'order_someone_else' }] })
  assert.equal((await unrelated.reconcile('store-order')).status, 'pending')
  const cancelled = fixture({ status: 'cancelled', attempts: [captured] })
  await assert.rejects(cancelled.reconcile('store-order'), /cancelled/)
  assert.equal(cancelled.counts().finalized, 0)
})
test('only all-failed attempts mark payment failed; created/empty stay pending', async () => {
  const failed = fixture({ attempts: [{ ...captured, status: 'failed' }] })
  assert.equal((await failed.reconcile('store-order')).status, 'failed')
  assert.equal(failed.counts().finalized, 0)
  for (const attempts of [[], [{ ...captured, status: 'created' }]]) {
    const f = fixture({ attempts })
    assert.equal((await f.reconcile('store-order')).status, 'pending')
    assert.equal(f.counts().failedWrites, 0)
    assert.equal(f.counts().finalized, 0)
  }
})
test('webhook signatures authenticate exact raw bytes with a separate secret', () => {
  const { verifyRazorpayWebhook } = compile('../lib/razorpay.ts', { crypto })
  const body = '{ "event": "payment.captured" }'
  const signature = crypto.createHmac('sha256', 'webhook-secret').update(body).digest('hex')
  assert.equal(verifyRazorpayWebhook(body, signature, 'webhook-secret'), true)
  assert.equal(verifyRazorpayWebhook(JSON.stringify(JSON.parse(body)), signature, 'webhook-secret'), false)
  assert.equal(verifyRazorpayWebhook(body, signature, 'wrong-secret'), false)
  assert.equal(verifyRazorpayWebhook(body, 'not-a-signature', 'webhook-secret'), false)
})


test('authorized payments are captured once at the exact order amount and confirmed', async () => {
  const f = fixture({ attempts: [{ ...captured, status: 'authorized' }] })
  assert.equal((await f.reconcile('store-order')).status, 'paid')
  assert.deepEqual(f.captures, [{ id: captured.id, amount: 363900, currency: 'INR' }])
  await f.reconcile('store-order')
  assert.equal(f.captures.length, 1)
})
test('automatic capture is blocked for mismatched amounts and cancelled orders', async () => {
  for (const settings of [
    { attempts: [{ ...captured, amount: 1, status: 'authorized' }] },
    { status: 'cancelled', attempts: [{ ...captured, status: 'authorized' }] },
  ]) {
    const f = fixture(settings)
    await assert.rejects(f.reconcile('store-order'))
    assert.equal(f.captures.length, 0)
    assert.equal(f.counts().finalized, 0)
  }
})
test('an ambiguous capture response is verified by reading the same payment, without a second capture', async () => {
  const f = fixture({ attempts: [{ ...captured, status: 'authorized' }], captureError: true, afterCapture: captured })
  assert.equal((await f.reconcile('store-order')).status, 'paid')
  assert.equal(f.captures.length, 1)
  const unresolved = fixture({ attempts: [{ ...captured, status: 'authorized' }], captureError: true })
  await assert.rejects(unresolved.reconcile('store-order'), /could not be confirmed/)
  assert.equal(unresolved.captures.length, 1)
  assert.equal(unresolved.counts().finalized, 0)
})
test('failed payments return the latest provider reason and never attempt capture', async () => {
  const f = fixture({ attempts: [
    { ...captured, status: 'failed', created_at: 1, error_description: 'Old failure' },
    { ...captured, status: 'failed', created_at: 2, error_description: 'Customer payment timed out', error_code: 'BAD_REQUEST_ERROR', error_source: 'customer', error_step: 'payment_authentication' },
  ] })
  const result = await f.reconcile('store-order')
  assert.equal(result.status, 'failed')
  assert.equal(result.reason, 'Customer payment timed out')
  assert.equal(result.errorCode, 'BAD_REQUEST_ERROR')
  assert.equal(result.errorSource, 'customer')
  assert.equal(result.errorStep, 'payment_authentication')
  assert.equal(f.captures.length, 0)
  const noReason = fixture({ attempts: [{ ...captured, status: 'failed' }] })
  assert.equal((await noReason.reconcile('store-order')).reason, 'Razorpay did not provide a failure reason.')
  assert.equal(paymentStatus.paymentFailureDetails({ error_reason: 'payment_timed_out' }).reason, 'payment timed out')
})
