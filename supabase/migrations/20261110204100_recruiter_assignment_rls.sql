begin;

do $migration$
begin
  if to_regclass('public.recruiters') is null
    or to_regclass('public.profiles') is null then
    raise exception 'Expected public.recruiters and public.profiles tables were not found; no changes were applied.';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'recruiters'
      and column_name = 'user_id'
  ) or not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'recruiters'
      and column_name = 'company_id'
  ) or not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'id'
  ) or not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'role'
  ) or not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'full_name'
  ) or not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'email'
  ) then
    raise exception 'Expected recruiter assignment columns were not found; no changes were applied.';
  end if;
end;
$migration$;

alter table public.recruiters enable row level security;
grant select, insert, update on public.recruiters to authenticated;

create or replace function public.create_profile_for_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ),
    new.email,
    'student'
  )
  on conflict (id) do nothing;

  return new;
end;
$function$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
  after insert on auth.users
  for each row
  execute function public.create_profile_for_new_auth_user();

create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if auth.uid() is not null then
    if tg_op = 'UPDATE'
      and new.role is distinct from old.role then
      raise exception 'You cannot change your own role';
    end if;

    if tg_op = 'INSERT'
      and new.id = auth.uid()
      and (new.role is null or new.role not in ('student', 'recruiter')) then
      raise exception 'Public sign-up can only create Student or Recruiter profiles';
    end if;
  end if;

  return new;
end;
$function$;

drop trigger if exists prevent_profile_role_change on public.profiles;
create trigger prevent_profile_role_change
  before insert or update on public.profiles
  for each row
  execute function public.prevent_profile_role_change();

alter function public.create_profile_for_new_auth_user() owner to postgres;
alter function public.prevent_profile_role_change() owner to postgres;
revoke all on function public.create_profile_for_new_auth_user()
  from public, anon, authenticated;
revoke all on function public.prevent_profile_role_change()
  from public, anon, authenticated;

drop policy if exists "Admins can manage recruiters" on public.recruiters;
drop policy if exists "Recruiters can view their own assignment" on public.recruiters;
drop policy if exists "admins manage recruiter assignments" on public.recruiters;
drop policy if exists "recruiter insert unassigned only" on public.recruiters;
drop policy if exists "recruiter update own assignment unchanged" on public.recruiters;
drop policy if exists recruiters_admin_manage on public.recruiters;
drop policy if exists recruiters_read_own_assignment on public.recruiters;

create policy recruiters_admin_manage
  on public.recruiters
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

create policy recruiters_read_own_assignment
  on public.recruiters
  for select
  to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'recruiter'
    )
  );

commit;
