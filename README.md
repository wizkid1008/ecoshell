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
directly. The contact form submits to `/api/enquiries`, which creates or finds
a company, stores the enquiry, opens a project and adds the first
client-visible update.

One portal page (`portal.html`), one sign-in form, one `users` table for
both roles, using plain email + password login (no email sending involved —
logging in is instant):

- Submitting the form calls `/api/login`. If the email already exists as a
  `users` row, it verifies the password (or, if that row was seeded with no
  password yet, claims it); if the email is new, it creates a `role: client`
  account on the spot. The response's `role` field tells the frontend which
  dashboard to render — admin sidebar (Enquiries, Projects, Samples,
  Companies) or client dashboard (that account's projects, sample status and
  updates, empty if none exist yet).
- Admins are provisioned by inserting a row into `users` with `role: admin`
  and no `password_hash` (see the seed at the bottom of `schema.sql`) — their
  first sign-in sets the password. Clients self-serve; there's no separate
  admin signup flow.
- `admin.html` is kept only as a redirect to `portal.html` for old bookmarks.

Backend files:

- `src/index.js` routes incoming requests to the right handler or falls back
  to static asset serving.
- `src/api/enquiries.js` handles website enquiries.
- `src/api/login.js` authenticates or creates/claims a `users` row and issues
  a session token, returning that account's role.
- `src/api/clientProjects.js` returns projects for the logged-in session's email.
- `src/api/adminOverview.js` returns the admin dashboard data (requires
  `role: admin`).
- `src/api/adminProjects.js` updates project status and client updates
  (requires `role: admin`).
- `src/api/profile.js` returns/updates the signed-in user's own profile
  (name, phone, country; clients also get company name, job title, industry
  and archetype). The admin dashboard's Clients tab reads this same data
  across all client accounts, with By archetype / By industry breakdown
  counts.
- `src/lib/supabase.js` shared Supabase REST helpers.
- `src/lib/password.js` PBKDF2 password hashing/verification.
- `src/lib/auth.js` resolves a session token to its `users` row (email + role).
- `supabase/schema.sql` defines the prototype database tables and RLS
  policies (including a one-time `drop table` cleanup of the old split
  admin/client tables) and seeds admin users (password unset until each
  one's first sign-in).

Required Cloudflare environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The portal pages include demo fallback data so the prototype can be explored
before the Cloudflare/Supabase environment variables are connected.

## Deployment

Hosted on a Cloudflare Worker with static assets, connected to this GitHub
repo — pushes to `main` deploy automatically via `wrangler.jsonc`.
