# Admin shipping setup

1. Run `supabase/migrations/add_shiprocket_shipping.sql` in the Supabase SQL editor before opening the updated admin orders page.
2. Set `SHIPROCKET_EMAIL` and `SHIPROCKET_PASSWORD` in the server environment on your hosting provider. Local development uses the ignored `.env.local` file. Use Shiprocket API-user credentials.
3. Restart the application. In Admin > Orders, click Shipping on an order to open the parcel dialog and enter packed length, width and height in cm, weight in kg, the exact registered Shiprocket pickup location name, and the customer's email.
4. Click Book / continue shipment. The server creates a prepaid or COD order from saved order items and address, assigns an available courier, saves the AWB, and requests pickup. This uses your Shiprocket account/wallet. The store order is automatically marked shipped after Shiprocket confirms the pickup request.

Successful pickup requests disable further booking. Known AWB or pickup failures can be continued without creating another order; saved package details are retained. If a request times out, a response is ambiguous, or saving fails, the booking stays locked to prevent duplicate shipments. Check Shiprocket using the full store order UUID. An administrator must reconcile the Shiprocket order/shipment IDs and AWB in the database before clearing the booking state to `created` (no AWB) or `awb_assigned` (AWB exists). Only reset the state to NULL when Shiprocket confirms no order was created. Never clear a booking lock while a request is in progress.

Shipment cancellation and courier handover remain operational tasks in Shiprocket. Changing the store status does not cancel a booked courier shipment.

## Delivery status sync

Delivery updates now save `delivered` in the store database, so both Admin Orders and the customer order page use the same status. No new database columns are required beyond the existing shipping migration.

After deploying:

1. Set `SUPABASE_SERVICE_ROLE_KEY` on the server, alongside the existing Shiprocket credentials. Shipping updates require this private key; the anonymous key is not sufficient.
2. Generate a random private token (for example, `openssl rand -hex 32`) and set it as the server environment variable `SHIPROCKET_WEBHOOK_TOKEN`. Do not put either secret in a `NEXT_PUBLIC_` variable or source control. Redeploy after setting environment variables.
3. In Shiprocket > Settings > API > Webhooks, add `https://YOUR-DOMAIN/api/shipping/events`, enable it, and enter the same token as the security token (`x-api-key`). See the official setup: https://apidocs.shiprocket.in/?version=latest under Webhooks.
4. For an order already Delivered in Shiprocket, open Admin > Orders > Shipping and click **Sync delivery status**. It checks the saved AWB and saves Delivered without booking or charging for another shipment. Viewing/refreshing the customer's order tracking also reconciles a delivered shipment.
5. Verify the order badge changes to Delivered in Admin Orders and the customer's order detail/list after refreshing. New delivery webhooks update the database even when the customer does not visit the site.

Only exact Delivered events or the documented shipment-status code 7 mark an order delivered. `track_status` is tracking availability, not delivery status. `current_status_id` belongs to a different status table and is not used as shipment-status code 7. RTO Delivered, partially delivered and undelivered events do not mark customer delivery. Duplicate delivery callbacks are safe, cancelled orders are not overwritten, and later non-delivery events cannot regress a delivered order. Payment state is not changed by delivery sync.

Callbacks match an exact saved AWB; unknown AWBs are acknowledged without modifying an order. Ambiguous duplicate AWBs and database failures return an error for operational investigation/retry. Unauthorized callbacks are rejected. The endpoint requires the token to be configured; an unconfigured webhook cannot update orders.

Run `npm run test:shipping` for provider-status regression tests. Live end-to-end verification requires a deployed callback, configured environment variables and a real saved shipment AWB.
