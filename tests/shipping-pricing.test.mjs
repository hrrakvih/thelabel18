import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parsePin, parseShippingAmount, payableWithShipping } from '../lib/shipping-pricing.ts'

test('PIN codes must be complete six-digit Indian PINs', () => {
  assert.equal(parsePin(' 560001 '), 560001)
  assert.equal(parsePin('586213'), 586213)
  for (const input of ['', '056001', '56000', '5600010', '56000x', null]) assert.throws(() => parsePin(input))
})

test('shipping charges accept zero and paise but reject invalid or negative values', () => {
  assert.equal(parseShippingAmount('0'), 0)
  assert.equal(parseShippingAmount('75.50'), 75.5)
  assert.equal(parseShippingAmount(100000), 100000)
  for (const input of ['', -1, '1.001', '1e3', Infinity, null, '100000.01']) assert.throws(() => parseShippingAmount(input))
})

test('shipping increases the payment total after discounts, including free-product coupons', () => {
  assert.equal(payableWithShipping(1049, 0, 60), 1109)
  assert.equal(payableWithShipping(1000, 100, 75.5), 975.5)
  assert.equal(payableWithShipping(1000, 1000, 75), 75)
  assert.equal(payableWithShipping(1000, 1500, 75), 75)
  assert.equal(payableWithShipping(19.99, 0.01, 0.02), 20)
})
