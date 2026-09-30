
create type public.app_role as enum ('student','recruiter','admin');
create type public.application_status as enum ('applied','shortlisted','interview','offered','rejected','joined');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  unique(user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;

create policy "own roles readable" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admins manage roles" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles read own or staff" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'recruiter'));
create policy "profiles update own" on public.profiles for update to authenticated using (id = auth.uid());

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  industry text not null default '',
  location text not null default '',
  website text,
  description text not null default '',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.companies to authenticated;
grant all on public.companies to service_role;
alter table public.companies enable row level security;
create policy "companies readable" on public.companies for select to authenticated using (true);
create policy "staff write companies" on public.companies for insert to authenticated
  with check (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'recruiter'));
create policy "admin update companies" on public.companies for update to authenticated
  using (public.has_role(auth.uid(),'admin'));

create table public.recruiters (
  user_id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  designation text not null default 'Talent Acquisition',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.recruiters to authenticated;
grant all on public.recruiters to service_role;
alter table public.recruiters enable row level security;
create policy "recruiter own" on public.recruiters for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "recruiter update own" on public.recruiters for update to authenticated using (user_id = auth.uid());
create policy "recruiter insert own" on public.recruiters for insert to authenticated with check (user_id = auth.uid());

create or replace function public.recruiter_company(_uid uuid)
returns uuid language sql stable security definer set search_path = public
as $$ select company_id from public.recruiters where user_id=_uid $$;

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null default 'Technical'
);
grant select on public.skills to authenticated;
grant all on public.skills to service_role;
alter table public.skills enable row level security;
create policy "skills readable" on public.skills for select to authenticated using (true);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  roll_no text,
  branch text not null default 'CSE',
  batch_year int not null default 2027,
  cgpa numeric(4,2) not null default 0 check (cgpa between 0 and 10),
  backlogs int not null default 0 check (backlogs >= 0),
  tenth_pct numeric(5,2),
  twelfth_pct numeric(5,2),
  phone text,
  bio text not null default '',
  placement_status text not null default 'unplaced',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.students(branch);
grant select, insert, update on public.students to authenticated;
grant all on public.students to service_role;
alter table public.students enable row level security;

create or replace function public.current_student_id()
returns uuid language sql stable security definer set search_path = public
as $$ select id from public.students where user_id = auth.uid() $$;

create policy "students read" on public.students for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'recruiter'));
create policy "students update own" on public.students for update to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.student_skills (
  student_id uuid not null references public.students(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  level int not null default 3 check (level between 1 and 5),
  primary key (student_id, skill_id)
);
grant select, insert, update, delete on public.student_skills to authenticated;
grant all on public.student_skills to service_role;
alter table public.student_skills enable row level security;
create policy "ss read" on public.student_skills for select to authenticated
  using (student_id = public.current_student_id() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'recruiter'));
create policy "ss write own" on public.student_skills for all to authenticated
  using (student_id = public.current_student_id()) with check (student_id = public.current_student_id());

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  title text not null, description text not null default '', tech text not null default '',
  created_at timestamptz not null default now()
);
create table public.certifications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  name text not null, issuer text not null default '', issued_on date,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.projects, public.certifications to authenticated;
grant all on public.projects, public.certifications to service_role;
alter table public.projects enable row level security;
alter table public.certifications enable row level security;
create policy "proj read" on public.projects for select to authenticated
  using (student_id = public.current_student_id() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'recruiter'));
create policy "proj write" on public.projects for all to authenticated
  using (student_id = public.current_student_id()) with check (student_id = public.current_student_id());
create policy "cert read" on public.certifications for select to authenticated
  using (student_id = public.current_student_id() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'recruiter'));
create policy "cert write" on public.certifications for all to authenticated
  using (student_id = public.current_student_id()) with check (student_id = public.current_student_id());

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  job_type text not null default 'Full-time',
  location text not null default '',
  ctc_lpa numeric(6,2) not null default 0,
  description text not null default '',
  min_cgpa numeric(4,2) not null default 0,
  max_backlogs int not null default 0,
  eligible_branches text[] not null default '{CSE,IT,ECE}',
  deadline date,
  status text not null default 'open',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.jobs(company_id);
create table public.job_skills (
  job_id uuid not null references public.jobs(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  primary key (job_id, skill_id)
);
grant select, insert, update, delete on public.jobs, public.job_skills to authenticated;
grant all on public.jobs, public.job_skills to service_role;
alter table public.jobs enable row level security;
alter table public.job_skills enable row level security;
create policy "jobs read" on public.jobs for select to authenticated using (true);
create policy "jobs write" on public.jobs for all to authenticated
  using (public.has_role(auth.uid(),'admin') or company_id = public.recruiter_company(auth.uid()))
  with check (public.has_role(auth.uid(),'admin') or company_id = public.recruiter_company(auth.uid()));
create policy "js read" on public.job_skills for select to authenticated using (true);
create policy "js write" on public.job_skills for all to authenticated
  using (public.has_role(auth.uid(),'admin') or exists(select 1 from public.jobs j where j.id=job_id and j.company_id=public.recruiter_company(auth.uid())))
  with check (public.has_role(auth.uid(),'admin') or exists(select 1 from public.jobs j where j.id=job_id and j.company_id=public.recruiter_company(auth.uid())));

create table public.placement_drives (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null, drive_date date not null, venue text not null default '',
  status text not null default 'scheduled',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.placement_drives to authenticated;
grant all on public.placement_drives to service_role;
alter table public.placement_drives enable row level security;
create policy "drives read" on public.placement_drives for select to authenticated using (true);
create policy "drives admin" on public.placement_drives for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  status application_status not null default 'applied',
  match_score int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(student_id, job_id)
);
create index on public.applications(job_id);
grant select, insert, update on public.applications to authenticated;
grant all on public.applications to service_role;
alter table public.applications enable row level security;
create or replace function public.can_manage_job(_job uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select public.has_role(auth.uid(),'admin') or exists(select 1 from public.jobs where id=_job and company_id = public.recruiter_company(auth.uid())) $$;
create policy "apps read" on public.applications for select to authenticated
  using (student_id = public.current_student_id() or public.can_manage_job(job_id));
create policy "apps insert own" on public.applications for insert to authenticated
  with check (student_id = public.current_student_id() and status='applied');
create policy "apps update staff" on public.applications for update to authenticated
  using (public.can_manage_job(job_id));

create table public.interviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  round text not null default 'Technical Round 1',
  scheduled_at timestamptz not null,
  mode text not null default 'Online',
  location text not null default '',
  status text not null default 'scheduled',
  created_at timestamptz not null default now()
);
create table public.offers (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications(id) on delete cascade,
  ctc_lpa numeric(6,2) not null,
  joining_date date,
  status text not null default 'released',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.interviews, public.offers to authenticated;
grant all on public.interviews, public.offers to service_role;
alter table public.interviews enable row level security;
alter table public.offers enable row level security;
create or replace function public.app_visible(_app uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.applications a where a.id=_app and (a.student_id=public.current_student_id() or public.can_manage_job(a.job_id))) $$;
create or replace function public.app_manageable(_app uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.applications a where a.id=_app and public.can_manage_job(a.job_id)) $$;
create policy "int read" on public.interviews for select to authenticated using (public.app_visible(application_id));
create policy "int write" on public.interviews for insert to authenticated with check (public.app_manageable(application_id));
create policy "int update" on public.interviews for update to authenticated using (public.app_manageable(application_id));
create policy "off read" on public.offers for select to authenticated using (public.app_visible(application_id));
create policy "off write" on public.offers for insert to authenticated with check (public.app_manageable(application_id));
create policy "off update" on public.offers for update to authenticated using (public.app_visible(application_id));

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  doc_type text not null, status text not null default 'pending', note text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.documents to authenticated;
grant all on public.documents to service_role;
alter table public.documents enable row level security;
create policy "docs read" on public.documents for select to authenticated
  using (student_id = public.current_student_id() or public.has_role(auth.uid(),'admin'));
create policy "docs insert own" on public.documents for insert to authenticated with check (student_id = public.current_student_id());
create policy "docs admin update" on public.documents for update to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  title text not null, body text not null default '', read boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "notif read" on public.notifications for select to authenticated
  using (student_id = public.current_student_id() or public.has_role(auth.uid(),'admin'));
create policy "notif update own" on public.notifications for update to authenticated using (student_id = public.current_student_id());
create policy "notif staff insert" on public.notifications for insert to authenticated
  with check (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'recruiter'));

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor uuid, action text not null, entity text not null, entity_id uuid,
  created_at timestamptz not null default now()
);
grant select, insert on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "audit admin read" on public.audit_logs for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "audit insert self" on public.audit_logs for insert to authenticated with check (actor = auth.uid());

create or replace function public.notify_application_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare jt text; cn text;
begin
  if new.status is distinct from old.status then
    select j.title, c.name into jt, cn from jobs j join companies c on c.id=j.company_id where j.id=new.job_id;
    insert into notifications(student_id,title,body) values (new.student_id,
      'Application update: ' || cn, 'Your application for ' || jt || ' is now ' || new.status::text || '.');
    new.updated_at := now();
  end if;
  return new;
end $$;
create trigger trg_app_notify before update on public.applications for each row execute function public.notify_application_change();

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare r text := coalesce(new.raw_user_meta_data->>'role','student');
        n text := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1));
begin
  insert into profiles(id, full_name, email) values (new.id, n, new.email);
  if r = 'recruiter' then
    insert into user_roles(user_id, role) values (new.id,'recruiter');
    insert into recruiters(user_id, company_id) values (new.id, (select id from companies where name = new.raw_user_meta_data->>'company' limit 1));
  else
    insert into user_roles(user_id, role) values (new.id,'student');
    insert into students(user_id, full_name, email, branch) values (new.id, n, new.email, coalesce(new.raw_user_meta_data->>'branch','CSE'));
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

insert into skills(name,category) values
('Python','Technical'),('Java','Technical'),('C++','Technical'),('JavaScript','Technical'),('React','Technical'),('Node.js','Technical'),
('SQL','Technical'),('Data Structures','Core'),('Algorithms','Core'),('Machine Learning','Technical'),('Cloud (AWS)','Technical'),
('System Design','Core'),('Communication','Soft'),('Embedded C','Technical'),('Data Analysis','Technical'),('DevOps','Technical');

insert into companies(name,industry,location,website,description) values
('Novatek Systems','Enterprise Software','Bengaluru','https://example.com/novatek','Builds ERP and workflow platforms for mid-market manufacturers.'),
('Quantiva Analytics','Data & AI','Hyderabad','https://example.com/quantiva','Analytics consultancy delivering ML solutions for retail and fintech.'),
('Orbitrail Mobility','Automotive Tech','Pune','https://example.com/orbitrail','Connected-vehicle and embedded firmware for EV makers.'),
('Finloop Payments','Fintech','Mumbai','https://example.com/finloop','UPI and card payments infrastructure for merchants.'),
('Cloudnest Labs','Cloud Infrastructure','Noida','https://example.com/cloudnest','Managed Kubernetes and DevOps tooling.'),
('Medisphere Health','HealthTech','Chennai','https://example.com/medisphere','Hospital information systems and telehealth.');

insert into jobs(company_id,title,job_type,location,ctc_lpa,description,min_cgpa,max_backlogs,eligible_branches,deadline) 
select c.id, v.title, v.jt, c.location, v.ctc, v.descr, v.mc, v.mb, v.br::text[], current_date + v.d
from (values
 ('Novatek Systems','Software Engineer','Full-time',8.5,'Build and maintain core ERP modules in Java and React.',7.0,0,'{CSE,IT}',20),
 ('Novatek Systems','QA Automation Engineer','Full-time',6.0,'Design automated test suites for web products.',6.5,1,'{CSE,IT,ECE}',25),
 ('Quantiva Analytics','Data Analyst','Full-time',7.2,'Turn retail datasets into dashboards and insights.',7.0,0,'{CSE,IT,ECE,ME}',15),
 ('Quantiva Analytics','ML Engineer Intern','Internship',4.8,'Six-month internship training and deploying ML models.',8.0,0,'{CSE,IT}',12),
 ('Orbitrail Mobility','Embedded Software Engineer','Full-time',9.0,'Firmware for EV battery management systems.',7.0,0,'{ECE,EE}',30),
 ('Finloop Payments','Backend Engineer','Full-time',12.0,'Scale payment APIs in Node.js and Postgres.',7.5,0,'{CSE,IT}',18),
 ('Finloop Payments','Frontend Engineer','Full-time',10.0,'Merchant dashboard in React and TypeScript.',7.0,0,'{CSE,IT}',22),
 ('Cloudnest Labs','DevOps Engineer','Full-time',9.5,'CI/CD, containers, and cloud automation.',7.0,1,'{CSE,IT,ECE}',28),
 ('Cloudnest Labs','Cloud Support Associate','Full-time',5.5,'Customer-facing cloud troubleshooting.',6.0,2,'{CSE,IT,ECE,EE}',35),
 ('Medisphere Health','Full Stack Developer','Full-time',8.0,'Build patient portals across the stack.',6.8,0,'{CSE,IT}',26),
 ('Medisphere Health','Business Analyst','Full-time',6.5,'Bridge clinicians and engineering teams.',6.5,1,'{CSE,IT,ECE,ME,EE}',40),
 ('Orbitrail Mobility','Systems Engineer Intern','Internship',3.6,'Validation of vehicle control units.',7.0,0,'{ECE,EE,ME}',14)
) as v(cname,title,jt,ctc,descr,mc,mb,br,d) join companies c on c.name=v.cname;

insert into job_skills(job_id, skill_id)
select j.id, s.id from jobs j join (values
 ('Software Engineer','{Java,React,Data Structures,SQL}'),
 ('QA Automation Engineer','{JavaScript,Python,Communication}'),
 ('Data Analyst','{SQL,Python,Data Analysis,Communication}'),
 ('ML Engineer Intern','{Python,Machine Learning,Data Structures}'),
 ('Embedded Software Engineer','{Embedded C,C++,Algorithms}'),
 ('Backend Engineer','{Node.js,SQL,System Design,Data Structures}'),
 ('Frontend Engineer','{JavaScript,React,Communication}'),
 ('DevOps Engineer','{DevOps,Cloud (AWS),Python}'),
 ('Cloud Support Associate','{Cloud (AWS),Communication}'),
 ('Full Stack Developer','{React,Node.js,SQL}'),
 ('Business Analyst','{Data Analysis,Communication,SQL}'),
 ('Systems Engineer Intern','{Embedded C,C++}')
) as m(t, sk) on j.title=m.t cross join lateral unnest(m.sk::text[]) as u(n) join skills s on s.name=u.n;

insert into students(full_name,email,roll_no,branch,batch_year,cgpa,backlogs,tenth_pct,twelfth_pct,placement_status,bio) values
('Aarav Mehta','aarav.m@demo.campus','21CS001','CSE',2025,8.7,0,92,90,'unplaced','Backend-focused, loves distributed systems.'),
('Diya Sharma','diya.s@demo.campus','21CS002','CSE',2025,9.1,0,95,93,'unplaced','ML enthusiast, Kaggle contributor.'),
('Kabir Nair','kabir.n@demo.campus','21IT003','IT',2025,7.4,0,85,82,'unplaced','Frontend developer.'),
('Ishita Rao','ishita.r@demo.campus','21EC004','ECE',2025,8.2,0,90,88,'unplaced','Embedded systems and IoT.'),
('Vivaan Gupta','vivaan.g@demo.campus','21CS005','CSE',2025,6.4,2,78,74,'unplaced','Learning cloud.'),
('Ananya Iyer','ananya.i@demo.campus','21IT006','IT',2025,8.9,0,94,91,'unplaced','Full-stack builder.'),
('Rohan Das','rohan.d@demo.campus','21ME007','ME',2025,7.1,1,80,79,'unplaced','Data analysis for manufacturing.'),
('Saanvi Joshi','saanvi.j@demo.campus','21CS008','CSE',2025,8.0,0,88,86,'unplaced','DSA and competitive programming.'),
('Arjun Pillai','arjun.p@demo.campus','21EE009','EE',2025,7.6,0,84,81,'unplaced','Power electronics and firmware.'),
('Myra Kapoor','myra.k@demo.campus','21IT010','IT',2025,7.9,0,87,85,'unplaced','DevOps and automation.'),
('Aditya Verma','aditya.v@demo.campus','21CS011','CSE',2025,5.9,3,72,70,'unplaced','Needs DSA practice.'),
('Kiara Bose','kiara.b@demo.campus','21EC012','ECE',2025,8.4,0,91,89,'unplaced','VLSI and embedded C.'),
('Reyansh Kulkarni','reyansh.k@demo.campus','21CS013','CSE',2025,9.3,0,97,95,'unplaced','System design nerd.'),
('Aadhya Menon','aadhya.m@demo.campus','21IT014','IT',2025,7.2,1,83,80,'unplaced','Business analysis.'),
('Vihaan Reddy','vihaan.r@demo.campus','21CS015','CSE',2025,6.8,0,79,77,'unplaced','Java developer.'),
('Anika Chatterjee','anika.c@demo.campus','21ME016','ME',2025,6.9,0,82,78,'unplaced','Analytics with Python.'),
('Krishna Patel','krishna.p@demo.campus','21EE017','EE',2025,7.8,0,86,84,'unplaced','Controls and C++.'),
('Navya Singh','navya.s@demo.campus','21CS018','CSE',2025,8.5,0,90,92,'unplaced','React and Node.'),
('Shaurya Malhotra','shaurya.m@demo.campus','21IT019','IT',2025,6.2,2,75,72,'unplaced','Support engineering.'),
('Tara Fernandes','tara.f@demo.campus','21EC020','ECE',2025,7.5,0,85,83,'unplaced','Signal processing.'),
('Yash Agarwal','yash.a@demo.campus','21CS021','CSE',2025,8.1,0,89,87,'unplaced','Cloud and Python.'),
('Meera Krishnan','meera.k@demo.campus','21IT022','IT',2025,8.8,0,93,90,'unplaced','Frontend and design systems.');

insert into student_skills(student_id, skill_id, level)
select st.id, sk.id, 2 + (abs(hashtext(st.roll_no||sk.name)) % 4)
from students st cross join skills sk
where abs(hashtext(st.roll_no||sk.name)) % 3 = 0;

insert into projects(student_id,title,description,tech)
select id, 'Final-year capstone', bio, 'Python, React' from students;
insert into certifications(student_id,name,issuer,issued_on)
select id, 'Cloud Practitioner', 'Demo Cert Board', date '2024-06-01' from students where cgpa > 7.5;

insert into placement_drives(company_id,title,drive_date,venue,status)
select id, name || ' Campus Drive', current_date + ((row_number() over (order by name))::int * 5), 'Main Auditorium', 'scheduled' from companies;
update placement_drives set status='completed', drive_date = current_date - 20 where title like 'Finloop%' or title like 'Quantiva%';

insert into applications(student_id,job_id,status,match_score)
select s.id, j.id,
  (array['applied','shortlisted','interview','offered','rejected','joined'])[1 + abs(hashtext(s.roll_no||j.title)) % 6]::application_status,
  50 + abs(hashtext(j.title||s.roll_no)) % 45
from students s join jobs j on s.branch = any(j.eligible_branches) and s.cgpa >= j.min_cgpa
where abs(hashtext(s.roll_no||j.id::text)) % 3 = 0;

insert into interviews(application_id, round, scheduled_at, mode, location)
select id, 'Technical Round 1', now() + ((abs(hashtext(id::text)) % 10) + 1) * interval '1 day', 'Online', 'Video call'
from applications where status in ('interview','offered','joined');

insert into offers(application_id, ctc_lpa, joining_date, status)
select a.id, j.ctc_lpa, date '2025-07-15', case when a.status='joined' then 'accepted' else 'released' end
from applications a join jobs j on j.id=a.job_id where a.status in ('offered','joined');

update students s set placement_status='placed' where exists(select 1 from applications a where a.student_id=s.id and a.status in ('offered','joined'));

insert into documents(student_id, doc_type, status)
select id, 'Resume', case when cgpa > 7 then 'verified' else 'pending' end from students;
insert into documents(student_id, doc_type, status)
select id, 'Semester Marksheets', 'pending' from students where cgpa > 8;

insert into notifications(student_id,title,body)
select id, 'Welcome to CAMPUSLINK', 'Complete your profile to improve your readiness score.' from students;
