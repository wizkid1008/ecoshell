create extension if not exists pgcrypto;

-- One-time cleanup: replaces the old split admin_users/client_accounts/
-- admin_login_tokens/client_login_tokens tables with a single users table,
-- and folds companies into users too (a company/lead is now just a users
-- row with no password_hash yet). users/enquiries/projects are dropped and
-- recreated outright rather than patched in place, since the role values
-- and the company_id -> user_id foreign key are changing shape, not just
-- gaining columns. sample_requests/project_documents/project_updates are
-- also dropped: CASCADE from the projects drop silently strips their
-- foreign key to projects, and since those tables already exist,
-- `create table if not exists` would otherwise skip recreating that FK.
-- There's no production data yet -- safe to run even if these were
-- already dropped.
drop table if exists admin_users cascade;
drop table if exists client_accounts cascade;
drop table if exists admin_login_tokens cascade;
drop table if exists client_login_tokens cascade;
drop table if exists companies cascade;
drop table if exists sample_requests cascade;
drop table if exists project_documents cascade;
drop table if exists project_updates cascade;
drop table if exists enquiries cascade;
drop table if exists projects cascade;
drop table if exists users cascade;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text,
  role text not null default 'member' check (role in ('member', 'admin')),
  status text check (status in ('lead', 'contact', 'client')),
  name text,
  company_name text,
  job_title text,
  phone text,
  country text,
  industry text,
  archetype text,
  created_at timestamptz not null default now()
);

create table if not exists enquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  first_name text,
  last_name text,
  company text not null,
  email text not null,
  country text,
  application text,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  enquiry_id uuid references enquiries(id) on delete set null,
  reference_code text unique not null default ('ECO-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  name text not null,
  polymer text,
  process text,
  target text,
  status text not null default 'new_inquiry',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sample_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  status text not null default 'requested',
  shipping_name text,
  shipping_address text,
  tracking_number text,
  admin_note text,
  created_at timestamptz not null default now()
);

create table if not exists project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  url text not null,
  document_type text,
  visibility text not null default 'client',
  created_at timestamptz not null default now()
);

create table if not exists project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  audience text not null default 'client',
  body text not null,
  created_by text not null default 'admin',
  created_at timestamptz not null default now()
);

create table if not exists countries (
  name text primary key
);

create table if not exists login_tokens (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token text unique not null,
  kind text not null default 'session',
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- Heals schema drift: adds any columns older deployments of this file were missing.
alter table users add column if not exists company_name text;
alter table users add column if not exists job_title text;
alter table users add column if not exists phone text;
alter table users add column if not exists country text;
alter table users add column if not exists industry text;
alter table users add column if not exists archetype text;
alter table users add column if not exists status text;

alter table enquiries add column if not exists user_id uuid references users(id) on delete set null;
alter table enquiries add column if not exists first_name text;
alter table enquiries add column if not exists last_name text;
alter table enquiries add column if not exists company text;
alter table enquiries add column if not exists email text;
alter table enquiries add column if not exists country text;
alter table enquiries add column if not exists application text;
alter table enquiries add column if not exists message text;
alter table enquiries add column if not exists status text not null default 'new';
alter table enquiries add column if not exists created_at timestamptz not null default now();

alter table projects add column if not exists user_id uuid references users(id) on delete cascade;
alter table projects add column if not exists enquiry_id uuid references enquiries(id) on delete set null;
alter table projects add column if not exists name text;
alter table projects add column if not exists polymer text;
alter table projects add column if not exists process text;
alter table projects add column if not exists target text;
alter table projects add column if not exists status text not null default 'new_inquiry';
alter table projects add column if not exists created_at timestamptz not null default now();
alter table projects add column if not exists updated_at timestamptz not null default now();

alter table sample_requests add column if not exists project_id uuid references projects(id) on delete cascade;
alter table sample_requests add column if not exists status text not null default 'requested';
alter table sample_requests add column if not exists shipping_name text;
alter table sample_requests add column if not exists shipping_address text;
alter table sample_requests add column if not exists tracking_number text;
alter table sample_requests add column if not exists admin_note text;
alter table sample_requests add column if not exists created_at timestamptz not null default now();

alter table project_updates add column if not exists project_id uuid references projects(id) on delete cascade;
alter table project_updates add column if not exists audience text not null default 'client';
alter table project_updates add column if not exists body text;
alter table project_updates add column if not exists created_by text not null default 'admin';
alter table project_updates add column if not exists created_at timestamptz not null default now();

create index if not exists users_email_idx on users(lower(email));
create index if not exists enquiries_email_idx on enquiries(lower(email));
create index if not exists projects_user_idx on projects(user_id);
create index if not exists sample_requests_project_idx on sample_requests(project_id);
create index if not exists project_updates_project_idx on project_updates(project_id);
create index if not exists login_tokens_token_idx on login_tokens(token);
create index if not exists login_tokens_expires_idx on login_tokens(expires_at);

alter table enquiries enable row level security;
alter table projects enable row level security;
alter table sample_requests enable row level security;
alter table project_documents enable row level security;
alter table project_updates enable row level security;
alter table users enable row level security;
alter table login_tokens enable row level security;
alter table countries enable row level security;

drop policy if exists "service role manages enquiries" on enquiries;
drop policy if exists "service role manages projects" on projects;
drop policy if exists "service role manages sample requests" on sample_requests;
drop policy if exists "service role manages project documents" on project_documents;
drop policy if exists "service role manages project updates" on project_updates;
drop policy if exists "service role manages users" on users;
drop policy if exists "service role manages login tokens" on login_tokens;
drop policy if exists "service role manages countries" on countries;

create policy "service role manages enquiries" on enquiries
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "service role manages projects" on projects
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "service role manages sample requests" on sample_requests
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "service role manages project documents" on project_documents
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "service role manages project updates" on project_updates
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "service role manages users" on users
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "service role manages login tokens" on login_tokens
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "service role manages countries" on countries
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Seed the country list used by the Account profile's Country dropdown
-- (same list already used by the contact form's Country <select>).
insert into countries (name)
values
  ('Afghanistan'), ('Albania'), ('Algeria'), ('Andorra'), ('Angola'),
  ('Argentina'), ('Armenia'), ('Australia'), ('Austria'), ('Azerbaijan'),
  ('Bahamas'), ('Bahrain'), ('Bangladesh'), ('Barbados'), ('Belarus'),
  ('Belgium'), ('Belize'), ('Benin'), ('Bhutan'), ('Bolivia'),
  ('Bosnia and Herzegovina'), ('Botswana'), ('Brazil'), ('Brunei'), ('Bulgaria'),
  ('Burkina Faso'), ('Burundi'), ('Cambodia'), ('Cameroon'), ('Canada'),
  ('Cape Verde'), ('Central African Republic'), ('Chad'), ('Chile'), ('China'),
  ('Colombia'), ('Comoros'), ('Congo'), ('Costa Rica'), ('Croatia'),
  ('Cuba'), ('Cyprus'), ('Czech Republic'), ('Denmark'), ('Djibouti'),
  ('Dominica'), ('Dominican Republic'), ('Ecuador'), ('Egypt'), ('El Salvador'),
  ('Equatorial Guinea'), ('Eritrea'), ('Estonia'), ('Eswatini'), ('Ethiopia'),
  ('Fiji'), ('Finland'), ('France'), ('Gabon'), ('Gambia'),
  ('Georgia'), ('Germany'), ('Ghana'), ('Greece'), ('Grenada'),
  ('Guatemala'), ('Guinea'), ('Guinea-Bissau'), ('Guyana'), ('Haiti'),
  ('Honduras'), ('Hungary'), ('Iceland'), ('India'), ('Indonesia'),
  ('Iran'), ('Iraq'), ('Ireland'), ('Israel'), ('Italy'),
  ('Jamaica'), ('Japan'), ('Jordan'), ('Kazakhstan'), ('Kenya'),
  ('Kiribati'), ('Kosovo'), ('Kuwait'), ('Kyrgyzstan'), ('Laos'),
  ('Latvia'), ('Lebanon'), ('Lesotho'), ('Liberia'), ('Libya'),
  ('Liechtenstein'), ('Lithuania'), ('Luxembourg'), ('Madagascar'), ('Malawi'),
  ('Malaysia'), ('Maldives'), ('Mali'), ('Malta'), ('Marshall Islands'),
  ('Mauritania'), ('Mauritius'), ('Mexico'), ('Micronesia'), ('Moldova'),
  ('Monaco'), ('Mongolia'), ('Montenegro'), ('Morocco'), ('Mozambique'),
  ('Myanmar'), ('Namibia'), ('Nauru'), ('Nepal'), ('Netherlands'),
  ('New Zealand'), ('Nicaragua'), ('Niger'), ('Nigeria'), ('North Korea'),
  ('North Macedonia'), ('Norway'), ('Oman'), ('Pakistan'), ('Palau'),
  ('Panama'), ('Papua New Guinea'), ('Paraguay'), ('Peru'), ('Philippines'),
  ('Poland'), ('Portugal'), ('Qatar'), ('Romania'), ('Russia'),
  ('Rwanda'), ('Saint Lucia'), ('Samoa'), ('San Marino'), ('Saudi Arabia'),
  ('Senegal'), ('Serbia'), ('Seychelles'), ('Sierra Leone'), ('Singapore'),
  ('Slovakia'), ('Slovenia'), ('Solomon Islands'), ('Somalia'), ('South Africa'),
  ('South Korea'), ('South Sudan'), ('Spain'), ('Sri Lanka'), ('Sudan'),
  ('Suriname'), ('Sweden'), ('Switzerland'), ('Syria'), ('Taiwan'),
  ('Tajikistan'), ('Tanzania'), ('Thailand'), ('Timor-Leste'), ('Togo'),
  ('Tonga'), ('Trinidad and Tobago'), ('Tunisia'), ('Turkey'), ('Turkmenistan'),
  ('Tuvalu'), ('Uganda'), ('Ukraine'), ('United Arab Emirates'), ('United Kingdom'),
  ('United States'), ('Uruguay'), ('Uzbekistan'), ('Vanuatu'), ('Vatican City'),
  ('Venezuela'), ('Vietnam'), ('Yemen'), ('Zambia'), ('Zimbabwe')
on conflict (name) do nothing;

-- Seed admins so you're not locked out. Each password_hash starts null;
-- the first successful /api/login attempt for that email sets it and
-- signs them in with their existing admin role. Add more admins by
-- inserting more rows here.
insert into users (email, name, role)
values
  ('kyle.a.newell@gmail.com', 'Kyle Newell', 'admin'),
  ('kyle@ecoshell.eco', 'Kyle Newell', 'admin'),
  ('andrew@ecoshell.eco', 'Andrew', 'admin'),
  ('doug@ecoshell.eco', 'Doug', 'admin')
on conflict (email) do nothing;
