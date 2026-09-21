-- Admin payment listing joined with profiles and auth.users.
-- Email lives in auth.users (not exposed to the API), so it is surfaced
-- through a SECURITY DEFINER function that only admins may call.

create or replace function public.admin_list_payments(p_status public.payment_status default null)
returns table (
  id            uuid,
  user_id       uuid,
  full_name     text,
  student_id    text,
  email         text,
  reference_no  text,
  amount        numeric,
  status        public.payment_status,
  proof_url     text,
  created_at    timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only admins can list payments';
  end if;

  return query
  select
    p.id,
    p.user_id,
    pr.full_name,
    pr.student_id,
    u.email::text,
    p.reference_no,
    p.amount,
    p.status,
    p.proof_url,
    p.created_at
  from public.payments p
  join public.profiles pr on pr.id = p.user_id
  join auth.users u on u.id = p.user_id
  where p_status is null or p.status = p_status
  order by p.created_at desc;
end;
$$;

revoke execute on function public.admin_list_payments(public.payment_status) from public, anon;
grant execute on function public.admin_list_payments(public.payment_status) to authenticated;
