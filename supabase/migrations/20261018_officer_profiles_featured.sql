-- Officer profile details (shown in the public profile pop-up) and an
-- admin-editable featured post on the homepage.

-- =========================================================
-- Officer profiles
-- =========================================================

-- All fields are optional and public once the roster is published. Only
-- add contact details an officer has agreed to share (e.g. a school email).
alter table public.officers
  add column motto          text check (motto is null or length(motto) <= 200),
  add column contact_email  text check (contact_email is null or length(contact_email) <= 254),
  -- [{ "label": "LinkedIn", "url": "https://..." }, ...]
  add column links          jsonb not null default '[]'::jsonb
    check (jsonb_typeof(links) = 'array' and jsonb_array_length(links) <= 5);

-- =========================================================
-- Featured post (single row)
-- =========================================================

create table public.featured_post (
  id          boolean primary key default true check (id),
  is_visible  boolean not null default true,
  eyebrow     text not null default '',
  title       text not null default '',
  body        text not null default '',
  -- Site-relative path (bundled default) or a public `site-media` URL.
  image_url   text,
  image_alt   text not null default '',
  link_url    text,
  link_label  text not null default 'View post',
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id) on delete set null
);

create trigger featured_post_set_updated_at
  before update on public.featured_post
  for each row
  execute function public.set_updated_at();

alter table public.featured_post enable row level security;

create policy "featured_post_select_visible_or_admin"
on public.featured_post
for select
to anon, authenticated
using (is_visible or public.is_admin(auth.uid()));

create policy "featured_post_update_admin"
on public.featured_post
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

insert into public.featured_post
  (id, eyebrow, title, body, image_url, image_alt, link_url, link_label)
values (
  true,
  'Forged for brilliance, study smart.',
  'PICEKET: Pocket-Sized CE Formula Guide',
  E'Say goodbye to messy formulas and hello to crystal-clear precision. The ultimate academic treasure to carry in your pocket — and it''s free for all 1st year Civil Engineering students.\n\nLimited release: an initial run of 50 copies.\n\nHow to claim: like and follow the official PICE PCU-D SC Facebook page, then show proof of following to your class representative to claim your copy.',
  '/featured/piceket.webp',
  'PICEKET Pocket Formula Guide poster for 1st year civil engineering students',
  'https://www.facebook.com/share/p/1JTr8ntNts/',
  'View post on Facebook'
);

-- Public bucket for site imagery managed by admins (featured post images).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media',
  'site-media',
  true,
  2097152,
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "site_media_insert_admin"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'site-media' and public.is_admin(auth.uid()));

create policy "site_media_delete_admin"
on storage.objects
for delete
to authenticated
using (bucket_id = 'site-media' and public.is_admin(auth.uid()));
