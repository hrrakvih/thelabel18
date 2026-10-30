-- Run this in your Supabase SQL Editor if you also wish to enable RLS INSERT policies directly for authenticated users:
-- Go to: https://supabase.com -> Your Project -> SQL Editor

-- 1. Policy for inserting orders
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
CREATE POLICY "Users can insert their own orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 2. Policy for inserting order items
DROP POLICY IF EXISTS "Users can insert order items for their own orders" ON order_items;
CREATE POLICY "Users can insert order items for their own orders"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- 3. Policy for selecting their own order items
DROP POLICY IF EXISTS "Users can view order items for their own orders" ON order_items;
CREATE POLICY "Users can view order items for their own orders"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );
