# Paystack checkout

1. Run `supabase/06_paystack_payments.sql` in the Supabase SQL Editor, after migration 05. It is safe to run 06 again.
2. In `frontend/.env.local`, set `PAYSTACK_SECRET_KEY` to the merchant account's test secret key. It must stay server-side. Set `NEXT_PUBLIC_APP_URL=https://unsnap-plug-shifty.ngrok-free.dev`.
3. In Paystack's **test** API settings, save:
   - Callback URL: `https://unsnap-plug-shifty.ngrok-free.dev/api/payments/paystack/callback`
   - Webhook URL: `https://unsnap-plug-shifty.ngrok-free.dev/api/payments/paystack/webhook`
4. Keep the app running on port 3000 and ngrok forwarding to that port. Restart Next.js after changing environment variables.
5. Open the shop through the ngrok address, sign in, add a product, and choose **Pay with Paystack**. Complete a simulated payment using Paystack's test checkout. The order should show **Payment confirmed**, a reference, and the test-payment label. Confirm the transaction appears in the same Paystack account's test transactions.

The hosted redirect flow does not need a public key. Webhook signatures use `PAYSTACK_SECRET_KEY`; no separate webhook secret is used. No card details pass through the application. The server calculates the amount from saved product prices and verifies the reference, amount, currency, and test/live mode before saving a successful payment. Callback and webhook processing use the same atomic settlement function.

Current checkout charges for the items in NGN. Delivery charges are arranged separately and are explicitly excluded on checkout. Orders and successful payment records appear in the customer dashboard and admin orders. Staff cannot prepare or dispatch an unpaid Paystack order. Failed/interrupted payments can be checked and retried from the order page. A payment received after cancellation, or an additional payment, is recorded for support review without dispatching the order twice; refunds are handled by staff in Paystack.

For real payments, replace the secret with the same merchant account's live key, use a stable public HTTPS application URL, update the live callback/webhook settings, and restart the app. Test payments remain explicitly labelled as tests. Review the dummy catalogue prices and inventory before accepting real payments.

Checks:
```
node supabase/tests/verify.mjs
node --test frontend/tests/paystack.test.cjs
```

Official documentation: https://paystack.com/docs/payments/accept-payments/ and https://paystack.com/docs/payments/webhooks/
