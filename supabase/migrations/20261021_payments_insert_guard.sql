-- Close a self-approval hole in member payment submissions (QA-01).
--
-- `payments_insert_own` only checked `user_id = auth.uid()`. The submitPayment
-- server action always inserts status 'pending', but the anon key is public,
-- so a signed-in member could call the REST API directly and insert a row
-- that is already 'approved' (or carries fake admin notes / a backdated
-- timestamp), skipping officer review entirely.
--
-- Run in the Supabase SQL Editor (or `supabase db push`). Safe to re-run.

-- Members may only create pending payments with no officer notes.
drop policy if exists "payments_insert_own" on public.payments;

create policy "payments_insert_own"
on public.payments
for insert
to authenticated
with check (
  user_id = auth.uid()
  and status = 'pending'
  and admin_notes is null
);

-- Timestamps come from the server, not the client, for anyone but admins.
create or replace function public.payments_server_timestamps()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    new.created_at := now();
    new.updated_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists payments_server_timestamps on public.payments;

create trigger payments_server_timestamps
  before insert on public.payments
  for each row
  execute function public.payments_server_timestamps();

-- Receipt uploads: images only, 2 MB cap (the app compresses screenshots to
-- ~200 KB WebP before upload). The bucket previously accepted any file type
-- and size into a member's own folder.
update storage.buckets
set file_size_limit = 2097152,
    allowed_mime_types = array['image/webp', 'image/jpeg', 'image/png']
where id = 'gcash-receipts';
