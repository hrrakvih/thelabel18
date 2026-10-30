'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

// Uses the service-role key so the admin backend can bypass RLS.
// NEVER expose SUPABASE_SERVICE_ROLE_KEY to the client — this file only runs on the server.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type DiscountType = 'percentage' | 'fixed'

function parseCouponFields(formData: FormData) {
  const code = String(formData.get('code') || '').trim().toUpperCase()
  const description = String(formData.get('description') || '').trim()
  const discount_type = String(formData.get('discount_type') || '') as DiscountType
  const discount_value = Number(formData.get('discount_value') || 0)
  const maxDiscountRaw = String(formData.get('max_discount_amount') || '').trim()
  const max_discount_amount = maxDiscountRaw ? Number(maxDiscountRaw) : null
  const min_order_value = Number(formData.get('min_order_value') || 0)
  const usageLimitRaw = String(formData.get('usage_limit') || '').trim()
  const usage_limit = usageLimitRaw ? Number(usageLimitRaw) : null
  const valid_from = String(formData.get('valid_from') || '')
  const validUntilRaw = String(formData.get('valid_until') || '').trim()
  const valid_until = validUntilRaw || null

  // ---- validation (mirrors the DB constraints, but with friendlier messages) ----
  if (!code) throw new Error('Coupon code is required')
  if (!/^[A-Z0-9_-]+$/.test(code)) {
    throw new Error('Coupon code can only contain letters, numbers, hyphens, and underscores')
  }
  if (discount_type !== 'percentage' && discount_type !== 'fixed') {
    throw new Error('Discount type must be percentage or fixed')
  }
  if (!discount_value || discount_value <= 0) {
    throw new Error('Discount value must be greater than 0')
  }
  if (discount_type === 'percentage' && discount_value > 100) {
    throw new Error('Percentage discount cannot exceed 100')
  }
  if (max_discount_amount !== null && max_discount_amount <= 0) {
    throw new Error('Max discount amount must be greater than 0')
  }
  if (min_order_value < 0) {
    throw new Error('Minimum order value cannot be negative')
  }
  if (usage_limit !== null && usage_limit <= 0) {
    throw new Error('Usage limit must be greater than 0')
  }
  if (!valid_from) {
    throw new Error('Valid-from date is required')
  }
  if (valid_until && new Date(valid_until) <= new Date(valid_from)) {
    throw new Error('Valid-until date must be after the valid-from date')
  }

  return {
    code,
    description,
    discount_type,
    discount_value,
    max_discount_amount,
    min_order_value,
    usage_limit,
    valid_from: new Date(valid_from).toISOString(),
    valid_until: valid_until ? new Date(valid_until).toISOString() : null,
  }
}

export async function addCoupon(formData: FormData) {
  const fields = parseCouponFields(formData)

  const { error } = await supabase.from('coupons').insert(fields)

  if (error) {
    // Postgres unique_violation
    if (error.code === '23505') throw new Error(`Coupon code "${fields.code}" already exists`)
    throw new Error(error.message)
  }

  revalidatePath('/admin/coupons')
}

export async function updateCoupon(id: string, formData: FormData) {
  const fields = parseCouponFields(formData)

  const { error } = await supabase.from('coupons').update(fields).eq('id', id)

  if (error) {
    if (error.code === '23505') throw new Error(`Coupon code "${fields.code}" already exists`)
    throw new Error(error.message)
  }

  revalidatePath('/admin/coupons')
}

export async function toggleCouponActive(id: string, nextValue: boolean) {
  const { error } = await supabase.from('coupons').update({ is_active: nextValue }).eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/coupons')
}

export async function deleteCoupon(id: string) {
  const { error } = await supabase.from('coupons').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/coupons')
}