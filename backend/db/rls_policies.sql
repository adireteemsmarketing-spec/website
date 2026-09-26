-- Supabase/Postgres Row Level Security policies for Adire Teems
-- Generated from adire-teems-roles-permissions.md guidance

-- NOTE: adapt table/column names if they differ in your schema.

-- Enable RLS on tables (run once per table)
-- ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- ORDERS: who can see or modify orders
-- Super Admin / Admin: full access
CREATE POLICY orders_admins_full ON public.orders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role IN ('admin','super_admin')
    )
  );

-- Sales Rep: scoped to their assigned location
CREATE POLICY orders_salesrep_location ON public.orders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'sales_rep' AND p.location_id = public.orders.location_id
    )
  );

-- User (buyer): can only access their own orders (customer_id matches auth.uid())
CREATE POLICY orders_users_own ON public.orders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'user' AND public.orders.customer_id = auth.uid()
    )
  );

-- INVENTORY: view/adjust rules
CREATE POLICY inventory_admins_full ON public.inventory
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role IN ('admin','super_admin')
    )
  );

CREATE POLICY inventory_salesrep_own_location ON public.inventory
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'sales_rep' AND p.location_id = public.inventory.location_id
    )
  );

-- PRODUCTS: catalogue edits allowed only for Admin / Super Admin
CREATE POLICY products_admins_edit ON public.products
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role IN ('admin','super_admin')
    )
  );

-- PROFILES: users can view/edit their own profile; staff management restricted
CREATE POLICY profiles_self_access ON public.profiles
  FOR ALL
  USING (
    user_id = auth.uid()
  );

-- STAFF CREATION / ROLE CHANGES: allow only Super Admin to create/modify staff roles
-- Example policy for restricting updates to role/location columns
CREATE POLICY profiles_superadmin_manage_roles ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'super_admin'
    )
  );

-- AI CONVERSATION LOGS: Admins and Super Admins can view; users can view their own
-- Assumes a table `ai_conversations` with `user_id` column
CREATE POLICY ai_conv_admins_full ON public.ai_conversations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role IN ('admin','super_admin')
    )
  );

CREATE POLICY ai_conv_users_own ON public.ai_conversations
  FOR SELECT
  USING (user_id = auth.uid());

-- Notes & reminders:
-- 1) After creating policies, test each role with a session token (jwt) that has the
--    expected `auth.uid()` and, if used, custom claims. Many Supabase setups store
--    role in `profiles.role` — this SQL assumes that pattern.
-- 2) If you use JWT custom claims for role (recommended for performance), adapt
--    policies to read `current_setting('jwt.claims.role')` or `auth.jwt()` accordingly.
-- 3) Be careful with `FOR ALL` policies; you may prefer separate policies per command
--    (SELECT, INSERT, UPDATE, DELETE) to tighten `WITH CHECK` rules for INSERT/UPDATE.
