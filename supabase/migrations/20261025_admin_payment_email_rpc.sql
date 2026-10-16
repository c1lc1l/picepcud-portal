-- Look up the email for one payment's member (QA-19).
--
-- Approving a payment used to load every approved payment through
-- admin_list_payments just to find one address, which slows down as the
-- table grows. The app calls this when it exists and falls back to the old
-- lookup otherwise, so this can be applied at any time.
--
-- Run in the Supabase SQL Editor. Safe to re-run.

create or replace function public.admin_payment_email(p_payment_id uuid)
returns text
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_email text;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only admins can read member emails';
  end if;

  select u.email::text into v_email
  from public.payments p
  join auth.users u on u.id = p.user_id
  where p.id = p_payment_id;

  return v_email;
end;
$$;

revoke execute on function public.admin_payment_email(uuid) from public, anon;
grant execute on function public.admin_payment_email(uuid) to authenticated;
