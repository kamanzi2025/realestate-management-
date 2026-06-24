-- ============================================================
-- MIGRATION 03: Update maintenance categories
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Step 1: Drop the old CHECK constraint
ALTER TABLE public.maintenance_requests
  DROP CONSTRAINT IF EXISTS maintenance_requests_category_check;

-- Step 2: Rename existing data to match new naming
UPDATE public.maintenance_requests SET category = 'appliances'   WHERE category = 'appliance';
UPDATE public.maintenance_requests SET category = 'pest_control' WHERE category = 'pest';

-- Step 3: Add updated constraint with all 8 categories
ALTER TABLE public.maintenance_requests
  ADD CONSTRAINT maintenance_requests_category_check
  CHECK (category IN (
    'electrical',
    'plumbing',
    'appliances',
    'structural',
    'pest_control',
    'safety',
    'wifi',
    'other'
  ));
