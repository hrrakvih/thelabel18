import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import * as pricing from '../lib/shipping-pricing.ts'
const code = ts.transpileModule(readFileSync(new URL('../app/(site)/checkout/actions.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
function fixture({ fee = 75, discount = 100, ownAddress = true } = {}) {
  const inserted = [], payments = []
  const tables = {
    addresses: [{ id: 'addr', user_id: ownAddress ? 'user' : 'someone-else', full_name: 'Customer', phone: '9886812345', line1: 'Street', city: 'Bengaluru', state: 'Karnataka', postal_code: '560001', country: 'India' }],
    cart_items: [{ user_id: 'user', product_id: 'product', variation_id: 'variation', quantity: 1, products: { name: 'Product' }, product_variations: { price: 1000, stock_quantity: 2 } }],
    coupons: [{ code: 'SAVE', is_active: true, discount_type: 'fixed', discount_value: discount }],
  }
  const db = { from(table) {
    let rows = tables[table] ?? []
    const q = { select() { return q }, eq(k, v) { rows = rows.filter(r => r[k] === v); return q },
      insert(values) { if (table === 'orders') inserted.push(values); rows = [{ id: 'new-order' }]; return q },
      update() { return q }, delete() { return q },
      async single() { return { data: rows[0] ?? null, error: null } },
      async maybeSingle() { return { data: rows[0] ?? null, error: null } },
      then(resolve, reject) { return Promise.resolve({ data: rows, error: null }).then(resolve, reject) },
    }
    return q
  } }
  const exports = {}
  const modules = {
    'next/cache': { revalidatePath() {} },
    '@/lib/supabase/server': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'user' } } }) } }) },
    '@/lib/supabase/admin': { getAdminSupabase: () => db },
    '@/lib/shipping-rates': { shippingChargeForAddress: async () => fee },
    '@/lib/shipping-pricing': pricing,
    '@/lib/payment-reconciliation': { reconcileOrderPayment: async () => ({ status: 'pending' }) },
    '@/lib/order-payments': { finalizePaidOrder: async () => { throw new Error('Shipping must still be paid even with a free-products coupon') } },
    '@/lib/razorpay': { toPaise: value => Math.round(value * 100), getRazorpayKeyId: () => 'test-key',
      createRazorpayOrder: async args => { payments.push(args); return { id: 'payment-order', amount: args.amount, currency: 'INR' } } },
  }
  vm.runInNewContext(code, { exports, console: { error() {} }, require: name => {
    if (!(name in modules)) throw new Error(name)
    return modules[name]
  } })
  return { checkout: exports.startCheckoutAction, quote: exports.quoteShippingAction, inserted, payments }
}

test('checkout persists shipping and charges the exact discounted total including delivery', async () => {
  const f = fixture()
  const result = await f.checkout({ addressId: 'addr', appliedCoupon: 'SAVE', expectedShippingAmount: 75 })
  assert.equal(result.ok, true)
  assert.equal(f.inserted[0].shipping_amount, 75)
  assert.equal(f.inserted[0].total, 975)
  assert.equal(f.payments[0].amount, 97500)
})
test('a browser cannot lower the server shipping fee or pay a stale quote', async () => {
  for (const amount of [0, 50, undefined]) {
    const f = fixture()
    assert.equal((await f.checkout({ addressId: 'addr', expectedShippingAmount: amount })).ok, false)
    assert.equal(f.inserted.length, 0)
    assert.equal(f.payments.length, 0)
  }
})
test('full product discounts do not remove the shipping charge', async () => {
  const f = fixture({ discount: 1000 })
  const result = await f.checkout({ addressId: 'addr', appliedCoupon: 'SAVE', expectedShippingAmount: 75 })
  assert.equal(result.ok, true)
  assert.equal(f.payments[0].amount, 7500)
})
test('shipping quotes and checkout cannot use another customer address', async () => {
  const f = fixture({ ownAddress: false })
  assert.equal((await f.quote('addr')).ok, false)
  assert.equal((await f.checkout({ addressId: 'addr', expectedShippingAmount: 75 })).ok, false)
  assert.equal(f.inserted.length, 0)
})
