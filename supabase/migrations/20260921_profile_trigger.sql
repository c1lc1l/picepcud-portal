-- Auto-create a public.profiles row whenever a new auth user signs up.
-- Reads full_name, student_id, year_level from raw_user_meta_data
-- (set via supabase.auth.signUp({ options: { data: {...} } })).
-- Role is always 'member'; admins are promoted manually.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, student_id, year_level, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'student_id',
    (new.raw_user_meta_data ->> 'year_level')::int,
    'member'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
