'use server'

import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/supabase/admin'
import { shiprocketRequest, getShiprocketToken, getPickupLocations, ShiprocketRequestError } from '@/lib/shiprocket'
import { validateShippingAddress } from '@/lib/shipping-address'
import { normalizeShippingPhone } from '@/lib/shipping-phone'
import { revalidatePath } from 'next/cache'

async function requireOrdersAdmin() {
    const client = await createClient()
    const { data: { user } } = await client.auth.getUser()
    if (!user) throw new Error('Please sign in as an administrator.')
    const db = getAdminSupabase()
    if (user.email !== 'admin@thelabel18.com') {
      const { data: admin } = await db.from('sub_admins').select('role, permissions').eq('email', user.email).maybeSingle()
      if (!admin || (admin.role !== 'admin' && !admin.permissions?.includes('/admin/orders'))) throw new Error('Orders permission is required.')
    }
    return db
}

export async function bookOrderShipment(orderId: string, form: FormData) {
  let rejectedRequestState: 'created' | 'awb_assigned' | 'retry' = 'retry'
  let claimedBooking = false
  try {
    const db = await requireOrdersAdmin()
    const { data: order, error } = await db.from('orders').select('*, items:order_items(*)').eq('id', orderId).single()
    if (error || !order) throw new Error('Cannot load order. Run the shipping database migration first.')
    if (['cancelled', 'delivered'].includes(order.status)) throw new Error('This order cannot be shipped.')
    if (order.payment_status !== 'paid' && order.payment_method !== 'cod') throw new Error('Record payment before booking a prepaid shipment.')
    if (order.shipping_booking_state === 'pickup_requested') {
      const { error: statusError } = await db.from('orders').update({ status: 'shipped' }).eq('id', orderId).in('status', ['pending', 'confirmed'])
      if (statusError) throw new Error('Pickup is already booked, but updating the order status failed. Please retry.')
      revalidatePath('/admin/orders')
      revalidatePath('/orders')
      revalidatePath(`/orders/${orderId}`)
      return { success: true, message: 'Shipment already booked. Order marked as shipped.' }
    }
    const { data: customer, error: customerError } = await db.auth.admin.getUserById(order.user_id)
    const email = order.shipping_package?.email || customer?.user?.email
    if (customerError && !email) throw new Error('Unable to fetch the customer email for this order.')
    const pkg = order.shipping_package || {
      length: Number(form.get('length')), breadth: Number(form.get('breadth')), height: Number(form.get('height')), weight: Number(form.get('weight')),
      pickup_location: String(form.get('pickup_location') || '').trim(), email: email || '',
    }
    if (![pkg.length, pkg.breadth, pkg.height].every(n => Number.isFinite(n) && n > 0.5) || !Number.isFinite(pkg.weight) || pkg.weight <= 0) throw new Error('Dimensions must exceed 0.5 cm and weight must exceed 0 kg.')
    if (!pkg.pickup_location || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pkg.email)) throw new Error('Enter a registered pickup location and customer email.')
    if (!order.items?.length) throw new Error('This order has no product items. Add its purchased products to order_items, or place a complete order through checkout. Inserting a row into orders alone does not add products.')
    const missingAddressFields = [
      ['ship_full_name', 'customer name'],
      ['ship_line1', 'street address'], ['ship_city', 'city'], ['ship_state', 'state'], ['ship_country', 'country'],
    ].filter(([field]) => !String(order[field] || '').trim()).map(([, label]) => label)
    if (missingAddressFields.length) throw new Error(`Delivery address is missing: ${missingAddressFields.join(', ')}. Update this order before shipping.`)
    const address = validateShippingAddress(order.ship_line1, order.ship_line2)
    const phone = normalizeShippingPhone(order.shiprocket_order_id ? order.ship_phone : form.get('phone') || order.ship_phone)
    const postalCode = String(order.ship_postal_code || '').trim()
    if (!/^\d{6}$/.test(postalCode)) throw new Error('Delivery PIN code must contain exactly 6 digits. Update ship_postal_code on this order.')

    if (!order.shiprocket_shipment_id) {
      const locations = await getPickupLocations()
      if (!locations.some(location => location.name === pkg.pickup_location)) throw new Error('Select a pickup location registered in Shiprocket.')
    }
    await getShiprocketToken()
    // Atomic claim prevents simultaneous submissions. Ambiguous API failures remain locked for reconciliation.
    let claim = db.from('orders').update({ shipping_booking_state: 'booking', shipping_package: order.shipping_package || pkg, ship_phone: phone }).eq('id', orderId)
    claim = order.shipping_booking_state ? claim.eq('shipping_booking_state', order.shipping_booking_state) : claim.is('shipping_booking_state', null)
    if (order.shipping_booking_state === 'booking') throw new Error('Booking is in progress or needs reconciliation in Shiprocket. Do not create a duplicate shipment.')
    const { data: claimed, error: claimError } = await claim.select('id').maybeSingle()
    if (claimError || !claimed) throw new Error('Shipment changed or database migration is missing. Refresh the page.')
    claimedBooking = true
    rejectedRequestState = order.tracking_number ? 'awb_assigned' : order.shiprocket_shipment_id ? 'created' : 'retry'
    async function save(values: Record<string, unknown>) {
      const { error: saveError } = await db.from('orders').update(values).eq('id', orderId)
      if (saveError) throw new Error('Shiprocket may have accepted the request, but saving failed. Reconcile this order in Shiprocket before retrying.')
    }
    let shipmentId = order.shiprocket_shipment_id
    if (!shipmentId) {
      const result = await shiprocketRequest('/orders/create/adhoc', {
        order_id: order.id, order_date: new Date(order.created_at).toISOString().slice(0, 19).replace('T', ' '),
        pickup_location: pkg.pickup_location, billing_customer_name: order.ship_full_name, billing_last_name: '',
        billing_address: address.line1, billing_address_2: address.line2, billing_city: order.ship_city,
        billing_pincode: postalCode, billing_state: order.ship_state, billing_country: order.ship_country === 'IN' ? 'India' : order.ship_country,
        billing_email: pkg.email, billing_phone: phone, shipping_is_billing: true,
        order_items: order.items.map((item: { product_name: string; variation_id: string; product_id: string; quantity: number; unit_price: number }) => ({ name: item.product_name, sku: item.variation_id || item.product_id, units: item.quantity, selling_price: Number(item.unit_price) })),
        payment_method: order.payment_method === 'cod' ? 'COD' : 'Prepaid', sub_total: Number(order.subtotal), total_discount: Number(order.discount_amount || 0),
        length: pkg.length, breadth: pkg.breadth, height: pkg.height, weight: pkg.weight,
      })
      if (!result.order_id || !result.shipment_id) throw new Error('Shiprocket did not confirm creation. Check the Shiprocket dashboard before retrying.')
      shipmentId = String(result.shipment_id)
      await save({ shiprocket_order_id: String(result.order_id), shiprocket_shipment_id: shipmentId })
      rejectedRequestState = 'created'
    }
    if (!order.tracking_number) {
      const result = await shiprocketRequest('/courier/assign/awb', { shipment_id: shipmentId })
      const awb = result.response?.data
      if (Number(result.awb_assign_status) !== 1 || !awb?.awb_code) {
        await save({ shipping_booking_state: 'created' })
        throw new Error('Shipment created; AWB assignment failed. Check courier availability and wallet balance, then continue booking.')
      }
      await save({ tracking_number: String(awb.awb_code), courier_name: awb.courier_name || null })
      rejectedRequestState = 'awb_assigned'
    }
    const pickup = await shiprocketRequest('/courier/generate/pickup', { shipment_id: [Number(shipmentId)] })
    if (Number(pickup.pickup_status) !== 1) {
      await save({ shipping_booking_state: 'awb_assigned' })
      throw new Error('AWB saved; pickup was not confirmed. Check Shiprocket, then continue booking.')
    }
    await save({ shipping_booking_state: 'pickup_requested', status: 'shipped' })
    revalidatePath('/admin/orders')
    revalidatePath('/orders')
    revalidatePath(`/orders/${orderId}`)
    return { success: true, message: 'Shipment booked, pickup requested and order marked as shipped.' }
  } catch (error) {
    // Only explicit validation rejections can release a lock. Network failures,
    // timeouts and ambiguous server errors still require reconciliation.
    if (claimedBooking && error instanceof ShiprocketRequestError && [400, 422].includes(error.status)) {
      const values = rejectedRequestState === 'retry'
        ? { shipping_booking_state: null, shipping_package: null }
        : { shipping_booking_state: rejectedRequestState }
      const { error: resetError } = await getAdminSupabase().from('orders').update(values).eq('id', orderId).eq('shipping_booking_state', 'booking')
      if (resetError) return { success: false, message: `${error.message} Could not release the booking lock; reconciliation is required.` }
      revalidatePath('/admin/orders')
    }
    return { success: false, message: error instanceof Error ? error.message : 'Shipment booking failed.' }
  }
}

export async function loadOrderShippingOptions(orderId: string) {
  try {
    const db = await requireOrdersAdmin()
    const { data: order, error } = await db.from('orders').select('user_id, shipping_package').eq('id', orderId).single()
    if (error || !order) throw new Error('Cannot load this order.')
    const { data: customer } = await db.auth.admin.getUserById(order.user_id)
    const email = String(order.shipping_package?.email || customer?.user?.email || '')
    if (!email) throw new Error('The customer account has no email. Update the customer account before shipping.')
    const locations = await getPickupLocations()
    return { success: true as const, email, locations }
  } catch (error) {
    return { success: false as const, message: error instanceof Error ? error.message : 'Unable to load shipping details.' }
  }
}
