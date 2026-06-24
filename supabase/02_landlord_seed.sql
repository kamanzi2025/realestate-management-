-- ============================================================
-- LANDLORD BOOTSTRAP — run AFTER creating the landlord's
-- Supabase Auth user in the dashboard (Authentication → Users).
-- Replace the UUID and name below.
-- ============================================================

-- Step 1: Get your user's UUID from the auth.users table:
--   SELECT id, email FROM auth.users;

-- Step 2: Insert the landlord profile (replace values):
INSERT INTO public.profiles (id, role, full_name, phone)
VALUES (
  'REPLACE-WITH-LANDLORD-AUTH-USER-UUID',
  'landlord',
  'Your Name',
  '+1 555 000 0000'  -- optional
);

-- That's it. The 4 units were seeded in 01_schema.sql.
-- Now log in with your landlord credentials and use the
-- "Add Tenant" button under Leases to create tenant accounts.
