import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import * as pricing from '../lib/shipping-pricing.ts'

const source = readFileSync(new URL('../lib/shipping-rates.ts', import.meta.url), 'utf8')
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
function fixture({ rows = [{ pin_from: 560001, pin_to: 560110, active: true, amount: 60 }], defaultAmount = 90, fail = false } = {}) {
  const db = { from(table) {
    let filtered = rows
    const query = {
      select() { return query },
      eq(key, value) { filtered = filtered.filter(row => row[key] === value); return query },
      lte(key, value) { filtered = filtered.filter(row => row[key] <= value); return query },
      gte(key, value) { filtered = filtered.filter(row => row[key] >= value); return query },
      async limit(n) { return { data: filtered.slice(0, n), error: fail ? {} : null } },
      async single() { return { data: { default_amount: defaultAmount }, error: fail ? {} : null } },
    }
    assert.ok(['shipping_pin_rates', 'shipping_settings'].includes(table))
    return query
  } }
  const exports = {}
  vm.runInNewContext(code, { exports, require: name => {
    if (name === 'server-only') return {}
    if (name === '@/lib/shipping-pricing') return pricing
    if (name === '@/lib/supabase/admin') return { getAdminSupabase: () => db }
    throw new Error(name)
  } })
  return pin => exports.shippingChargeForAddress({ postal_code: String(pin), country: 'India' })
}

test('range boundaries match inclusively and outside PINs use the default', async () => {
  const quote = fixture()
  assert.equal(await quote(560001), 60)
  assert.equal(await quote(560110), 60)
  assert.equal(await quote(560111), 90)
  assert.equal(await quote(560000), 90)
})
test('disabled ranges do not apply, zero remains free, and overlaps fail closed', async () => {
  assert.equal(await fixture({ rows: [{ pin_from: 560001, pin_to: 560110, active: false, amount: 60 }] })(560010), 90)
  assert.equal(await fixture({ defaultAmount: 0, rows: [] })(560010), 0)
  const rate = { pin_from: 560001, pin_to: 560110, active: true, amount: 50 }
  await assert.rejects(fixture({ rows: [rate, rate] })(560010), /unavailable/)
  await assert.rejects(fixture({ fail: true })(560010), /unavailable/)
})
