# Razorpay automatic capture and payment sync

## Automatic capture

After deployment and webhook configuration, the `payment.authorized` event triggers capture of the matching authorized payment. The server checks the saved Razorpay order ID, exact amount in paise, INR currency and cancellation state before capture. A captured response is verified before confirming the store order. The existing checkout-success callback also captures authorized payments.

Admin **Sync payment** and payment-window dismissal also reconcile the current provider status and capture a matching authorized payment if needed. These paths never initiate a new customer payment or retry a failed one. Created/failed payments cannot be captured. If a capture request fails or times out, the same payment is fetched once to detect a concurrent/successful capture; another capture is not submitted blindly.

Already-paid orders skip finalization. Duplicate callbacks cannot decrement stock or clear the cart a second time. Finalization preserves an existing shipped/delivered state and refuses cancelled orders.

## Same-page order tabs

Admin Orders opens on **Paid orders**. **Payment pending**, **Payment failed**, and **All records** show their respective records on the same page, with counts. Switching tabs clears the search and fulfillment filter. Payment state is not changed merely by switching tabs.

## Failure reasons

Click **Sync payment** to open payment details. Failed attempts show Razorpay's latest `error_description` (or `error_reason`), payment ID, error code, source and step where provided. The UI explicitly says when Razorpay provides no reason. Pending payments explain whether Razorpay has no recorded attempts or has not yet authorized/captured an attempt. These details are fetched on demand, not guessed or stored as a new database field.

## Configure after deployment

1. Keep `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` on the server.
2. Set `RAZORPAY_WEBHOOK_SECRET` to a strong random secret separate from the API secret. Never use a `NEXT_PUBLIC_` variable for it.
3. Add the public HTTPS endpoint `https://YOUR-DOMAIN/api/payments/events` in Razorpay Dashboard webhook settings, using the same webhook secret.
4. Enable **payment.authorized**, **payment.captured**, **order.paid**, and **payment.failed**. Use the account/mode matching the API credentials.
5. Validate with Razorpay test credentials and a preview deployment before enabling live automatic capture. Localhost cannot directly receive Razorpay webhooks.

Official API: https://razorpay.com/docs/api/payments/capture/
Webhook validation: https://razorpay.com/docs/webhooks/validate-test/

## Verification

Run `npm run test:shipping` for all payment/shipping regression tests. Automatic capture is tested with mocked provider responses; live captures are not executed as a test.

The previously identified Harshitha order `76d22893-9920-49ba-9c27-b35742cf6448` was verified against the live Razorpay order-payments API and the store database. It reports paid/confirmed with payment `pay_Tu75bcdOHgpHCX`, total ₹3,639. It was already confirmed by the time that reconciliation check ran. No bulk audit or correction was performed.
