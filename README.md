# Adire Teems

Online shop, customer accounts and order tracking, admin catalogue tools, and Paystack checkout.

## Project layout

- `frontend/`: Next.js website and application API routes.
- `backend/`: Python/FastAPI services.
- `supabase/`: database setup, migrations, and database tests.
- `docs/`: payment and authentication setup instructions.
- `scripts/`: catalogue imports and integration checks.
- `artifacts/catalogue-import/`: catalogue review data and prepared product images.

## Run the website

Install dependencies with `npm ci` from `frontend/`. Copy `frontend/.env.example` to `frontend/.env.local` and fill in the project values. Run `npm run dev` from `frontend/`.

Follow [Supabase setup](supabase/README.md) for the database and [backend instructions](backend/README.md) for the Python services. For a frontend deployment, set the deployment project's root directory to `frontend`.

## Required service configuration

- [Paystack checkout](docs/paystack-setup.md): database migration, server-side secret key, callback and webhook URLs.
- [Password recovery](docs/authentication-setup.md): allowed redirect URLs and Supabase SMTP configuration.

Environment files are intentionally excluded. Configure secrets in the deployment provider; never commit them. Update the temporary ngrok application URL to your deployed HTTPS URL when publishing the site. Imported product prices, sizes and inventory include demo values and require review before live sales.

## Checks

From the project root:

```sh
node --test frontend/tests/auth.test.cjs frontend/tests/paystack.test.cjs
```

Database tests require the test-only PGlite dependency described at the top of `supabase/tests/verify.mjs`. The opt-in `scripts/verify-auth-isolation.cjs` integration test creates and cleans up temporary Supabase accounts; it does not send email.
