-- Run this in your Supabase SQL Editor before using Razorpay checkout:
-- Go to: https://supabase.com -> Your Project -> SQL Editor

-- 1. Payment tracking columns on orders.
--    payment_status is NULL for orders placed before Razorpay was added.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS payment_status text,
  ADD COLUMN IF NOT EXISTS razorpay_order_id text,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE orders
  ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IS NULL OR payment_status IN ('pending', 'paid', 'failed'));

-- 2. One store order per Razorpay order.
CREATE UNIQUE INDEX IF NOT EXISTS orders_razorpay_order_id_key
  ON orders (razorpay_order_id)
  WHERE razorpay_order_id IS NOT NULL;

-- 3. Payment state must only ever be written by the server (service role).
--    If you have an UPDATE policy on orders for authenticated users, drop it,
--    otherwise a customer could mark their own order as paid from the browser.
--    Check with: SELECT policyname, cmd FROM pg_policies WHERE tablename = 'orders';
