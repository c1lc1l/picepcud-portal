-- Public bucket for event banner images. Anyone can view; only admins can
-- upload, replace, or delete.

insert into storage.buckets (id, name, public)
values ('event-banners', 'event-banners', true)
on conflict (id) do update set public = true;

create policy "event_banners_insert_admin"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'event-banners'
  and public.is_admin(auth.uid())
);

create policy "event_banners_delete_admin"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'event-banners'
  and public.is_admin(auth.uid())
);
