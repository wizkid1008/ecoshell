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

Prototype portal pages, both using plain email + password login (no email
sending involved — logging in is instant):

- `client.html` — sign in with any email and a password. The first sign-in
  for a given email creates the account; later sign-ins verify the password.
  Shows that account's projects, sample status and project updates (empty if
  none exist yet).
- `admin.html` — sign in with an email listed in the `admin_users` table. The
  first sign-in for a listed email sets its password; unlisted emails are
  rejected. Add or remove admins by editing that table directly.

Backend files:

- `src/index.js` routes incoming requests to the right handler or falls back
  to static asset serving.
- `src/api/enquiries.js` handles website enquiries.
- `src/api/clientLogin.js` creates or authenticates a client account and
  issues a session token.
- `src/api/clientProjects.js` returns projects for the logged-in client session.
- `src/api/adminLogin.js` authenticates (or claims, on first sign-in) an
  allow-listed admin account and issues a session token.
- `src/api/adminOverview.js` returns the admin dashboard data.
- `src/api/adminProjects.js` updates project status and client updates.
- `src/lib/supabase.js` shared Supabase REST helpers.
- `src/lib/password.js` PBKDF2 password hashing/verification.
- `src/lib/adminAuth.js` validates an admin session token.
- `supabase/schema.sql` defines the prototype database tables and RLS policies,
  and seeds the first admin user (password unset until their first sign-in).

Required Cloudflare environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The portal pages include demo fallback data so the prototype can be explored
before the Cloudflare/Supabase environment variables are connected.

## Deployment

Hosted on a Cloudflare Worker with static assets, connected to this GitHub
repo — pushes to `main` deploy automatically via `wrangler.jsonc`.
