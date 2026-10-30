import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
const code = ts.transpileModule(readFileSync(new URL('../lib/order-payments.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
function fixture(status = 'pending') {
  const order = { id: 'order', status, payment_status: 'pending', user_id: 'user', coupon_code: null }
  const variation = { id: 'variation', stock_quantity: 10 }
  let clears = 0
  const db = { from(table) {
    const filters = []; let values, deleting = false
    const run = () => {
      const rows = table === 'orders' ? [order] : table === 'product_variations' ? [variation] : table === 'order_items' ? [{ order_id: 'order', variation_id: 'variation', quantity: 2 }] : [{ user_id: 'user' }]
      const matches = rows.filter(row => filters.every(([key, allowed]) => allowed.includes(row[key])))
      if (values) for (const row of matches) Object.assign(row, values)
      if (deleting && table === 'cart_items') clears++
      return matches.map(row => ({ ...row }))
    }
    const q = { select() { return q }, eq(key, value) { filters.push([key, [value]]); return q },
      in(key, allowed) { filters.push([key, allowed]); return q }, update(input) { values = input; return q }, delete() { deleting = true; return q },
      async single() { return { data: run()[0] ?? null, error: null } },
      async maybeSingle() { return { data: run()[0] ?? null, error: null } },
      then(resolve, reject) { return Promise.resolve({ data: run(), error: null }).then(resolve, reject) },
    }
    return q
  } }
  const exports = {}
  vm.runInNewContext(code, { exports, require: name => {
    if (name === 'next/cache') return { revalidatePath() {} }
    if (name === '@/lib/supabase/admin') return { getAdminSupabase: () => db }
    throw new Error(name)
  } })
  return { finalize: exports.finalizePaidOrder, order, variation, clears: () => clears }
}
test('paid finalization updates stock/cart once and duplicate delivery has no second effect', async () => {
  const f = fixture()
  assert.equal(await f.finalize('order', 'payment'), true)
  assert.equal(f.order.status, 'confirmed')
  assert.equal(f.order.payment_status, 'paid')
  assert.equal(f.variation.stock_quantity, 8)
  assert.equal(f.clears(), 1)
  assert.equal(await f.finalize('order', 'payment'), false)
  assert.equal(f.variation.stock_quantity, 8)
  assert.equal(f.clears(), 1)
})
test('late payment confirmation preserves an already shipped or delivered order', async () => {
  for (const status of ['shipped', 'delivered']) {
    const f = fixture(status)
    assert.equal(await f.finalize('order', 'payment'), true)
    assert.equal(f.order.status, status)
  }
})
test('cancelled orders cannot be reopened by payment finalization', async () => {
  const f = fixture('cancelled')
  await assert.rejects(f.finalize('order', 'payment'), /cancelled/)
  assert.equal(f.order.payment_status, 'pending')
  assert.equal(f.variation.stock_quantity, 10)
  assert.equal(f.clears(), 0)
})
