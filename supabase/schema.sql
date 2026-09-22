create extension if not exists pgcrypto;

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  region text,
  industry text,
  access_status text not null default 'lead',
  created_at timestamptz not null default now()
);

create table if not exists enquiries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete set null,
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
  company_id uuid references companies(id) on delete cascade,
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

create table if not exists client_accounts (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists client_login_tokens (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token text unique not null,
  kind text not null default 'session',
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  password_hash text,
  created_at timestamptz not null default now()
);

create table if not exists admin_login_tokens (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token text unique not null,
  kind text not null default 'session',
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- Heals schema drift: adds any columns older deployments of this file were missing.
alter table companies add column if not exists name text;
alter table companies add column if not exists slug text;
alter table companies add column if not exists region text;
alter table companies add column if not exists industry text;
alter table companies add column if not exists access_status text not null default 'lead';
alter table companies add column if not exists created_at timestamptz not null default now();

alter table enquiries add column if not exists company_id uuid references companies(id) on delete set null;
alter table enquiries add column if not exists first_name text;
alter table enquiries add column if not exists last_name text;
alter table enquiries add column if not exists company text;
alter table enquiries add column if not exists email text;
alter table enquiries add column if not exists country text;
alter table enquiries add column if not exists application text;
alter table enquiries add column if not exists message text;
alter table enquiries add column if not exists status text not null default 'new';
alter table enquiries add column if not exists created_at timestamptz not null default now();

alter table projects add column if not exists company_id uuid references companies(id) on delete cascade;
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

alter table admin_users add column if not exists password_hash text;

create index if not exists client_accounts_email_idx on client_accounts(lower(email));
create index if not exists enquiries_email_idx on enquiries(lower(email));
create index if not exists projects_company_idx on projects(company_id);
create index if not exists sample_requests_project_idx on sample_requests(project_id);
create index if not exists project_updates_project_idx on project_updates(project_id);
create index if not exists client_login_tokens_token_idx on client_login_tokens(token);
create index if not exists client_login_tokens_expires_idx on client_login_tokens(expires_at);
create index if not exists admin_users_email_idx on admin_users(lower(email));
create index if not exists admin_login_tokens_token_idx on admin_login_tokens(token);
create index if not exists admin_login_tokens_expires_idx on admin_login_tokens(expires_at);

alter table companies enable row level security;
alter table enquiries enable row level security;
alter table projects enable row level security;
alter table sample_requests enable row level security;
alter table project_documents enable row level security;
alter table project_updates enable row level security;
alter table client_login_tokens enable row level security;
alter table admin_users enable row level security;
alter table admin_login_tokens enable row level security;
alter table client_accounts enable row level security;

drop policy if exists "service role manages companies" on companies;
drop policy if exists "service role manages enquiries" on enquiries;
drop policy if exists "service role manages projects" on projects;
drop policy if exists "service role manages sample requests" on sample_requests;
drop policy if exists "service role manages project documents" on project_documents;
drop policy if exists "service role manages project updates" on project_updates;
drop policy if exists "service role manages client login tokens" on client_login_tokens;
drop policy if exists "service role manages admin users" on admin_users;
drop policy if exists "service role manages admin login tokens" on admin_login_tokens;
drop policy if exists "service role manages client accounts" on client_accounts;

create policy "service role manages companies" on companies
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

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

create policy "service role manages client login tokens" on client_login_tokens
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "service role manages admin users" on admin_users
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "service role manages admin login tokens" on admin_login_tokens
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "service role manages client accounts" on client_accounts
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Seed the first admin so you're not locked out. Their password_hash starts null;
-- the first successful /api/admin/login attempt for this email sets it.
-- Add more admins by inserting more rows here.
insert into admin_users (email, name)
values ('kyle.a.newell@gmail.com', 'Kyle Newell')
on conflict (email) do nothing;
