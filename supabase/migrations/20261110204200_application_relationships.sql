begin;

do $migration$
begin
  if to_regclass('public.profiles') is null
    or to_regclass('public.companies') is null
    or to_regclass('public.opportunities') is null
    or to_regclass('public.applications') is null
    or to_regclass('public.notifications') is null then
    raise exception 'Expected application tables were not found; no changes were applied.';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'companies' and column_name = 'id'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'opportunities' and column_name = 'id'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'opportunities' and column_name = 'company_id'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'id'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'applications' and column_name = 'id'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'applications' and column_name = 'profile_id'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'applications' and column_name = 'opportunity_id'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'notifications' and column_name = 'profile_id'
  ) then
    raise exception 'Expected application relationship columns were not found; no changes were applied.';
  end if;
end
$migration$;

do $migration$
begin
  if not exists (
    select 1
    from pg_constraint c
    where c.contype = 'f'
      and c.conrelid = 'public.opportunities'::regclass
      and c.confrelid = 'public.companies'::regclass
      and c.conkey = array[(
        select a.attnum
        from pg_attribute a
        where a.attrelid = c.conrelid and a.attname = 'company_id' and not a.attisdropped
      )]::smallint[]
      and c.confkey = array[(
        select a.attnum
        from pg_attribute a
        where a.attrelid = c.confrelid and a.attname = 'id' and not a.attisdropped
      )]::smallint[]
  ) then
    alter table public.opportunities
      add constraint app_integrity_opportunities_company_id_fkey
      foreign key (company_id) references public.companies(id)
      on delete restrict not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint c
    where c.contype = 'f'
      and c.conrelid = 'public.applications'::regclass
      and c.confrelid = 'public.profiles'::regclass
      and c.conkey = array[(
        select a.attnum
        from pg_attribute a
        where a.attrelid = c.conrelid and a.attname = 'profile_id' and not a.attisdropped
      )]::smallint[]
      and c.confkey = array[(
        select a.attnum
        from pg_attribute a
        where a.attrelid = c.confrelid and a.attname = 'id' and not a.attisdropped
      )]::smallint[]
  ) then
    alter table public.applications
      add constraint app_integrity_applications_profile_id_fkey
      foreign key (profile_id) references public.profiles(id)
      on delete restrict not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint c
    where c.contype = 'f'
      and c.conrelid = 'public.applications'::regclass
      and c.confrelid = 'public.opportunities'::regclass
      and c.conkey = array[(
        select a.attnum
        from pg_attribute a
        where a.attrelid = c.conrelid and a.attname = 'opportunity_id' and not a.attisdropped
      )]::smallint[]
      and c.confkey = array[(
        select a.attnum
        from pg_attribute a
        where a.attrelid = c.confrelid and a.attname = 'id' and not a.attisdropped
      )]::smallint[]
  ) then
    alter table public.applications
      add constraint app_integrity_applications_opportunity_id_fkey
      foreign key (opportunity_id) references public.opportunities(id)
      on delete restrict not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint c
    where c.contype = 'f'
      and c.conrelid = 'public.notifications'::regclass
      and c.confrelid = 'public.profiles'::regclass
      and c.conkey = array[(
        select a.attnum
        from pg_attribute a
        where a.attrelid = c.conrelid and a.attname = 'profile_id' and not a.attisdropped
      )]::smallint[]
      and c.confkey = array[(
        select a.attnum
        from pg_attribute a
        where a.attrelid = c.confrelid and a.attname = 'id' and not a.attisdropped
      )]::smallint[]
  ) then
    alter table public.notifications
      add constraint app_integrity_notifications_profile_id_fkey
      foreign key (profile_id) references public.profiles(id)
      on delete restrict not valid;
  end if;
end
$migration$;

commit;
