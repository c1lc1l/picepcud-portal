-- Admin-editable chapter settings: the GCash receiving account (with its QR
-- image) and the public officer roster.

-- =========================================================
-- GCash receiving account (single row)
-- =========================================================

create table public.gcash_settings (
  id              boolean primary key default true check (id),
  account_name    text not null default '',
  account_role    text not null default 'Treasurer',
  account_number  text not null default '',
  -- Object name in the private `gcash-qr` bucket; null until uploaded.
  qr_path         text,
  updated_at      timestamptz not null default now(),
  updated_by      uuid references auth.users(id) on delete set null
);

-- Details are entered by an admin in /admin/settings, not committed here.
insert into public.gcash_settings (id) values (true);

create trigger gcash_settings_set_updated_at
  before update on public.gcash_settings
  for each row
  execute function public.set_updated_at();

alter table public.gcash_settings enable row level security;

-- Any signed-in member needs these to pay their dues.
create policy "gcash_settings_select_authenticated"
on public.gcash_settings
for select
to authenticated
using (true);

create policy "gcash_settings_update_admin"
on public.gcash_settings
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Private bucket for the QR image: members can view, admins manage.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gcash-qr',
  'gcash-qr',
  false,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "gcash_qr_select_authenticated"
on storage.objects
for select
to authenticated
using (bucket_id = 'gcash-qr');

create policy "gcash_qr_insert_admin"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'gcash-qr' and public.is_admin(auth.uid()));

create policy "gcash_qr_delete_admin"
on storage.objects
for delete
to authenticated
using (bucket_id = 'gcash-qr' and public.is_admin(auth.uid()));

-- =========================================================
-- Officer roster
-- =========================================================

create type public.officer_group as enum ('executive', 'committee');

create table public.officers (
  id             uuid primary key default gen_random_uuid(),
  display_name   text not null check (length(trim(display_name)) > 0),
  title          text not null check (length(trim(title)) > 0),
  officer_group  public.officer_group not null default 'executive',
  display_order  int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index officers_order_idx
  on public.officers (officer_group, display_order, id);

create trigger officers_set_updated_at
  before update on public.officers
  for each row
  execute function public.set_updated_at();

-- Term and publication state for the roster (single row). Publishing
-- requires a complete term window.
create table public.officer_roster (
  id            boolean primary key default true check (id),
  term_label    text not null default '',
  term_start    timestamptz,
  term_end      timestamptz,
  is_published  boolean not null default false,
  published_at  timestamptz,
  published_by  uuid references auth.users(id) on delete set null,
  updated_at    timestamptz not null default now(),
  constraint officer_roster_publishable check (
    not is_published
    or (
      length(trim(term_label)) > 0
      and term_start is not null
      and term_end is not null
      and term_start < term_end
    )
  )
);

insert into public.officer_roster (id) values (true);

create trigger officer_roster_set_updated_at
  before update on public.officer_roster
  for each row
  execute function public.set_updated_at();

-- True while the roster is published and inside its term window.
create or replace function public.officer_roster_is_live()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.officer_roster
    where is_published and now() between term_start and term_end
  );
$$;

grant execute on function public.officer_roster_is_live() to authenticated, anon;

alter table public.officers enable row level security;
alter table public.officer_roster enable row level security;

-- The public sees officers only while the roster is live; admins always.
create policy "officers_select_live_or_admin"
on public.officers
for select
to anon, authenticated
using (public.officer_roster_is_live() or public.is_admin(auth.uid()));

create policy "officers_insert_admin"
on public.officers
for insert
to authenticated
with check (public.is_admin(auth.uid()));

create policy "officers_update_admin"
on public.officers
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "officers_delete_admin"
on public.officers
for delete
to authenticated
using (public.is_admin(auth.uid()));

-- Term label and publication state are not sensitive.
create policy "officer_roster_select_all"
on public.officer_roster
for select
to anon, authenticated
using (true);

create policy "officer_roster_update_admin"
on public.officer_roster
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Initial executive board (names and titles only; contact details are
-- intentionally not stored). Unpublished until an admin sets the term and
-- publishes from /admin/officers.
insert into public.officers (display_name, title, officer_group, display_order)
values
  ('John Paul M. Fulgar', 'President', 'executive', 1),
  ('Kryzzie F. Villamor', 'Vice President Internal', 'executive', 2),
  ('Kevin Edward M. Pascual', 'Vice President External', 'executive', 3),
  ('Mikaia D.V. Sarmiento', 'Secretary', 'executive', 4),
  ('Jaiza Jhoy D. Delos Santos', 'Assistant Secretary', 'executive', 5),
  ('Queen Honeylette R. Sarmiento', 'Treasurer', 'executive', 6),
  ('Mark Denzel D. Soriano', 'Auditor', 'executive', 7),
  ('Lee Janine A. Garganera', 'Public Relations Officer', 'executive', 8),
  ('Marc Angelo P. Tamayo', 'Chairperson for Membership Affairs', 'committee', 1),
  ('John Michael P. De La Peña', 'Chairperson on Ways and Means', 'committee', 2),
  ('Earl John H. Espineli', 'Chairperson for Education', 'committee', 3),
  ('Jeger L. Bucod', 'Chairperson for Sports and Recreation', 'committee', 4),
  ('Ella Jean L. Prayon', 'Creatives Head', 'committee', 5),
  ('Kheazel P. Feguracion', 'Logistics Head', 'committee', 6);
