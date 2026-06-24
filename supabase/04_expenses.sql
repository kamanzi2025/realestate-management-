-- ============================================================
-- MIGRATION 04: Add expenses table
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE public.expenses (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id                       UUID REFERENCES public.units(id) ON DELETE SET NULL,
  category                      TEXT NOT NULL CHECK (category IN (
    'electrical', 'plumbing', 'appliances', 'structural',
    'pest_control', 'safety', 'wifi',
    'insurance', 'taxes', 'cleaning', 'building_maintenance', 'other'
  )),
  amount                        NUMERIC(10,2) NOT NULL,
  expense_date                  DATE NOT NULL,
  description                   TEXT NOT NULL,
  receipt_file_url              TEXT,
  linked_maintenance_request_id UUID REFERENCES public.maintenance_requests(id) ON DELETE SET NULL,
  created_by                    UUID NOT NULL REFERENCES public.profiles(id),
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON public.expenses (expense_date DESC);
CREATE INDEX ON public.expenses (unit_id);
CREATE INDEX ON public.expenses (linked_maintenance_request_id);

-- RLS — landlord only
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses: landlord full access"
  ON public.expenses FOR ALL
  USING  (public.is_landlord())
  WITH CHECK (public.is_landlord());

-- Storage bucket for expense receipts (landlord-only, private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('expense-receipts', 'expense-receipts', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "expense-receipts: landlord only"
  ON storage.objects FOR ALL
  USING  (bucket_id = 'expense-receipts' AND public.is_landlord())
  WITH CHECK (bucket_id = 'expense-receipts' AND public.is_landlord());
