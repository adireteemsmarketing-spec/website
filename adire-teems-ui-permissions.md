# UI Permissions, Scoping & Default Test Accounts

This file translates the `adire-teems-roles-permissions.md` rules into actionable UI visibility and quick test accounts (default passwords) for local/dev testing.

---

## Permission tiers (summary)

- `super_admin` — full system control; can manage Admins and system settings
- `admin` — operational control across all locations; cannot change system credentials
- `sales_rep` — location-scoped; only sees/orders/inventory for their `location_id`
- `user` — buyer/customer; only sees their own account and orders

## UI mapping — what each role sees/can click

- **Global navigation**
  - Super Admin: full nav including `System`, `Payments`, `Users`, `Reporting`, `Admin` areas
  - Admin: `Products`, `Orders`, `Inventory`, `Customers`, `Reporting` (no System/Payments)
  - Sales Rep: `Orders (location)`, `Inventory (location)`, `Customers (location)`, `Sales Summary` (basic)
  - User: `Shop`, `Cart`, `Orders (own)`, `Profile`

- **Product catalogue pages**
  - Edit/create product button: visible to `admin`, `super_admin` only
  - Publish/archive product: `admin`, `super_admin` only

- **Inventory pages**
  - Full location list & adjustments: `admin`, `super_admin`
  - Location-scoped quantities & adjustments: `sales_rep` (only their location)
  - Adjustment audit log link: `admin`, `super_admin` (view-only for sales rep)

- **Orders listing**
  - Platform-wide orders view: `admin`, `super_admin`
  - Location orders view: `sales_rep` (pre-filtered by their `location_id`)
  - Customer order details: `sales_rep` only if order.location_id = their location
  - Cancel/Refund UI: actionable by `admin`/`super_admin` only; `sales_rep` can create requests

- **Customers & Profiles**
  - Export customer data: `super_admin` only
  - Edit customer basic info (for orders): `admin`, `super_admin`, `sales_rep` (location linked customers)

- **AI Assistant & Logs**
  - AI assistant for shopping: all roles including `user`
  - AI conversation logs (global): `admin`, `super_admin`
  - User's own conversation history UI: visible to that `user`

## UI implementation notes

- Add a central guard component (server-side when possible) that reads `profiles.role` and `profiles.location_id`.
- Routes under `/admin/*` should be server-protected: deny access unless `role in ('admin','super_admin')`.
- For pages where `sales_rep` sees a list, always filter server-side by `location_id` using the same check used in RLS.
- For client-side UI, feature-flag buttons (edit, delete) using role checks, but always enforce server RLS/policies.

## Default test accounts (for local/dev testing)

Use these test accounts only in development. Replace passwords and delete or rotate accounts before any staging/production use.

- Super Admin
  - email: superadmin@local.test
  - role: super_admin
  - default password: SuperAdmin@123

- Admin
  - email: admin@local.test
  - role: admin
  - default password: Admin@1234

- Sales Rep A (Location: Lagos)
  - email: sales.lagos@local.test
  - role: sales_rep
  - assigned location_id: 1
  - default password: SalesLagos@1

- Sales Rep B (Location: Abuja)
  - email: sales.abuja@local.test
  - role: sales_rep
  - assigned location_id: 2
  - default password: SalesAbuja@1

- Test User (buyer)
  - email: test.user@local.test
  - role: user
  - default password: Buyer@123

### How to provision these accounts locally

- Use Supabase CLI / Admin API to create users and set a matching `profiles` record linking `user_id` to the stored `profiles.user_id`, `role` and `location_id`.
- Optionally, insert seed rows into `profiles` (example):

  INSERT INTO public.profiles (user_id, email, role, location_id, full_name)
  VALUES
    ('00000000-0000-0000-0000-000000000001','superadmin@local.test','super_admin',NULL,'Super Admin');

- For auth passwords, it's easier to use Supabase Admin API or the `supabase` CLI to create users with the plaintext password above. Do not store plaintext passwords in your repo.

## Quick checklist before production

- [ ] Remove/rotate default test passwords
- [ ] Enforce JWT claim for `role` if you plan to trust token claims server-side
- [ ] Ensure RLS policies (see `backend/db/rls_policies.sql`) are enabled for each protected table
