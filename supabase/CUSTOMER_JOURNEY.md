# Customer dashboard, checkout and delivery tracking

Run `05_customer_journey.sql` in the Supabase SQL Editor after the existing `01_setup.sql` and `04_application_integration.sql` setup. Do not rerun the fresh-project bootstrap on an existing database. The new migration is transactional and can be rerun.

## Customer flow

1. Add a product and size from the shop. The same bag appears at `/cart`, `/dashboard/cart`, and on the dashboard overview.
2. Sign in or create an account from the dashboard or checkout. If email confirmation is enabled in Supabase, confirm the email and sign in. Guest bag items merge into the account bag on sign-in.
3. Complete the delivery form and submit an order request. The server validates products, prices and stock, reserves stock, saves the order and clears the bag in one database transaction. Repeated submissions with the same checkout reference return the existing order.
4. Open **Your Orders** to see the order details and delivery timeline. **Order Updates** shows the saved customer-facing event history. Both refresh every 15 seconds while open.

Guest bags stay on the device. Signed-in bags sync to Supabase; failed saves display an error and a retry action on the dashboard. Account profile changes persist to the customer's profile.

## Fulfilment

Sign in at `/admin`, then open **Orders** or **Deliveries**. Select an order status, enter carrier details, a tracking number, an HTTPS tracking link, the latest location, an estimated date and an optional customer note.

Allowed progression: awaiting confirmation → preparing → on the route → out for delivery → delivered. Dispatch may also move directly to delivered. Pending/preparing orders can be cancelled. Cancellation releases reserved stock; dispatch consumes it once. Unpaid requests hold stock until staff dispatch or cancel them, so staff should review pending requests regularly.

No online payment is collected or represented as successful. Staff must arrange payment and confirm delivery charges separately before dispatch. Saved order totals initially represent the merchandise subtotal. Status updates do not verify payment. This feature provides staff-entered progress and optional carrier links, not live vehicle GPS or an automatic courier integration.

## Verification

From the repository root: `node supabase/tests/verify.mjs`.

This uses an isolated PostgreSQL-compatible test database, not the hosted project. It verifies row-level access, server pricing, idempotency, cart clearing, stock reservation, invalid transitions, customer tracking events and cancellation.

From `frontend`: `node node_modules/typescript/bin/tsc --noEmit`.

After applying the migration, verify with a customer and admin account: add a product, sign in, reload the bag, place a request, update delivery in admin, and confirm the customer sees the updates. Confirm a different customer cannot open the order.
