-- Highlights carousel: past events and social media posts admins want to
-- showcase on the homepage, below Upcoming events. Distinct from the
-- featured_post singleton banner — this is an ordered, scrollable strip of
-- cards, each with its own image.

create table public.highlights (
  id            uuid primary key default gen_random_uuid(),
  caption       text not null,
  link_url      text,
  image_path    text not null,
  display_order int not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index highlights_display_order_idx on public.highlights (display_order, id);

create trigger highlights_set_updated_at
  before update on public.highlights
  for each row
  execute function public.set_updated_at();

alter table public.highlights enable row level security;

-- Anyone can read active highlights for the public carousel.
create policy "highlights_select_active"
on public.highlights
for select
to anon, authenticated
using (is_active = true);

-- Admins can read every highlight, including inactive ones.
create policy "highlights_select_admin"
on public.highlights
for select
to authenticated
using (public.is_admin(auth.uid()));

-- Only admins can create, edit, or delete highlights.
create policy "highlights_insert_admin"
on public.highlights
for insert
to authenticated
with check (public.is_admin(auth.uid()));

create policy "highlights_update_admin"
on public.highlights
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "highlights_delete_admin"
on public.highlights
for delete
to authenticated
using (public.is_admin(auth.uid()));

-- Public bucket for highlight images. Object names are random UUIDs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'highlight-photos',
  'highlight-photos',
  true,
  2097152,
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "highlight_photos_insert_admin"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'highlight-photos' and public.is_admin(auth.uid()));

create policy "highlight_photos_delete_admin"
on storage.objects
for delete
to authenticated
using (bucket_id = 'highlight-photos' and public.is_admin(auth.uid()));
