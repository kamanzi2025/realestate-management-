-- ============================================================
-- APARTMENT MANAGER — DATABASE SCHEMA + RLS
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────

create table public.units (
  id            uuid primary key default gen_random_uuid(),
  label         text not null,
  bedroom_count int  not null check (bedroom_count in (1, 2)),
  monthly_rent  numeric(10,2) not null,
  status        text not null default 'vacant' check (status in ('occupied','vacant')),
  created_at    timestamptz not null default now()
);

create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null check (role in ('landlord','tenant')),
  full_name  text not null,
  phone      text,
  unit_id    uuid references public.units(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.leases (
  id             uuid primary key default gen_random_uuid(),
  unit_id        uuid not null references public.units(id) on delete cascade,
  tenant_id      uuid not null references public.profiles(id) on delete cascade,
  move_in_date   date not null,
  rent_due_day   int  not null check (rent_due_day between 1 and 31),
  monthly_rent   numeric(10,2) not null,
  deposit_amount numeric(10,2) not null default 0,
  lease_start    date not null,
  lease_end      date,
  status         text not null default 'active' check (status in ('active','ended')),
  created_at     timestamptz not null default now()
);

create table public.payments (
  id               uuid primary key default gen_random_uuid(),
  lease_id         uuid not null references public.leases(id) on delete cascade,
  tenant_id        uuid not null references public.profiles(id) on delete cascade,
  period_month     text not null,        -- format: "YYYY-MM"
  amount           numeric(10,2) not null,
  receipt_file_url text,
  submitted_at     timestamptz not null default now(),
  status           text not null default 'pending_review'
                   check (status in ('pending_review','confirmed','rejected')),
  reviewed_by      uuid references public.profiles(id),
  reviewed_at      timestamptz,
  landlord_notes   text,
  unique (lease_id, period_month)        -- one submission per month per lease
);

create table public.maintenance_requests (
  id               uuid primary key default gen_random_uuid(),
  unit_id          uuid not null references public.units(id) on delete cascade,
  tenant_id        uuid not null references public.profiles(id) on delete cascade,
  category         text not null check (category in ('electrical','plumbing','appliance','structural','pest','other')),
  description      text not null,
  photo_urls       text[] not null default '{}',
  urgency          text not null check (urgency in ('low','medium','high')),
  status           text not null default 'submitted'
                   check (status in ('submitted','acknowledged','in_progress','resolved')),
  landlord_comment text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.messages (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid references public.profiles(id) on delete cascade,  -- null = broadcast
  body         text not null,
  created_at   timestamptz not null default now(),
  read_at      timestamptz
);

create table public.move_out_notices (
  id                    uuid primary key default gen_random_uuid(),
  lease_id              uuid not null references public.leases(id) on delete cascade,
  tenant_id             uuid not null references public.profiles(id) on delete cascade,
  intended_move_out_date date not null,
  reason                text,
  status                text not null default 'submitted'
                        check (status in ('submitted','acknowledged')),
  created_at            timestamptz not null default now()
);

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text not null,
  link       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
create index on public.payments (tenant_id, period_month);
create index on public.payments (status);
create index on public.maintenance_requests (unit_id, status);
create index on public.maintenance_requests (tenant_id);
create index on public.messages (sender_id);
create index on public.messages (recipient_id);
create index on public.notifications (user_id, read_at);

-- ─────────────────────────────────────────────
-- TRIGGER: auto-update maintenance updated_at
-- ─────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger maintenance_set_updated_at
  before update on public.maintenance_requests
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────

alter table public.units                enable row level security;
alter table public.profiles             enable row level security;
alter table public.leases               enable row level security;
alter table public.payments             enable row level security;
alter table public.maintenance_requests enable row level security;
alter table public.messages             enable row level security;
alter table public.move_out_notices     enable row level security;
alter table public.notifications        enable row level security;

-- Helper: is the current user the landlord?
create or replace function public.is_landlord()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'landlord'
  );
$$;

-- Helper: get the current tenant's unit_id
create or replace function public.my_unit_id()
returns uuid language sql security definer stable as $$
  select unit_id from public.profiles where id = auth.uid();
$$;

-- ── units ──────────────────────────────────────
-- Landlord: full access. Tenants: read their own unit.
create policy "units: landlord full access"
  on public.units for all
  using (public.is_landlord())
  with check (public.is_landlord());

create policy "units: tenant reads own unit"
  on public.units for select
  using (id = public.my_unit_id());

-- ── profiles ──────────────────────────────────
-- Landlord: full access. Tenants: read/update own profile.
create policy "profiles: landlord full access"
  on public.profiles for all
  using (public.is_landlord())
  with check (public.is_landlord());

create policy "profiles: tenant reads own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles: tenant updates own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ── leases ────────────────────────────────────
create policy "leases: landlord full access"
  on public.leases for all
  using (public.is_landlord())
  with check (public.is_landlord());

create policy "leases: tenant reads own"
  on public.leases for select
  using (tenant_id = auth.uid());

-- ── payments ──────────────────────────────────
create policy "payments: landlord full access"
  on public.payments for all
  using (public.is_landlord())
  with check (public.is_landlord());

create policy "payments: tenant reads own"
  on public.payments for select
  using (tenant_id = auth.uid());

create policy "payments: tenant inserts own"
  on public.payments for insert
  with check (tenant_id = auth.uid());

create policy "payments: tenant updates own pending"
  on public.payments for update
  using (tenant_id = auth.uid() and status = 'pending_review')
  with check (tenant_id = auth.uid());

-- ── maintenance_requests ──────────────────────
create policy "maintenance: landlord full access"
  on public.maintenance_requests for all
  using (public.is_landlord())
  with check (public.is_landlord());

create policy "maintenance: tenant reads own"
  on public.maintenance_requests for select
  using (tenant_id = auth.uid());

create policy "maintenance: tenant inserts own"
  on public.maintenance_requests for insert
  with check (tenant_id = auth.uid() and unit_id = public.my_unit_id());

-- ── messages ──────────────────────────────────
-- Landlord: all. Tenants: see messages where they're sender or recipient (or broadcast).
create policy "messages: landlord full access"
  on public.messages for all
  using (public.is_landlord())
  with check (public.is_landlord());

create policy "messages: tenant reads own"
  on public.messages for select
  using (
    sender_id = auth.uid()
    or recipient_id = auth.uid()
    or recipient_id is null   -- broadcast
  );

create policy "messages: tenant inserts own"
  on public.messages for insert
  with check (sender_id = auth.uid());

create policy "messages: tenant marks read"
  on public.messages for update
  using (recipient_id = auth.uid() or (recipient_id is null and sender_id != auth.uid()))
  with check (recipient_id = auth.uid() or (recipient_id is null and sender_id != auth.uid()));

-- ── move_out_notices ──────────────────────────
create policy "move_out: landlord full access"
  on public.move_out_notices for all
  using (public.is_landlord())
  with check (public.is_landlord());

create policy "move_out: tenant reads own"
  on public.move_out_notices for select
  using (tenant_id = auth.uid());

create policy "move_out: tenant inserts own"
  on public.move_out_notices for insert
  with check (tenant_id = auth.uid());

-- ── notifications ─────────────────────────────
create policy "notifications: landlord full access"
  on public.notifications for all
  using (public.is_landlord())
  with check (public.is_landlord());

create policy "notifications: user reads own"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "notifications: user marks read"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- STORAGE BUCKETS
-- ─────────────────────────────────────────────
-- Run these separately in the SQL editor:

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('maintenance-photos', 'maintenance-photos', false)
on conflict (id) do nothing;

-- Storage policies for receipts bucket
create policy "receipts: tenant uploads own"
  on storage.objects for insert
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "receipts: tenant reads own"
  on storage.objects for select
  using (
    bucket_id = 'receipts'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_landlord()
    )
  );

create policy "receipts: landlord reads all"
  on storage.objects for select
  using (bucket_id = 'receipts' and public.is_landlord());

-- Storage policies for maintenance-photos bucket
create policy "maintenance-photos: tenant uploads own"
  on storage.objects for insert
  with check (
    bucket_id = 'maintenance-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "maintenance-photos: read by landlord or owner"
  on storage.objects for select
  using (
    bucket_id = 'maintenance-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_landlord()
    )
  );

-- ─────────────────────────────────────────────
-- SEED: The 4 units
-- ─────────────────────────────────────────────
insert into public.units (label, bedroom_count, monthly_rent, status) values
  ('Unit 1', 1, 1200.00, 'vacant'),
  ('Unit 2', 1, 1200.00, 'vacant'),
  ('Unit 3', 2, 1600.00, 'vacant'),
  ('Unit 4', 2, 1600.00, 'vacant');
