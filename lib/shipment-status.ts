/** Provider status codes differ between order and shipment status fields. */
export function isDeliveredShipment(status: unknown, shipmentStatusId?: unknown): boolean {
  // Match the complete label: RTO Delivered and Partial Delivered are not delivery.
  if (typeof status === 'string' && status.trim()) {
    return status.trim().toLowerCase() === 'delivered'
  }
  // 7 is Delivered in the shipment-status namespace, not current_status_id.
  return shipmentStatusId === 7 || shipmentStatusId === '7'
}

type RecordValue = Record<string, unknown>
export function asRecord(value: unknown): RecordValue {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as RecordValue : {}
}

export function readShipmentTracking(raw: unknown) {
  const data = asRecord(asRecord(raw).tracking_data)
  const track = asRecord(Array.isArray(data.shipment_track) ? data.shipment_track[0] : undefined)
  const label = typeof track.current_status === 'string' ? track.current_status.trim() : ''
  return {
    delivered: isDeliveredShipment(label, data.shipment_status),
    label,
    etd: typeof data.etd === 'string' ? data.etd : null,
    activities: Array.isArray(data.shipment_track_activities) ? data.shipment_track_activities.slice(0, 10) : [],
    courier: typeof track.courier_name === 'string' ? track.courier_name : null,
    url: typeof data.track_url === 'string' ? data.track_url : null,
  }
}
