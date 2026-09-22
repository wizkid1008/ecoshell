create extension if not exists pgcrypto;

-- One-time cleanup: reintroduces a real companies table (removed in an
-- earlier pass, brought back now that opportunities need to be shared
-- across every contact at a company, not owned by a single person) and
-- reshapes users/projects around it. Also re-drops sample_requests/
-- project_documents/project_updates: CASCADE from the projects drop
-- silently strips their foreign key, and since those tables already
-- exist, `create table if not exists` would otherwise skip recreating
-- that FK. There's no production data yet -- safe to run even if these
-- were already dropped.
drop table if exists admin_users cascade;
drop table if exists client_accounts cascade;
drop table if exists admin_login_tokens cascade;
drop table if exists client_login_tokens cascade;
drop table if exists companies cascade;
drop table if exists pilot_results cascade;
drop table if exists pilots cascade;
drop table if exists proposals cascade;
drop table if exists contracts cascade;
drop table if exists internal_notes cascade;
drop table if exists sample_requests cascade;
drop table if exists project_documents cascade;
drop table if exists project_updates cascade;
drop table if exists enquiries cascade;
drop table if exists projects cascade;
drop table if exists users cascade;

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  archetype text,
  country text,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete set null,
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

-- The "opportunity": an enquiry becomes one of these and it moves through
-- the pipeline via `status`. Allowed values (enforced in the API, not a DB
-- check constraint, to keep adding stages a code change rather than a
-- migration): new_inquiry, qualified_lead, technical_review,
-- nda_documentation, sample_pilot_request, pilot_in_progress,
-- pilot_complete, commercial_proposal, contract_negotiation,
-- commercial_customer, closed_not_fit, closed_lost.
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  contact_id uuid references users(id) on delete set null,
  owner_id uuid references users(id) on delete set null,
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

create table if not exists pilots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  success_criteria text,
  start_date date,
  end_date date,
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'complete')),
  created_at timestamptz not null default now()
);

create table if not exists pilot_results (
  id uuid primary key default gen_random_uuid(),
  pilot_id uuid references pilots(id) on delete cascade,
  outcome text check (outcome in ('pass', 'partial', 'fail')),
  summary text not null,
  recorded_by text,
  created_at timestamptz not null default now()
);

create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  amount numeric,
  currency text not null default 'USD',
  terms text,
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'declined')),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  value numeric,
  currency text not null default 'USD',
  term text,
  status text not null default 'pending' check (status in ('pending', 'signed', 'active', 'ended')),
  signed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  url text not null,
  document_type text,
  visibility text not null default 'client' check (visibility in ('client', 'internal')),
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

-- Admin-only notes. Never returned by any client-facing endpoint.
create table if not exists internal_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
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

create index if not exists users_email_idx on users(lower(email));
create index if not exists users_company_idx on users(company_id);
create index if not exists enquiries_email_idx on enquiries(lower(email));
create index if not exists projects_company_idx on projects(company_id);
create index if not exists projects_owner_idx on projects(owner_id);
create index if not exists sample_requests_project_idx on sample_requests(project_id);
create index if not exists pilots_project_idx on pilots(project_id);
create index if not exists pilot_results_pilot_idx on pilot_results(pilot_id);
create index if not exists proposals_project_idx on proposals(project_id);
create index if not exists contracts_project_idx on contracts(project_id);
create index if not exists project_documents_project_idx on project_documents(project_id);
create index if not exists project_updates_project_idx on project_updates(project_id);
create index if not exists internal_notes_project_idx on internal_notes(project_id);
create index if not exists login_tokens_token_idx on login_tokens(token);
create index if not exists login_tokens_expires_idx on login_tokens(expires_at);

alter table companies enable row level security;
alter table enquiries enable row level security;
alter table projects enable row level security;
alter table sample_requests enable row level security;
alter table pilots enable row level security;
alter table pilot_results enable row level security;
alter table proposals enable row level security;
alter table contracts enable row level security;
alter table project_documents enable row level security;
alter table project_updates enable row level security;
alter table internal_notes enable row level security;
alter table users enable row level security;
alter table login_tokens enable row level security;
alter table countries enable row level security;

drop policy if exists "service role manages companies" on companies;
drop policy if exists "service role manages enquiries" on enquiries;
drop policy if exists "service role manages projects" on projects;
drop policy if exists "service role manages sample requests" on sample_requests;
drop policy if exists "service role manages pilots" on pilots;
drop policy if exists "service role manages pilot results" on pilot_results;
drop policy if exists "service role manages proposals" on proposals;
drop policy if exists "service role manages contracts" on contracts;
drop policy if exists "service role manages project documents" on project_documents;
drop policy if exists "service role manages project updates" on project_updates;
drop policy if exists "service role manages internal notes" on internal_notes;
drop policy if exists "service role manages users" on users;
drop policy if exists "service role manages login tokens" on login_tokens;
drop policy if exists "service role manages countries" on countries;

create policy "service role manages companies" on companies
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "service role manages enquiries" on enquiries
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "service role manages projects" on projects
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "service role manages sample requests" on sample_requests
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "service role manages pilots" on pilots
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "service role manages pilot results" on pilot_results
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "service role manages proposals" on proposals
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "service role manages contracts" on contracts
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "service role manages project documents" on project_documents
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "service role manages project updates" on project_updates
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "service role manages internal notes" on internal_notes
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

-- Removed as an admin -- delete outright rather than leaving a stray row
-- (on conflict do nothing below won't remove an existing row on its own).
delete from users where email = 'kyle.a.newell@gmail.com';

-- Seed admins so you're not locked out. Each password_hash starts null;
-- the first successful /api/login attempt for that email sets it and
-- signs them in with their existing admin role. Add more admins by
-- inserting more rows here.
insert into users (email, name, role)
values
  ('kyle@ecoshell.eco', 'Kyle Newell', 'admin'),
  ('andrew@ecoshell.eco', 'Andrew Bliss', 'admin'),
  ('doug@ecoshell.eco', 'Doug Hardesty', 'admin')
on conflict (email) do nothing;
