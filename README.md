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

The contact form submits to a Cloudflare Pages Function at `/api/enquiries`.
That API creates or finds a company, stores the enquiry, opens a project and
adds the first client-visible update.

Prototype portal pages:

- `client.html` lets a client enter their work email and view their projects,
  sample status and project updates.
- `admin.html` lets an admin review companies, enquiries, projects and sample
  requests.

Backend files:

- `functions/api/enquiries/index.js` handles website enquiries.
- `functions/api/client/projects.js` returns projects linked to a client email.
- `functions/api/admin/overview.js` returns the admin dashboard data.
- `functions/api/admin/projects.js` updates project status and client updates.
- `supabase/schema.sql` defines the prototype database tables and RLS policies.

Required Cloudflare environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PORTAL_TOKEN`

The portal pages include demo fallback data so the prototype can be explored
before the Cloudflare/Supabase environment variables are connected.

## Deployment

Hosted on Cloudflare Pages, connected to this GitHub repo — pushes to `main`
deploy automatically.
