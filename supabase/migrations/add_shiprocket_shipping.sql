alter table public.orders
  add column if not exists shiprocket_order_id text,
  add column if not exists shiprocket_shipment_id text,
  add column if not exists tracking_number text,
  add column if not exists courier_name text,
  add column if not exists tracking_url text,
  add column if not exists shipping_package jsonb,
  add column if not exists shipping_booking_state text;
