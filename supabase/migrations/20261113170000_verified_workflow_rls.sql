begin;

do $migration$
begin
  if exists (
    select 1
    from (
      values
        ('profiles', 'id'),
        ('profiles', 'created_at'),
        ('profiles', 'full_name'),
        ('profiles', 'email'),
        ('profiles', 'role'),
        ('profiles', 'branch'),
        ('profiles', 'graduation_year'),
        ('companies', 'id'),
        ('companies', 'name'),
        ('companies', 'description'),
        ('companies', 'website'),
        ('companies', 'industry'),
        ('companies', 'location'),
        ('companies', 'status'),
        ('recruiters', 'user_id'),
        ('recruiters', 'company_id'),
        ('opportunities', 'id'),
        ('opportunities', 'company_id'),
        ('opportunities', 'deadline'),
        ('applications', 'id'),
        ('applications', 'profile_id'),
        ('applications', 'opportunity_id'),
        ('applications', 'applied_at'),
        ('applications', 'status'),
        ('applications', 'resume_url'),
        ('interviews', 'application_id'),
        ('interviews', 'scheduled_at'),
        ('interviews', 'interview_type'),
        ('interviews', 'status'),
        ('interviews', 'meeting_link'),
        ('interviews', 'feedback'),
        ('offers', 'application_id'),
        ('offers', 'salary'),
        ('offers', 'joining_date'),
        ('offers', 'status'),
        ('skills', 'profile_id'),
        ('documents', 'profile_id')
    ) as required(table_name, column_name)
    where not exists (
      select 1
      from information_schema.columns c
      where c.table_schema = 'public'
        and c.table_name = required.table_name
        and c.column_name = required.column_name
    )
  ) then
    raise exception 'Production workflow schema does not match the verified column set; no changes were applied.';
  end if;

  if exists (
    select 1
    from public.applications
    where profile_id is not null
      and opportunity_id is not null
    group by profile_id, opportunity_id
    having count(*) > 1
  ) then
    raise exception 'Duplicate student/opportunity applications exist; resolve them before adding the uniqueness guard.';
  end if;
end;
$migration$;

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = ''
as $function$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
  limit 1
$function$;

create or replace function public.is_workflow_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce(public.current_profile_role() in ('admin', 'placement_admin'), false)
$function$;

create or replace function public.is_company_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce(public.current_profile_role() = 'admin', false)
$function$;

create or replace function public.current_recruiter_company_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $function$
  select r.company_id
  from public.recruiters r
  join public.profiles p on p.id = r.user_id
  where r.user_id = auth.uid()
    and p.role = 'recruiter'
  limit 1
$function$;

create or replace function public.is_recruiter_for_application(target_application_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.applications a
    join public.opportunities o on o.id = a.opportunity_id
    join public.recruiters r on r.company_id = o.company_id
    join public.profiles p on p.id = r.user_id
    where a.id = target_application_id
      and r.user_id = auth.uid()
      and p.role = 'recruiter'
  )
$function$;

create or replace function public.is_recruiter_for_profile(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.applications a
    join public.opportunities o on o.id = a.opportunity_id
    join public.recruiters r on r.company_id = o.company_id
    join public.profiles p on p.id = r.user_id
    where a.profile_id = target_profile_id
      and r.user_id = auth.uid()
      and p.role = 'recruiter'
  )
$function$;

create or replace function public.is_applicant_for_application(target_application_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.applications a
    where a.id = target_application_id
      and a.profile_id = auth.uid()
      and public.current_profile_role() = 'student'
  )
$function$;

create or replace function public.student_has_applied_to_opportunity(target_opportunity_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce(public.current_profile_role() = 'student', false)
    and exists (
      select 1
      from public.applications a
      where a.opportunity_id = target_opportunity_id
        and a.profile_id = auth.uid()
    )
$function$;

alter function public.current_profile_role() owner to postgres;
alter function public.is_workflow_admin() owner to postgres;
alter function public.is_company_admin() owner to postgres;
alter function public.current_recruiter_company_id() owner to postgres;
alter function public.is_recruiter_for_application(uuid) owner to postgres;
alter function public.is_recruiter_for_profile(uuid) owner to postgres;
alter function public.is_applicant_for_application(uuid) owner to postgres;
alter function public.student_has_applied_to_opportunity(uuid) owner to postgres;

revoke all on function public.current_profile_role() from public, anon, authenticated;
revoke all on function public.is_workflow_admin() from public, anon, authenticated;
revoke all on function public.is_company_admin() from public, anon, authenticated;
revoke all on function public.current_recruiter_company_id() from public, anon, authenticated;
revoke all on function public.is_recruiter_for_application(uuid) from public, anon, authenticated;
revoke all on function public.is_recruiter_for_profile(uuid) from public, anon, authenticated;
revoke all on function public.is_applicant_for_application(uuid) from public, anon, authenticated;
revoke all on function public.student_has_applied_to_opportunity(uuid) from public, anon, authenticated;
grant execute on function public.current_profile_role() to authenticated;
grant execute on function public.is_workflow_admin() to authenticated;
grant execute on function public.is_company_admin() to authenticated;
grant execute on function public.current_recruiter_company_id() to authenticated;
grant execute on function public.is_recruiter_for_application(uuid) to authenticated;
grant execute on function public.is_recruiter_for_profile(uuid) to authenticated;
grant execute on function public.is_applicant_for_application(uuid) to authenticated;
grant execute on function public.student_has_applied_to_opportunity(uuid) to authenticated;

create or replace view public.company_directory
with (security_barrier = true)
as
select
  c.id,
  c.name,
  c.description,
  c.website,
  c.industry,
  c.location
from public.companies c
where c.status = 'active';

alter view public.company_directory owner to postgres;

create unique index if not exists applications_profile_opportunity_unique_idx
  on public.applications (profile_id, opportunity_id)
  where profile_id is not null and opportunity_id is not null;

drop policy if exists "Users can create their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists profiles_read_scoped on public.profiles;
drop policy if exists profiles_update_self on public.profiles;

drop policy if exists "Admins can manage companies" on public.companies;
drop policy if exists "Recruiters can view assigned company" on public.companies;
drop policy if exists companies_read_authenticated on public.companies;
drop policy if exists companies_admin_manage on public.companies;
drop policy if exists companies_recruiter_read_assigned_company on public.companies;

drop policy if exists "Admins can manage recruiters" on public.recruiters;
drop policy if exists "Recruiters can view their own assignment" on public.recruiters;
drop policy if exists "admins manage recruiter assignments" on public.recruiters;
drop policy if exists "recruiter insert unassigned only" on public.recruiters;
drop policy if exists "recruiter update own assignment unchanged" on public.recruiters;
drop policy if exists recruiters_admin_manage on public.recruiters;
drop policy if exists recruiters_read_own_assignment on public.recruiters;

drop policy if exists "Admins can manage opportunities" on public.opportunities;
drop policy if exists "Authenticated users can view opportunities" on public.opportunities;
drop policy if exists "Placement admins can create opportunities" on public.opportunities;
drop policy if exists "Placement admins can delete opportunities" on public.opportunities;
drop policy if exists "Placement admins can update opportunities" on public.opportunities;
drop policy if exists opportunities_read_authenticated on public.opportunities;
drop policy if exists opportunities_admin_manage on public.opportunities;
drop policy if exists opportunities_recruiter_insert_assigned_company on public.opportunities;
drop policy if exists opportunities_recruiter_update_assigned_company on public.opportunities;
drop policy if exists opportunities_read_active_student on public.opportunities;
drop policy if exists opportunities_read_assigned_recruiter on public.opportunities;
drop policy if exists opportunities_read_student_applications on public.opportunities;

drop policy if exists "Users can create their own applications" on public.applications;
drop policy if exists "Users can update their own applications" on public.applications;
drop policy if exists "Users can view their own applications" on public.applications;
drop policy if exists applications_read_own on public.applications;
drop policy if exists applications_read_company_applicants on public.applications;
drop policy if exists applications_read_admin on public.applications;
drop policy if exists applications_insert_student_open_opportunity on public.applications;
drop policy if exists applications_update_company_recruiter on public.applications;

drop policy if exists "Placement admins can create interviews" on public.interviews;
drop policy if exists "Placement admins can update interviews" on public.interviews;
drop policy if exists "Users can view their own interviews" on public.interviews;
drop policy if exists interviews_read_scoped on public.interviews;
drop policy if exists interviews_insert_recruiter_or_admin on public.interviews;
drop policy if exists interviews_update_recruiter_or_admin on public.interviews;

drop policy if exists "Placement admins can create offers" on public.offers;
drop policy if exists "Users can view their own offers" on public.offers;
drop policy if exists offers_read_scoped on public.offers;
drop policy if exists offers_insert_recruiter_or_admin on public.offers;
drop policy if exists offers_update_recruiter_or_admin on public.offers;
drop policy if exists offers_update_admin on public.offers;
drop policy if exists offers_release_recruiter on public.offers;
drop policy if exists offers_respond_student on public.offers;

drop policy if exists "Users can delete their own skills" on public.skills;
drop policy if exists "Users can update their own skills" on public.skills;
drop policy if exists "user can add their own skills" on public.skills;
drop policy if exists "user can view skills" on public.skills;
drop policy if exists skills_read_scoped on public.skills;
drop policy if exists skills_insert_student_self on public.skills;
drop policy if exists skills_update_student_self on public.skills;
drop policy if exists skills_delete_student_self on public.skills;

drop policy if exists "Users can add their own documents" on public.documents;
drop policy if exists "Users can view their own documents" on public.documents;
drop policy if exists documents_read_scoped on public.documents;
drop policy if exists documents_insert_student_self on public.documents;

drop policy if exists "Users can update their own notifications" on public.notifications;
drop policy if exists "Users can view their own notifications" on public.notifications;
drop policy if exists notifications_read_own_or_admin on public.notifications;
drop policy if exists notifications_update_read_state on public.notifications;

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.recruiters enable row level security;
alter table public.opportunities enable row level security;
alter table public.applications enable row level security;
alter table public.interviews enable row level security;
alter table public.offers enable row level security;
alter table public.skills enable row level security;
alter table public.documents enable row level security;
alter table public.notifications enable row level security;

revoke all on table public.company_directory from public, anon, authenticated;
grant select on table public.company_directory to authenticated;

do $column_grants$
declare
  target record;
  column_names text;
begin
  for target in
    select unnest(array[
      'profiles',
      'companies',
      'recruiters',
      'opportunities',
      'applications',
      'interviews',
      'offers',
      'skills',
      'documents',
      'notifications'
    ]) as table_name
  loop
    select string_agg(format('%I', c.column_name), ', ' order by c.ordinal_position)
    into column_names
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = target.table_name;

    if column_names is not null then
      execute format(
        'revoke all (%s) on table public.%I from public, anon, authenticated',
        column_names,
        target.table_name
      );
    end if;
  end loop;
end;
$column_grants$;

revoke all on table
  public.profiles,
  public.companies,
  public.recruiters,
  public.opportunities,
  public.applications,
  public.interviews,
  public.offers,
  public.skills,
  public.documents,
  public.notifications
from public, anon, authenticated;

grant select (id, created_at, full_name, email, role, branch, graduation_year)
  on table public.profiles to authenticated;
grant update (full_name, branch, graduation_year)
  on table public.profiles to authenticated;

grant select, insert, update, delete on table public.companies to authenticated;
grant select, insert, update, delete on table public.recruiters to authenticated;
grant select, insert, update, delete on table public.opportunities to authenticated;

revoke all on table public.applications from authenticated;
grant select, insert on table public.applications to authenticated;
grant update (status) on table public.applications to authenticated;

revoke all on table public.interviews from authenticated;
grant select, insert on table public.interviews to authenticated;
grant update (scheduled_at, status, meeting_link, feedback)
  on table public.interviews to authenticated;

revoke all on table public.offers from authenticated;
grant select, insert on table public.offers to authenticated;
grant update (status) on table public.offers to authenticated;

grant select, insert, update, delete on table public.skills to authenticated;
grant select, insert on table public.documents to authenticated;
revoke all on table public.notifications from authenticated;
grant select on table public.notifications to authenticated;
grant update (is_read) on table public.notifications to authenticated;

create policy profiles_read_scoped
  on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or public.is_workflow_admin()
    or public.is_recruiter_for_profile(id)
  );
create policy profiles_update_self
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy companies_admin_manage
  on public.companies for all to authenticated
  using (public.is_company_admin())
  with check (public.is_company_admin());
create policy companies_recruiter_read_assigned_company
  on public.companies for select to authenticated
  using (
    public.current_profile_role() = 'recruiter'
    and id = public.current_recruiter_company_id()
  );

create policy recruiters_admin_manage
  on public.recruiters for all to authenticated
  using (public.is_company_admin())
  with check (
    public.is_company_admin()
    and exists (
      select 1
      from public.profiles p
      where p.id = recruiters.user_id
        and p.role = 'recruiter'
    )
  );
create policy recruiters_read_own_assignment
  on public.recruiters for select to authenticated
  using (
    user_id = auth.uid()
    and public.current_profile_role() = 'recruiter'
  );

create policy opportunities_read_active_student
  on public.opportunities for select to authenticated
  using (
    public.current_profile_role() = 'student'
    and (deadline is null or deadline >= current_date)
    and exists (
      select 1
      from public.company_directory d
      where d.id = opportunities.company_id
    )
  );
create policy opportunities_read_student_applications
  on public.opportunities for select to authenticated
  using (
    public.student_has_applied_to_opportunity(opportunities.id)
  );
create policy opportunities_read_assigned_recruiter
  on public.opportunities for select to authenticated
  using (
    public.current_profile_role() = 'recruiter'
    and company_id = public.current_recruiter_company_id()
  );
create policy opportunities_admin_manage
  on public.opportunities for all to authenticated
  using (public.is_workflow_admin())
  with check (public.is_workflow_admin());
create policy opportunities_recruiter_insert_assigned_company
  on public.opportunities for insert to authenticated
  with check (
    public.current_profile_role() = 'recruiter'
    and company_id = public.current_recruiter_company_id()
    and exists (
      select 1
      from public.company_directory d
      where d.id = opportunities.company_id
    )
  );
create policy opportunities_recruiter_update_assigned_company
  on public.opportunities for update to authenticated
  using (
    public.current_profile_role() = 'recruiter'
    and company_id = public.current_recruiter_company_id()
  )
  with check (
    public.current_profile_role() = 'recruiter'
    and company_id = public.current_recruiter_company_id()
    and exists (
      select 1
      from public.company_directory d
      where d.id = opportunities.company_id
    )
  );

create policy applications_read_own
  on public.applications for select to authenticated
  using (
    profile_id = auth.uid()
    and public.current_profile_role() = 'student'
  );
create policy applications_read_company_applicants
  on public.applications for select to authenticated
  using (public.is_recruiter_for_application(id));
create policy applications_read_admin
  on public.applications for select to authenticated
  using (public.is_workflow_admin());
create policy applications_insert_student_open_opportunity
  on public.applications for insert to authenticated
  with check (
    profile_id = auth.uid()
    and public.current_profile_role() = 'student'
    and status = 'applied'
    and exists (
      select 1
      from public.opportunities o
      join public.company_directory d on d.id = o.company_id
      where o.id = applications.opportunity_id
        and (o.deadline is null or o.deadline >= current_date)
    )
  );
create policy applications_update_company_recruiter
  on public.applications for update to authenticated
  using (public.is_recruiter_for_application(id))
  with check (
    public.is_recruiter_for_application(id)
    and status in ('shortlisted', 'rejected', 'interview', 'offered', 'joined')
  );

create policy interviews_read_scoped
  on public.interviews for select to authenticated
  using (
    public.is_workflow_admin()
    or public.is_recruiter_for_application(application_id)
    or public.is_applicant_for_application(application_id)
  );
create policy interviews_insert_recruiter_or_admin
  on public.interviews for insert to authenticated
  with check (
    public.is_workflow_admin()
    or public.is_recruiter_for_application(application_id)
  );
create policy interviews_update_recruiter_or_admin
  on public.interviews for update to authenticated
  using (
    public.is_workflow_admin()
    or public.is_recruiter_for_application(application_id)
  )
  with check (
    public.is_workflow_admin()
    or public.is_recruiter_for_application(application_id)
  );

create policy offers_read_scoped
  on public.offers for select to authenticated
  using (
    public.is_workflow_admin()
    or public.is_recruiter_for_application(application_id)
    or public.is_applicant_for_application(application_id)
  );
create policy offers_insert_recruiter_or_admin
  on public.offers for insert to authenticated
  with check (
    (
      public.is_workflow_admin()
      or public.is_recruiter_for_application(application_id)
    )
    and status = 'pending'
  );
create policy offers_update_admin
  on public.offers for update to authenticated
  using (public.is_workflow_admin())
  with check (
    public.is_workflow_admin()
  );
create policy offers_release_recruiter
  on public.offers for update to authenticated
  using (
    public.is_recruiter_for_application(application_id)
    and status = 'pending'
  )
  with check (
    public.is_recruiter_for_application(application_id)
    and status = 'released'
  );
create policy offers_respond_student
  on public.offers for update to authenticated
  using (
    public.is_applicant_for_application(application_id)
    and status = 'released'
  )
  with check (
    public.is_applicant_for_application(application_id)
    and status in ('accepted', 'declined')
  );

create policy skills_read_scoped
  on public.skills for select to authenticated
  using (
    profile_id = auth.uid()
    or public.is_workflow_admin()
    or public.is_recruiter_for_profile(profile_id)
  );
create policy skills_insert_student_self
  on public.skills for insert to authenticated
  with check (
    profile_id = auth.uid()
    and public.current_profile_role() = 'student'
  );
create policy skills_update_student_self
  on public.skills for update to authenticated
  using (
    profile_id = auth.uid()
    and public.current_profile_role() = 'student'
  )
  with check (
    profile_id = auth.uid()
    and public.current_profile_role() = 'student'
  );
create policy skills_delete_student_self
  on public.skills for delete to authenticated
  using (
    profile_id = auth.uid()
    and public.current_profile_role() = 'student'
  );

create policy documents_read_scoped
  on public.documents for select to authenticated
  using (
    profile_id = auth.uid()
    or public.is_workflow_admin()
    or public.is_recruiter_for_profile(profile_id)
  );
create policy documents_insert_student_self
  on public.documents for insert to authenticated
  with check (
    profile_id = auth.uid()
    and public.current_profile_role() = 'student'
  );

create policy notifications_read_own_or_admin
  on public.notifications for select to authenticated
  using (
    profile_id = auth.uid()
    or public.is_workflow_admin()
  );
create policy notifications_update_read_state
  on public.notifications for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

commit;
