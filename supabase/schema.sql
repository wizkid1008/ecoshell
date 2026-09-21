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

create table if not exists client_login_tokens (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token text unique not null,
  kind text not null default 'magic',
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists enquiries_email_idx on enquiries(lower(email));
create index if not exists projects_company_idx on projects(company_id);
create index if not exists sample_requests_project_idx on sample_requests(project_id);
create index if not exists project_updates_project_idx on project_updates(project_id);
create index if not exists client_login_tokens_token_idx on client_login_tokens(token);
create index if not exists client_login_tokens_expires_idx on client_login_tokens(expires_at);

alter table companies enable row level security;
alter table enquiries enable row level security;
alter table projects enable row level security;
alter table sample_requests enable row level security;
alter table project_documents enable row level security;
alter table project_updates enable row level security;
alter table client_login_tokens enable row level security;

drop policy if exists "service role manages companies" on companies;
drop policy if exists "service role manages enquiries" on enquiries;
drop policy if exists "service role manages projects" on projects;
drop policy if exists "service role manages sample requests" on sample_requests;
drop policy if exists "service role manages project documents" on project_documents;
drop policy if exists "service role manages project updates" on project_updates;
drop policy if exists "service role manages client login tokens" on client_login_tokens;

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
