'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/supabase/admin'
import {
  captureRazorpayPayment,
  createRazorpayOrder,
  fetchRazorpayPayment,
  getRazorpayKeyId,
  toPaise,
  verifyPaymentSignature,
} from '@/lib/razorpay'
import { finalizePaidOrder } from '@/lib/order-payments'

// Errors are returned rather than thrown: Next.js replaces thrown server action
// messages with a generic one in production, and customers need the real reason.
type ActionResult<T> = ({ ok: true } & T) | { ok: false; error: string }

type CartRow = {
  quantity: number
  product_id: string
  variation_id: string | null
  products: { name: string } | null
  product_variations: {
    price: number
    color: string | null
    size: string | null
    stock_quantity: number
  } | null
}

export type StartCheckoutInput = {
  addressId: string
  appliedCoupon?: string | null
}

export type StartCheckoutResult = ActionResult<
  | { kind: 'paid'; orderId: string }
  | {
      kind: 'razorpay'
      orderId: string
      razorpayOrderId: string
      amount: number
      currency: string
      keyId: string
      prefill: { name: string; email: string; contact: string }
    }
>

async function getSignedInUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

function fail(err: unknown, fallback: string): { ok: false; error: string } {
  const message = err instanceof Error ? err.message : fallback
  console.error(fallback, err)
  return { ok: false, error: message || fallback }
}

/**
 * Creates a pending order from the signed-in user's cart and a matching
 * Razorpay order. Prices, stock and coupon are all read from the database —
 * nothing the browser sends is trusted for the amount charged.
 */
export async function startCheckoutAction(input: StartCheckoutInput): Promise<StartCheckoutResult> {
  try {
    const user = await getSignedInUser()
    if (!user) return { ok: false, error: 'Please sign in to place an order.' }

    const supabaseAdmin = getAdminSupabase()

    // 1. Shipping address must belong to this user
    const { data: address } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('id', input.addressId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!address?.full_name || !address?.phone || !address?.line1) {
      return { ok: false, error: 'Please provide complete shipping address details.' }
    }

    // 2. Load cart with current prices and stock
    const { data: cartData, error: cartErr } = await supabaseAdmin
      .from('cart_items')
      .select(
        'quantity, product_id, variation_id, products(name), product_variations(price, color, size, stock_quantity)'
      )
      .eq('user_id', user.id)

    if (cartErr) return { ok: false, error: 'Could not load your cart. Please try again.' }
    const cart = (cartData ?? []) as unknown as CartRow[]
    if (cart.length === 0) return { ok: false, error: 'Your cart is empty.' }

    for (const row of cart) {
      const name = row.products?.name ?? 'Product'
      const variation = row.product_variations
      if (!variation || !(Number(variation.price) > 0)) {
        return { ok: false, error: `"${name}" is no longer available. Please remove it from your cart.` }
      }
      if (variation.stock_quantity < row.quantity) {
        return {
          ok: false,
          error: `"${name}" only has ${variation.stock_quantity} item(s) left in stock. Please adjust quantity.`,
        }
      }
    }

    // 3. Calculate subtotal
    const subtotal = cart.reduce((sum, row) => sum + Number(row.product_variations!.price) * row.quantity, 0)

    // 4. Validate coupon if provided
    let discountAmount = 0
    let couponCode: string | null = null

    if (input.appliedCoupon && input.appliedCoupon.trim()) {
      const code = input.appliedCoupon.trim().toUpperCase()
      const { data: coupon } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle()

      const now = new Date()
      const isValid =
        coupon &&
        (!coupon.valid_from || new Date(coupon.valid_from) <= now) &&
        (!coupon.valid_until || new Date(coupon.valid_until) >= now) &&
        (!coupon.min_order_value || subtotal >= Number(coupon.min_order_value)) &&
        (coupon.usage_limit == null || (coupon.used_count ?? 0) < coupon.usage_limit)

      if (!isValid) {
        return { ok: false, error: `Coupon ${code} is no longer valid. Please remove it and try again.` }
      }

      couponCode = coupon.code
      if (coupon.discount_type === 'percentage') {
        let d = (subtotal * Number(coupon.discount_value)) / 100
        if (coupon.max_discount_amount) d = Math.min(d, Number(coupon.max_discount_amount))
        discountAmount = Math.round(d)
      } else {
        discountAmount = Math.min(Number(coupon.discount_value), subtotal)
      }
    }

    const total = Math.max(0, subtotal - discountAmount)
    const amountInPaise = toPaise(total)
    if (amountInPaise > 0 && amountInPaise < 100) {
      return { ok: false, error: 'Order total must be at least ₹1.' }
    }

    // 5. Create the order as awaiting payment
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: user.id,
        address_id: address.id,
        total,
        subtotal,
        discount_amount: discountAmount,
        coupon_code: couponCode,
        ship_full_name: address.full_name.trim(),
        ship_phone: address.phone.trim(),
        ship_line1: address.line1.trim(),
        ship_line2: address.line2?.trim() || null,
        ship_city: address.city.trim(),
        ship_state: address.state.trim(),
        ship_postal_code: address.postal_code.trim(),
        ship_country: address.country.trim(),
        status: 'pending',
        payment_status: 'pending',
        payment_method: amountInPaise === 0 ? 'coupon' : 'razorpay',
      })
      .select('id')
      .single()

    if (orderErr || !order) {
      return fail(orderErr, 'Failed to create order record.')
    }

    try {
      // 6. Insert order items
      const orderItems = cart.map((row) => {
        const variation = row.product_variations!
        const unitPrice = Number(variation.price)
        return {
          order_id: order.id,
          product_id: row.product_id,
          variation_id: row.variation_id,
          product_name: row.products?.name ?? 'Product',
          variation_label: [variation.color, variation.size].filter(Boolean).join(' / ') || null,
          unit_price: unitPrice,
          quantity: row.quantity,
          line_total: unitPrice * row.quantity,
        }
      })

      const { error: itemsErr } = await supabaseAdmin.from('order_items').insert(orderItems)
      if (itemsErr) throw new Error(`Failed to save order items: ${itemsErr.message}`)

      // Fully discounted orders have nothing to charge
      if (amountInPaise === 0) {
        await finalizePaidOrder(order.id, null)
        return { ok: true, kind: 'paid', orderId: order.id }
      }

      // 7. Create the matching Razorpay order
      const razorpayOrder = await createRazorpayOrder({
        amount: amountInPaise,
        receipt: order.id,
        notes: { order_id: order.id, user_id: user.id },
      })

      const { error: linkErr } = await supabaseAdmin
        .from('orders')
        .update({ razorpay_order_id: razorpayOrder.id })
        .eq('id', order.id)
      if (linkErr) throw new Error(`Failed to link payment: ${linkErr.message}`)

      return {
        ok: true,
        kind: 'razorpay',
        orderId: order.id,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: getRazorpayKeyId(),
        prefill: {
          name: address.full_name,
          email: user.email ?? '',
          contact: address.phone,
        },
      }
    } catch (err) {
      // Nothing has been charged yet — remove the partial order
      await supabaseAdmin.from('order_items').delete().eq('order_id', order.id)
      await supabaseAdmin.from('orders').delete().eq('id', order.id)
      throw err
    }
  } catch (err) {
    return fail(err, 'Could not start payment. Please try again.')
  }
}

export type VerifyPaymentInput = {
  orderId: string
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}

/**
 * Called by the checkout page after Razorpay reports success. Verifies the
 * signature, confirms the payment with Razorpay, then finalizes the order.
 */
export async function verifyPaymentAction(input: VerifyPaymentInput): Promise<ActionResult<{ orderId: string }>> {
  try {
    const user = await getSignedInUser()
    if (!user) return { ok: false, error: 'Please sign in to continue.' }

    const supabaseAdmin = getAdminSupabase()
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id, total, payment_status, razorpay_order_id')
      .eq('id', input.orderId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!order) return { ok: false, error: 'Order not found.' }
    if (order.payment_status === 'paid') return { ok: true, orderId: order.id }

    if (
      !order.razorpay_order_id ||
      order.razorpay_order_id !== input.razorpayOrderId ||
      !verifyPaymentSignature(order.razorpay_order_id, input.razorpayPaymentId, input.razorpaySignature)
    ) {
      return { ok: false, error: 'Payment verification failed. If money was debited, please contact support.' }
    }

    // Double-check with Razorpay that the money actually reached us
    let payment = await fetchRazorpayPayment(input.razorpayPaymentId)
    const expectedAmount = toPaise(order.total)

    if (payment.order_id !== order.razorpay_order_id || payment.amount !== expectedAmount) {
      return { ok: false, error: 'Payment details do not match this order. Please contact support.' }
    }
    if (payment.status === 'authorized') {
      payment = await captureRazorpayPayment(payment.id, payment.amount, payment.currency)
    }
    if (payment.status !== 'captured') {
      return { ok: false, error: 'Payment was not completed. Please try again.' }
    }

    await finalizePaidOrder(order.id, payment.id)
    return { ok: true, orderId: order.id }
  } catch (err) {
    return fail(err, 'Could not verify payment. If money was debited, please contact support.')
  }
}

/**
 * Called when the customer closes the Razorpay window without paying. The
 * order stays in the database for reference but is hidden from order lists.
 */
export async function markPaymentAbandonedAction(orderId: string): Promise<ActionResult<object>> {
  try {
    const user = await getSignedInUser()
    if (!user) return { ok: false, error: 'Please sign in to continue.' }

    await getAdminSupabase()
      .from('orders')
      .update({ payment_status: 'failed' })
      .eq('id', orderId)
      .eq('user_id', user.id)
      .eq('payment_status', 'pending')

    revalidatePath('/orders')
    return { ok: true }
  } catch (err) {
    return fail(err, 'Could not update order.')
  }
}
