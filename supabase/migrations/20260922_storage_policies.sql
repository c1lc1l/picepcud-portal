-- Private bucket for GCash proof-of-payment receipts.
-- Objects must be stored as {user_id}/<filename>.

insert into storage.buckets (id, name, public)
values ('gcash-receipts', 'gcash-receipts', false)
on conflict (id) do update set public = false;

-- Users can upload only into their own {user_id}/ folder.
create policy "receipts_insert_own_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'gcash-receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can read only objects in their own {user_id}/ folder.
create policy "receipts_select_own_folder"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'gcash-receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can read/download every receipt.
create policy "receipts_select_admin"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'gcash-receipts'
  and public.is_admin(auth.uid())
);
