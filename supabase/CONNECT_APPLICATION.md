# Connect the updated application

The application now reads products and Journal posts from Supabase. Admin login
uses Supabase email/password authentication and the `profiles.role` column.
Products, posts, settings, contacts and new images no longer use local JSON files.

## Required hosted migration

Run **`04_application_integration.sql` once** in the same Supabase project's SQL
Editor, after the original setup. Do not rerun `01_setup.sql`.

This adds product style/SKU fields, contact notes and notification tracking, and
transactional RPCs for catalogue saves and contact submission. Existing data is
preserved. The application cannot save these records until this migration runs.

Check installation with:

```sql
select version from adire_private.schema_version
where version = '20260922_01';
```

## Environment

Next.js gives `.env.local` precedence over `.env`. Configure the same project in
`frontend/.env.local` and `backend/.env`. Both the new and legacy variable names
are supported; when both exist, the new names take precedence.

Frontend:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Legacy aliases: `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`.
The secret is used only in server code for contact intake/notification tracking
and authorized media downloads. Admin writes use the signed-in user's session
and database role policies, not the secret key.

Backend:

```dotenv
SUPABASE_URL=https://PROJECT.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
DEBUG=false
```

`SUPABASE_SERVICE_ROLE_KEY` remains an alias. Preserve other backend variables.
The Python dependencies have been updated to support the newer keys. For a new
environment, install `backend/requirements.txt` before starting it.

## Sign in and verify

1. Restart development servers after environment changes.
2. Open `/admin`. Sign in using the email/password of the Supabase Auth account
   promoted by `02_first_admin.sql`. The old shared admin password is unused.
3. Create a draft product with an existing category, explicit currency and sizes.
4. Upload an image and save. Confirm the product, variants and image path in the
   database. Draft image previews require an authenticated admin.
5. In Inventory, select the size/colour and location. Apply a positive quantity
   adjustment with a reason. Check `inventory` and `inventory_logs`.
6. Publish the product and verify it in the storefront while signed out. Public
   APIs return size availability, never exact stock counts.
7. Create and publish a Journal post. Future-dated posts remain private.
8. Submit a contact message and check Admin > Messages. Status, notes and email
   notification results persist in `contact_messages`. Email delivery still
   requires the existing Resend environment settings.
9. Sign out and verify that admin writes/uploads are denied. Only Super Admin can
   change store settings; Admin can manage catalogue, stock and messages.

## Storage and existing data

New uploads are stored in the private `draft-media` bucket. Database rows retain
the bucket/path, not expiring signed URLs. `/api/media?path=...` checks whether the
image belongs to published content or the requester is an admin before serving
it. Responses are not cached, so unpublishing immediately removes public access.
An image shared with another published record remains public through that record.

Existing `/images/...`, HTTPS images and the old `/api/images/...` files remain
readable for compatibility. No local files were deleted or automatically imported.
Importing `.store-data/store.json` and its images remains a separate migration;
preserve source currencies and allocate stock by real size/location.

Deleting a catalogue item in admin archives it, preserving order and inventory
references. Removing a size with stock is rejected. Newly created sizes start
with zero stock; product editing never duplicates quantities across sizes.

The old unauthenticated Python JSON management routers are no longer mounted.
Use the authenticated Next.js admin APIs. The Python catalogue API now filters
active products, uses `product_availability`, and reads unreserved quantities from
`inventory` only for internal stock checks.

Guest carts and the exchange-rate cache remain local. Checkout/payment processing,
customer dashboard authentication, and importing local content are outside this
integration. Cart availability is advisory; payment checkout still needs a trusted
stock reservation transaction.

## Validation

```powershell
node supabase/tests/verify.mjs
cd frontend
npm.cmd run build
cd ../backend
../.venv/Scripts/python.exe -m pytest tests/test_supabase_integration.py -q
```

SQL tests run in PGlite with managed Auth/Storage test doubles. Backend tests use
the real SDK with mocked HTTP responses; neither modifies the hosted database.
