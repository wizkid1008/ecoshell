# Ecoshell Concept Site

A single-page concept mockup for Ecoshell, structured after Amcor.com's corporate
site layout and populated with Ecoshell's own branding, colors, and copy.

This is a concept/pitch site, not the live ecoshell.eco site. Placeholder data
(stats, certifications, report covers) is visibly flagged in the markup and copy
rather than presented as real.

## Structure

```
index.html            Page markup
assets/css/styles.css Design system (colors, type, layout, components)
assets/js/main.js     Tab switching + contact form submission
.claude/launch.json   Local dev server config (used by Claude Code's browser preview)
.claude/serve.ps1     Minimal PowerShell static file server (no Python/Node required)
```

## Running locally

No build step. Serve the folder with any static file server, e.g.:

```powershell
powershell -File .claude/serve.ps1
```

Then open http://localhost:8791.

## Backend prototype

The site is a single Cloudflare Worker (`src/index.js`) that serves the static
pages via the Workers Static Assets binding and handles `/api/*` routes
directly. The public site (`index.html`, `solutions.html`, etc.) is untouched
by any of this — only the contact form and the portal (`portal.html`) talk to
the backend.

One portal page, one sign-in form, using plain email + password login (no
email sending involved — logging in is instant):

- `users.role` controls access: `admin` or `member` (staff vs. everyone
  else). `users.status` tracks the business relationship, independent of
  access: `lead` (enquired, no login yet) → `contact` (has portal access) →
  `client` (running active opportunities — set by an admin; no dedicated UI
  for that promotion yet, update the row directly).
- Submitting the login form calls `/api/login`. If the email already exists,
  it verifies the password (or, if that row has no password yet — a seeded
  admin or an enquiry-created lead — claims it, bumping `lead` to `contact`
  on claim); if the email is new, it creates a fresh `role: member,
  status: contact` account. The response's `role` tells the frontend which
  dashboard to render.
- Admins are provisioned by inserting a row into `users` with `role: admin`
  and no `password_hash` (see the seed at the bottom of `schema.sql`) — their
  first sign-in sets the password.
- `admin.html` is kept only as a redirect to `portal.html` for old bookmarks.

## CRM pipeline / workflow

Website enquiries and the admin portal share one data model, built around a
company, its contacts, and each opportunity between them:

- **`companies`** — one row per company. Enquiries and the Account profile
  form both find-or-create a company by name (`src/lib/companies.js`) rather
  than duplicating it per contact.
- **`users`** — contacts *and* login accounts in one table (`company_id`
  links a contact to its company). A contact doesn't need a password to
  exist — an enquiry creates one with `status: lead`.
- **`projects`** — the opportunity. Belongs to a `company_id` (so every
  contact at that company sees it), a `contact_id` (who it originated from)
  and an `owner_id` (the assigned admin). `status` holds the pipeline stage,
  validated against `src/lib/pipeline.js`'s fixed list rather than a DB
  constraint, so adding a stage later is a code change, not a migration:
  `new_inquiry` → `qualified_lead` → `technical_review` →
  `nda_documentation` → `sample_pilot_request` → `pilot_in_progress` →
  `pilot_complete` → `commercial_proposal` → `contract_negotiation` →
  `commercial_customer`, with `closed_not_fit` / `closed_lost` as terminal
  stages from any point.
- **`sample_requests`**, **`pilots`** (+ **`pilot_results`**),
  **`proposals`**, **`contracts`** — one-to-many child records per
  opportunity, each created via its own admin endpoint
  (`src/api/adminRecords.js`) rather than edited in place, so they read as a
  history (e.g. re-shipping a sample adds a new row instead of overwriting
  the last one).
- **`project_documents`** — linked files/URLs per opportunity, each flagged
  `visibility: client` or `visibility: internal`. Only `client` documents
  are ever returned by the client-facing endpoint.
- **`project_updates`** — the client-visible log (shown in the client
  portal). Written by the system on enquiry and by admins via the opportunity
  detail view.
- **`internal_notes`** — admin-only notes. Never selected by
  `src/api/clientProjects.js` or any client-facing response — there's no
  code path that could leak one to a client account.

**Admin workflow**: the sidebar lists the 12 pipeline stages (with a live
count each) instead of flat tabs — click a stage to see just the
opportunities sitting there, click one to open its detail view (a vertical
stepper replaces the stage list in the sidebar while you're in it, with any
other opportunities for that company listed below it). Every record section
(samples, pilot + results, proposal, contract, documents, client-visible
updates, internal notes) is a compact row list with a "+" to add one and a
click-to-edit popup, not a permanently open form. The Contacts tab lists
every contact (`role: member`) and every company, each searchable by name/
email, with a status pill, opportunity count, and By-archetype /
By-industry breakdown counts; clicking a row goes to that contact's or
company's opportunity workflow (falling back to a profile-edit popup, via
the row's pencil icon, if they have none yet).

**Client workflow**: sign in → see every opportunity for your company (not
just ones you personally started) — stage, sample/pilot progress, proposal
and contract status, the latest client-visible updates, and any documents
shared with you. Internal notes and other companies' opportunities are never
visible.

Backend files:

- `src/index.js` routes incoming requests to the right handler or falls back
  to static asset serving.
- `src/api/enquiries.js` finds/creates the company and contact for an
  enquiry, then opens a new opportunity every time (each enquiry is treated
  as a new pipeline entry).
- `src/api/login.js` authenticates or creates/claims a `users` row and issues
  a session token, returning that account's role and status.
- `src/api/clientProjects.js` returns every opportunity for the logged-in
  contact's company, with samples/pilots/proposals/contracts/client-visible
  documents/updates joined in.
- `src/api/adminOverview.js` returns the admin dashboard data — enquiries,
  opportunities, samples, pilots, proposals, contracts, clients, companies
  and the admin list (for owner assignment). Requires `role: admin`.
- `src/api/adminOpportunity.js` returns the full detail bundle for one
  opportunity (used by the detail view). Requires `role: admin`.
- `src/api/adminProjects.js` updates an opportunity's stage/owner/material
  fields, and can post a client-visible update and/or an internal note in
  the same call. Requires `role: admin`.
- `src/api/adminRecords.js` records (and edits, via matching `PATCH`
  routes) a sample, pilot, pilot result, proposal, contract or document
  against an opportunity, plus a company's own record and a client's
  profile on their behalf (`PATCH /api/admin/companies`,
  `PATCH /api/admin/clients`). Also lets an admin create a bare contact or
  company directly (`POST /api/admin/contacts`, `POST /api/admin/companies`)
  from the Contacts page, without going through an opportunity or enquiry
  first — `POST /api/admin/companies` finds-or-updates by name rather than
  duplicating an existing one. Requires `role: admin`.
- `src/api/profile.js` returns/updates the signed-in user's own profile
  (name, phone, country; members also get company name, job title, industry,
  archetype and LinkedIn profile URL). Saving a company name finds-or-creates
  that company and links it. Country is validated against the `countries`
  table.
- `src/api/countries.js` returns the full `countries` table (public, no
  session required) — used to populate the Account form's Country dropdown.
- `src/api/lists.js` returns the `industries`/`archetypes` tables (public
  GET, same pattern as countries) and lets an admin add or remove a value
  (`POST`/`DELETE /api/admin/industries`, same for `/archetypes`) — used by
  the Account form and the admin contact/company editors (validated against
  these tables, not a hardcoded list) and by the Admin page under Workspace
  in the sidebar, which is the dedicated place to manage both lists.
- `src/lib/supabase.js` shared Supabase REST helpers.
- `src/lib/password.js` PBKDF2 password hashing/verification.
- `src/lib/auth.js` resolves a session token to its `users` row (id, email,
  role, status, company_id).
- `src/lib/companies.js` finds a company by name (case-insensitive) or
  creates it.
- `src/lib/pipeline.js` the fixed list of pipeline stage slugs.
- `supabase/schema.sql` defines every table, RLS policy and seed (including
  a one-time `drop table` cleanup of the old split admin/client tables) and
  seeds admin users (password unset until each one's first sign-in). A
  database with real opportunities in it already should NOT re-run the
  whole file (it drops and recreates `projects`) — just run the single
  `alter table` statement at the bottom to pick up new columns.

Each stage view shows how many days an opportunity has sat there
(`projects.stage_changed_at`, bumped whenever `adminProjectsUpdate` changes
`status`), flagged once it passes 14 days, so a stuck deal is visible from
the list without opening it.

Required Cloudflare environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The portal pages include demo fallback data (a full opportunity with a
sample, pilot, company and client) so the prototype can be explored before
the Cloudflare/Supabase environment variables are connected.

## Deployment

Hosted on a Cloudflare Worker with static assets, connected to this GitHub
repo — pushes to `main` deploy automatically via `wrangler.jsonc`.
