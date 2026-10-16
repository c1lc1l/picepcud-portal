-- Enforce the @pcu.edu.ph account rule in the database (QA-12).
--
-- The app already validates the domain, but the anon key is public, so anyone
-- could call Supabase Auth's signUp directly with any address. This trigger
-- rejects new accounts and email changes outside pcu.edu.ph at the source.
--
-- Existing accounts are NOT affected (including any admin on another domain)
-- unless their email is changed. Run in the Supabase SQL Editor. Safe to re-run.

create or replace function public.enforce_pcu_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- New accounts, and changes to the confirmed address.
  if tg_op = 'INSERT' or new.email is distinct from old.email then
    if new.email is null
       or lower(split_part(new.email, '@', 2)) <> 'pcu.edu.ph' then
      raise exception 'Accounts must use a PCU email address (@pcu.edu.ph)'
        using errcode = 'check_violation';
    end if;
  end if;

  -- A requested (not yet confirmed) email change.
  if coalesce(new.email_change, '') <> ''
     and (tg_op = 'INSERT' or new.email_change is distinct from old.email_change)
     and lower(split_part(new.email_change, '@', 2)) <> 'pcu.edu.ph' then
    raise exception 'Accounts must use a PCU email address (@pcu.edu.ph)'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_pcu_email on auth.users;

create trigger enforce_pcu_email
  before insert or update of email, email_change on auth.users
  for each row
  execute function public.enforce_pcu_email();
