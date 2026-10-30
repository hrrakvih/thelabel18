-- One-time correction for the two shipments verified as Delivered in Shiprocket.
-- Run in the Supabase SQL Editor. Other orders and payment statuses are unchanged.
-- Both the order UUID and saved AWB must match before an order is updated.
UPDATE public.orders AS orders
SET status = 'delivered'
FROM (VALUES
  ('2a32858e-96a5-4c75-bc59-24175d16b87b'::uuid, '1319461778544'),
  ('5d0a3f33-de3e-431e-a300-3e08be4db516'::uuid, '1319461554294')
) AS verified(order_id, awb)
WHERE orders.id = verified.order_id
  AND orders.tracking_number = verified.awb
  AND orders.status IN ('pending', 'confirmed', 'shipped', 'out_for_delivery')
RETURNING orders.id, orders.ship_full_name, orders.tracking_number, orders.status;
