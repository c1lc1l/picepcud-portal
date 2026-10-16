-- Officer portraits for the public directory. Photos are uploaded by admins
-- from /admin/officers, who must confirm the officer agreed to publication.

alter table public.officers
  add column photo_path        text,
  add column photo_consent_at  timestamptz;

-- Publication consent is recorded whenever a photo is set.
alter table public.officers
  add constraint officers_photo_needs_consent
  check (photo_path is null or photo_consent_at is not null);

-- Public bucket: portraits are shown on public pages. Object names are
-- random UUIDs, and the directory itself is gated by officer_roster.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'officer-photos',
  'officer-photos',
  true,
  2097152,
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "officer_photos_insert_admin"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'officer-photos' and public.is_admin(auth.uid()));

create policy "officer_photos_delete_admin"
on storage.objects
for delete
to authenticated
using (bucket_id = 'officer-photos' and public.is_admin(auth.uid()));
