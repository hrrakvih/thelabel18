# Admin shipping setup

1. Run `supabase/migrations/add_shiprocket_shipping.sql` in the Supabase SQL editor before opening the updated admin orders page.
2. Set `SHIPROCKET_EMAIL` and `SHIPROCKET_PASSWORD` in the server environment on your hosting provider. Local development uses the ignored `.env.local` file. Use Shiprocket API-user credentials.
3. Restart the application. In Admin > Orders, click Shipping on an order to open the parcel dialog and enter packed length, width and height in cm, weight in kg, the exact registered Shiprocket pickup location name, and the customer's email.
4. Click Book / continue shipment. The server creates a prepaid or COD order from saved order items and address, assigns an available courier, saves the AWB, and requests pickup. This uses your Shiprocket account/wallet. The store order is automatically marked shipped after Shiprocket confirms the pickup request.

Successful pickup requests disable further booking. Known AWB or pickup failures can be continued without creating another order; saved package details are retained. If a request times out, a response is ambiguous, or saving fails, the booking stays locked to prevent duplicate shipments. Check Shiprocket using the full store order UUID. An administrator must reconcile the Shiprocket order/shipment IDs and AWB in the database before clearing the booking state to `created` (no AWB) or `awb_assigned` (AWB exists). Only reset the state to NULL when Shiprocket confirms no order was created. Never clear a booking lock while a request is in progress.

Shipment cancellation and courier handover remain operational tasks in Shiprocket. Changing the store status does not cancel a booked courier shipment.
