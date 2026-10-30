# PIN-code shipping charges

## Enable the feature

1. Run `supabase/migrations/add_shipping_pin_rates.sql` in the Supabase SQL Editor before deploying this code. It adds rate/settings tables and the stored shipping amount on orders. No historical order totals are changed.
2. Deploy the code with the existing Supabase server environment variables configured.
3. Open **Admin → PIN Codes & Shipping** (`/admin/pincodes`). The ten user-provided regional ranges are prefilled at ₹0. Edit each row and enter the actual charge. ₹0 means free shipping.
4. Set **Other PIN codes → Default shipping charge** for delivery PINs outside all active ranges. Its initial value is ₹0.
5. Open **Sub Admin Management → Edit → Accessible Tabs & Permissions**, select **PIN Codes & Shipping**, and save for each sub-admin who should manage rates. This adds an assignable permission; it does not grant every existing sub-admin access automatically.

## Behavior

- Start and end PINs are inclusive. For a single PIN, enter the same value in both fields.
- Active ranges cannot overlap. Disable a range to stop applying it.
- Checkout uses the selected saved delivery address and shows a rupee amount instead of “Extra”. Total payable = product subtotal − product discount (minimum ₹0) + shipping.
- Shipping is recalculated server-side before creating the payment. If the charge changed after the preview, checkout asks the customer to refresh and review the amount before paying.
- A product coupon does not remove shipping charges. A fully discounted basket with a nonzero shipping fee still requires payment for shipping.
- The saved charge appears in customer order details, admin summaries and invoices, and is sent with new Shiprocket bookings. Changing rates affects future checkout attempts, not existing orders or payments.
- Missing shipping configuration blocks payment rather than silently charging an unknown amount. An unavailable rate lookup offers Retry at checkout.

## Checks

Run `npm run test:shipping` and `npx tsc --noEmit`. Tests cover inclusive ranges, disabled/default rates, invalid amounts, coupon-plus-shipping totals, exact payment amount, stale/tampered quotes and address ownership.

After applying the migration, verify in a deployed preview: edit a region to a known fee, select an address in that range, confirm the checkout charge and total, then test an address outside it. Use Razorpay test credentials for a payment test. Check the resulting order summary/invoice and a permitted versus unpermitted sub-admin login.
