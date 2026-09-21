-- PICE PCUD Portal — initial schema and RLS policies
-- Run via Supabase CLI: supabase db push
-- (see bottom of this file for full instructions)

create extension if not exists pgcrypto with schema extensions;

-- =========================================================
-- Enums
-- =========================================================

create type public.user_role as enum ('member', 'admin');
create type public.payment_status as enum ('pending', 'approved', 'rejected');

-- =========================================================
-- Tables
-- =========================================================

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  student_id  text not null unique,
  year_level  int not null check (year_level between 1 and 5),
  role        public.user_role not null default 'member',
  created_at  timestamptz not null default now()
);

create table public.events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text not null,
  event_date  timestamptz not null,
  location    text not null,
  banner_url  text,
  luma_url    text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.payments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  amount        numeric(10, 2) not null,
  reference_no  text not null,
  proof_url     text not null,
  status        public.payment_status not null default 'pending',
  admin_notes   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index payments_user_id_idx on public.payments(user_id);
create index payments_status_idx on public.payments(status);
create index events_is_active_idx on public.events(is_active);

-- =========================================================
-- Helpers
-- =========================================================

-- SECURITY DEFINER + fixed search_path so this can be called from RLS
-- policies on `profiles` itself without triggering infinite recursion
-- (a normal policy subquery against profiles would re-invoke RLS).
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role = 'admin'
  );
$$;

grant execute on function public.is_admin(uuid) to authenticated, anon;

-- Keeps payments.updated_at current on every update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger payments_set_updated_at
  before update on public.payments
  for each row
  execute function public.set_updated_at();

-- Non-admins may update their own profile, but never their own role.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin(auth.uid()) then
    raise exception 'Only admins can change a profile role';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role
  before update on public.profiles
  for each row
  execute function public.protect_profile_role();

-- =========================================================
-- Row-Level Security
-- =========================================================

alter table public.profiles enable row level security;
alter table public.events   enable row level security;
alter table public.payments enable row level security;

-- ---------------------------------------------------------
-- profiles
-- ---------------------------------------------------------

-- Users can read their own profile.
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

-- Admins can read all profiles.
create policy "profiles_select_admin"
on public.profiles
for select
to authenticated
using (public.is_admin(auth.uid()));

-- Users can update their own profile (role changes are blocked by the
-- protect_profile_role trigger above, regardless of this policy).
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Admins can update any profile (e.g. to promote/demote roles).
create policy "profiles_update_admin"
on public.profiles
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- ---------------------------------------------------------
-- events
-- ---------------------------------------------------------

-- Anyone (including unauthenticated visitors) can read active events.
create policy "events_select_active"
on public.events
for select
to anon, authenticated
using (is_active = true);

-- Admins can read all events, including inactive ones.
create policy "events_select_admin"
on public.events
for select
to authenticated
using (public.is_admin(auth.uid()));

-- Only admins can create, edit, or delete events.
create policy "events_insert_admin"
on public.events
for insert
to authenticated
with check (public.is_admin(auth.uid()));

create policy "events_update_admin"
on public.events
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "events_delete_admin"
on public.events
for delete
to authenticated
using (public.is_admin(auth.uid()));

-- ---------------------------------------------------------
-- payments
-- ---------------------------------------------------------

-- Users can read their own payments.
create policy "payments_select_own"
on public.payments
for select
to authenticated
using (user_id = auth.uid());

-- Admins can read all payments.
create policy "payments_select_admin"
on public.payments
for select
to authenticated
using (public.is_admin(auth.uid()));

-- Users can submit their own payments.
create policy "payments_insert_own"
on public.payments
for insert
to authenticated
with check (user_id = auth.uid());

-- Only admins can update payments (e.g. approve/reject, add notes).
create policy "payments_update_admin"
on public.payments
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- =========================================================
-- How to run this migration
-- =========================================================
--
-- Option A — Supabase CLI (recommended):
--   1. supabase link --project-ref <your-project-ref>
--   2. supabase db push
--   (this applies every unapplied file in supabase/migrations, in order)
--
-- Option B — Supabase Dashboard:
--   1. Open your project → SQL Editor → New query
--   2. Paste the full contents of this file and click "Run"
--
-- Option C — Local development:
--   supabase start
--   supabase db reset   -- applies all migrations to the local db
