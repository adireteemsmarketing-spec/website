# Adire Teems Supabase setup

## Run in this order

1. Create a **new Supabase project** and keep its database password in your password manager.
2. Open **SQL Editor → New query**, paste the entire `01_setup.sql`, and run it once. It uses one transaction and intentionally refuses to overwrite an existing schema. Do not run the old `backend/db/rls_policies.sql` alongside it.
3. Create your owner account through **Authentication → Users** or a real signup flow. Edit the email placeholder in `02_first_admin.sql` and run that script. This assigns `super_admin` without trusting editable signup metadata.
4. Configure Auth's Site URL and allowed redirect URLs for your local development URL and eventual HTTPS domain. Configure email delivery and email confirmation. Enable any desired OAuth providers separately.
5. Copy the project URL and API keys into your server environment. Never put a secret/service-role key in a `NEXT_PUBLIC_` variable or browser code.
6. Run `03_verify_setup.sql` in SQL Editor. It checks installed objects, RLS, critical grants and media bucket privacy. Review policies in the dashboard before importing live data.

**The application integration is implemented.** After the initial setup, run
`04_application_integration.sql` once and follow [Connect the application](CONNECT_APPLICATION.md).
The updated application uses Supabase for catalogue, admin Auth, contacts, settings
and new uploads. Existing `.store-data` content is not imported automatically.

## Environment mapping for the existing code

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3012
```

The current code expects the legacy anon/service-role environment names. Supabase also offers publishable/secret keys; choose supported keys when updating the clients, and keep the secret exclusively on the server. Payment providers and email/AI providers are configured separately in server environment variables, not in database rows. A service-role client bypasses RLS: it is **not** a restricted read-only AI client. Give the AI public read functions or purpose-built restricted endpoints instead.

## Included modules

- Auth profiles; `super_admin`, `admin`, location-scoped `sales_rep`, and customer `user` roles.
- Hierarchical categories; fabric/occasion collections; typed product tags; product variants, images, search document and SEO fields.
- Location/variant inventory, reservations and stock adjustment logs.
- Customer addresses, measurements, carts and wish lists.
- Orders, immutable item snapshots, payments, deduplicated webhook events, shipments, returns and refunds.
- Custom requests, inspiration files, consultations and versioned quotations.
- Journal categories/tags/posts, publication dates, SEO fields, site pages and homepage content.
- Reviews, newsletter consent records, contact messages, notifications, AI history and audit records.
- Six media buckets with separate public and private access rules.

`01_setup.sql` seeds the Women/Men/Accessories hierarchy from your brief, fabric/occasion/editorial collections, colour/style/fit tags and unpublished policy pages. It does not seed pretend products, blog articles, stock or shipping prices. Confirm the spelling **Milkado** from the brief before publishing that collection. Kids subcategories can be defined when their product range is confirmed.

## Access design

- Signed-out users read published catalogue/journal/site content, and get only **in-stock/out-of-stock** from `product_availability`. Exact inventory is staff-only.
- Customers access their own carts, addresses, measurements, order history and conversations. They cannot set an order as paid, change prices or approve their own returns/reviews.
- Admins manage the catalogue and Journal across locations. Sales reps read orders and stock only for their assigned location and use the logged adjustment RPC.
- Only Super Admin manages system settings. `assign_staff_role` lets Admin assign/remove Sales Rep roles without elevating anyone to Admin.
- Profile updates use column grants: customers cannot write `role`, `location_id`, email or identity fields. Sync authenticated email changes through a trusted server workflow.
- Anonymous review queries must select the explicitly granted public columns, not `select *`; customer UUIDs are omitted from anonymous access.
- Financial records, delivery transitions, reservations, quotations, contact/newsletter submissions and AI writes deliberately require trusted server endpoints. Their database tables alone do not implement those workflows.

## Stock and checkout contract

```sql
-- From a signed-in staff session; IDs come from the catalogue/location tables.
select public.adjust_inventory(VARIANT_UUID, LOCATION_UUID, 10, 'Opening stock count');
-- Public lookup (no exact counts).
select * from public.product_availability(PRODUCT_UUID);
```

These examples require quoted UUID values in place of the uppercase placeholders. `adjust_inventory` is atomic and logs every manual adjustment. Do not write inventory directly from a browser. The service backend must also log its inventory changes.

Implement checkout as a trusted **database transaction**: validate prices/currency/stock server-side, lock inventory in a deterministic order, create order and item snapshots, and hold reservations together. On a signature-verified payment webhook, claim the unique provider event, check reference/amount/currency, consume the held stock, record the payment and update the order atomically. Release expired or cancelled reservations through a scheduled server job. The table constraints do not perform those cross-table state transitions for you. Do not mark paid based on a browser redirect.

Guest carts can remain local. Guest checkout, custom requests and contact forms require rate-limited server endpoints; do not grant anonymous access to all customer records. Guest order tracking must verify a private session/token rather than expose predictable order numbers.

## Local data migration mapping

| Local field | Supabase target |
|---|---|
| Product `id` | Keep as `products.legacy_id`; generate new UUID primary key |
| `price`, `description` | `base_price`, `description_short` / `description_long` |
| `status: published` | `products.status: active` |
| `sizes` | One `product_variants` record per real size/colour with a unique SKU |
| Product-wide `stock` | Allocate actual counts to variant/location inventory; never copy the full total to each size |
| `image` | Upload to Storage and save `product_images.storage_path` |
| Post `category` | Resolve/create `blog_categories`, use its UUID |
| Post `date` | `published_at` as a timestamp, with an explicitly chosen timezone |
| Post `content` | `content`, with `content_format: plain` for existing articles |
| Post `image` | Storage path in `featured_image` |

Local sample prices currently use **USD**, while this database defaults new products to **NGN**. Preserve USD explicitly on imported samples until real prices/currency are confirmed. Do not relabel dollar amounts as naira or invent an exchange conversion.

The old FastAPI schema expects `product_variants.stock_qty`. This setup intentionally stores quantities in private `inventory`; update that adapter to use availability for customers and authorised inventory queries for staff. Profile roles also replace older `customer/staff` literals with `user/sales_rep/admin/super_admin`.

## Media

Public `product-images`, `journal-images`, and `site-assets` are suitable only for public content. A draft database record does **not** make a public bucket file private. Use `draft-media` until publishing. The private `custom-inspiration` and `avatars` buckets use paths beginning with the owner's Auth UUID, e.g. `USER_UUID/random-file.webp`; use authenticated downloads or short-lived signed URLs.

Image MIME and size restrictions are configured. Application upload handlers must still validate files. Do not store payment secrets or card numbers in Storage, orders, AI logs or `store_settings`.

## Further integration required

The admin Auth UI, catalogue adapters, contacts and Storage integration are implemented; see CONNECT_APPLICATION.md. Staff management UI, data import, SEO sitemap/schema generation, transactional checkout/refunds, delivery integrations, email, payments, scheduled jobs and backups still need implementation/configuration. Data retention/deletion policy should be agreed before collecting live customer records.

## Validation performed

`tests/verify.mjs` executes the entire SQL using a local PGlite PostgreSQL engine and minimal test doubles for Supabase's managed Auth/Storage objects. It exercises role escalation denial, profile/customer isolation, location-scoped inventory and orders, logged adjustments, negative stock rejection, draft/scheduled post visibility and private file ownership. It does not connect to your hosted project, test Supabase Auth email delivery, or exercise actual Storage uploads. Run the hosted verification and integration tests after connecting your project.

To repeat locally:

```powershell
npm.cmd install --prefix supabase/tests/runtime --no-audit --no-fund @electric-sql/pglite
node supabase/tests/verify.mjs
```

Reference documentation:

- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/database/postgres/column-level-security
- https://supabase.com/docs/guides/auth/managing-user-data
- https://supabase.com/docs/guides/storage/security/access-control
