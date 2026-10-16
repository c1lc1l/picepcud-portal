-- One live submission per GCash reference number (QA-13).
--
-- A reference can't appear on two pending/approved payments. Rejected
-- payments don't count, so a member can resubmit a corrected receipt with the
-- same reference after a rejection. The app shows a friendly message when
-- this index rejects a duplicate.
--
-- If existing data already has duplicates, this stops with a message instead
-- of half-applying. Find them with:
--
--   select reference_no, count(*), array_agg(id) as payment_ids
--   from public.payments
--   where status in ('pending', 'approved')
--   group by reference_no
--   having count(*) > 1;
--
-- Reject the extra rows in Admin → Payments, then run this file again.
-- Run in the Supabase SQL Editor. Safe to re-run.

do $$
declare
  dup_count int;
begin
  select count(*) into dup_count
  from (
    select reference_no
    from public.payments
    where status in ('pending', 'approved')
    group by reference_no
    having count(*) > 1
  ) d;

  if dup_count > 0 then
    raise exception
      '% GCash reference number(s) are on more than one pending/approved payment. See the query at the top of this file, reject the duplicates, then re-run.',
      dup_count;
  end if;
end;
$$;

create unique index if not exists payments_reference_no_active_key
  on public.payments (reference_no)
  where status in ('pending', 'approved');
