-- Members may edit their own profile (decision on QA-11, 2026-10-17): the
-- existing `profiles_update_own` policy stays, and the dashboard now has an
-- "Edit" form for name, student ID and year level. These guards keep that
-- self-service safe:
--   * role changes stay blocked by the existing protect_profile_role trigger;
--   * created_at (the registration date in the roster export) can't be
--     rewritten by members;
--   * names and student IDs can't be blank or oversized (same limits as the
--     app's forms). NOT VALID: existing rows aren't re-checked, new writes are.
--
-- Run in the Supabase SQL Editor. Safe to re-run.

create or replace function public.keep_profile_created_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_keep_created_at on public.profiles;

create trigger profiles_keep_created_at
  before update on public.profiles
  for each row
  execute function public.keep_profile_created_at();

alter table public.profiles
  drop constraint if exists profiles_full_name_length,
  drop constraint if exists profiles_student_id_length;

alter table public.profiles
  add constraint profiles_full_name_length
    check (length(trim(full_name)) between 2 and 120) not valid,
  add constraint profiles_student_id_length
    check (length(trim(student_id)) between 1 and 40) not valid;
