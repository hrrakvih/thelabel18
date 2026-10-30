import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import * as crypto from 'node:crypto'
import * as statuses from '../lib/shipment-status.ts'

// Exercise the real handler with isolated provider/DB boundaries; no live orders.
const source = readFileSync(new URL('../app/api/shipping/events/route.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
function handler({ token = 'test-private-token', rows = [{ id: 'order-1' }], dbError = null, saveError = false } = {}) {
  const saves = []
  const matches = []
  const modules = {
    'node:crypto': crypto,
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '@/lib/shipment-status': statuses,
    '@/lib/supabase/admin': { getAdminSupabase: () => ({ from: () => ({ select: () => ({
      eq: (key, value) => { matches.push([key, value]); return { limit: async () => ({ data: rows, error: dbError }) } },
    }) }) }) },
    '@/lib/shipment-sync': { saveDeliveredShipment: async (...args) => {
      if (saveError) throw new Error('Database unavailable')
      saves.push(args)
      return true
    } },
  }
  const exports = {}
  vm.runInNewContext(compiled, { exports, require: (name) => {
    if (!(name in modules)) throw new Error(`Unexpected dependency ${name}`)
    return modules[name]
  }, Buffer, console: { error() {} }, process: { env: {
    SHIPROCKET_WEBHOOK_TOKEN: token, SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
  } } })
  return { post: exports.POST, saves, matches }
}
function request(body, token = 'test-private-token') {
  return new Request('https://store.example/api/shipping/events', { method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': token }, body: JSON.stringify(body) })
}
const delivered = { awb: '12345678901234', shipment_status: 'DELIVERED', shipment_status_id: 7 }

test('webhook rejects missing/wrong tokens and fails closed without configuration', async () => {
  for (const token of ['', 'wrong-token']) {
    const h = handler()
    assert.equal((await h.post(request(delivered, token))).status, 401)
    assert.equal(h.saves.length, 0)
  }
  assert.equal((await handler({ token: '' }).post(request(delivered))).status, 503)
})

test('delivered webhook matches the exact AWB before saving the linked order', async () => {
  const h = handler()
  const response = await h.post(request(delivered))
  assert.equal(response.status, 200)
  assert.equal((await response.json()).updated, true)
  assert.equal(JSON.stringify(h.matches), JSON.stringify([['tracking_number', delivered.awb]]))
  assert.equal(JSON.stringify(h.saves), JSON.stringify([['order-1', delivered.awb]]))
})

test('RTO, partial delivery, and non-delivered current-status ID 7 do not save delivery', async () => {
  for (const payload of [
    { ...delivered, shipment_status: 'RTO DELIVERED', shipment_status_id: 10 },
    { ...delivered, shipment_status: 'Partial_Delivered', shipment_status_id: 23 },
    { awb: delivered.awb, current_status_id: 7 },
  ]) {
    const h = handler()
    assert.equal((await h.post(request(payload))).status, 200)
    assert.equal(h.saves.length, 0)
  }
})

test('unknown AWB is acknowledged and ambiguous references or DB failures are retryable', async () => {
  const missing = handler({ rows: [] })
  assert.equal((await missing.post(request(delivered))).status, 200)
  assert.equal(missing.saves.length, 0)
  const duplicate = handler({ rows: [{ id: 'a' }, { id: 'b' }] })
  assert.equal((await duplicate.post(request(delivered))).status, 500)
  assert.equal(duplicate.saves.length, 0)
  assert.equal((await handler({ dbError: { message: 'offline' } }).post(request(delivered))).status, 500)
  assert.equal((await handler({ saveError: true }).post(request(delivered))).status, 500)
})

test('malformed webhook bodies are rejected', async () => {
  assert.equal((await handler().post(request({ shipment_status: 'Delivered' }))).status, 400)
  const bad = new Request('https://store.example/api/shipping/events', { method: 'POST',
    headers: { 'x-api-key': 'test-private-token' }, body: '{invalid' })
  assert.equal((await handler().post(bad)).status, 400)
})
