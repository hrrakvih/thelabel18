import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isDeliveredShipment, readShipmentTracking } from '../lib/shipment-status.ts'

test('recognizes delivered labels and shipment codes only', () => {
  assert.equal(isDeliveredShipment(' DELIVERED '), true)
  assert.equal(isDeliveredShipment(undefined, 7), true)
  assert.equal(isDeliveredShipment('', '7'), true)
  for (const label of ['RTO Delivered', 'UNDELIVERED', 'Partial_Delivered', 'Partially Delivered', 'In Transit']) {
    assert.equal(isDeliveredShipment(label, 7), false, label)
  }
  assert.equal(isDeliveredShipment(undefined), false)
  assert.equal(isDeliveredShipment(undefined, 10), false)
})

test('tracking availability is never treated as delivery status', () => {
  const result = readShipmentTracking({ tracking_data: { track_status: 1, shipment_status: 18,
    shipment_track: [{ current_status: 'In Transit', current_status_id: 7 }] } })
  assert.equal(result.delivered, false)
  assert.equal(result.label, 'In Transit')
  assert.equal(readShipmentTracking({ tracking_data: { track_status: 1 } }).delivered, false)
})

test('reads delivered tracking while retaining return-delivery distinction', () => {
  assert.equal(readShipmentTracking({ tracking_data: { shipment_status: 7,
    shipment_track: [{ current_status: 'Delivered' }] } }).delivered, true)
  assert.equal(readShipmentTracking({ tracking_data: { shipment_status: 10,
    shipment_track: [{ current_status: 'RTO Delivered' }] } }).delivered, false)
  assert.equal(readShipmentTracking(null).delivered, false)
})

test('limits timeline and handles missing or invalid fields', () => {
  const result = readShipmentTracking({ tracking_data: { track_url: 'https://example.com/track',
    shipment_track_activities: Array.from({ length: 20 }, (_, id) => ({ id })) } })
  assert.equal(result.activities.length, 10)
  assert.equal(result.url, 'https://example.com/track')
  assert.deepEqual(readShipmentTracking({ tracking_data: { shipment_track_activities: {} } }).activities, [])
})
