import {cleanString, json, requireEnv, supabaseFetch} from '../lib/supabase.js';
import {resolveSession} from '../lib/auth.js';

const COMPANY_FIELDS = [
  'industry', 'archetype', 'country', 'website', 'geography',
  'sustainable_packaging_coalition', 'principal_product_target', 'material_types', 'technical_process_fit',
  'rank', 'time_to_paid_revenue', 'revenue_12_24m', 'downstream_multiplier', 'technical_fit',
  'commitment_potential', 'strategic_value', 'engineering_efficiency', 'regulatory_simplicity',
  'weighted_score', 'priority_tier', 'commercial_gate_status', 'why_it_fits',
  'recommended_entry_proposition', 'next_action', 'scoring_basis', 'account_owner', 'notes'
];

function pick(payload, fields) {
  const out = {};
  fields.forEach((key) => {
    const value = payload[key];
    if (value !== undefined && value !== null && value !== '') out[key] = value;
  });
  return out;
}

// Imports a batch of rows from a target-account CSV. Each row creates or
// updates a company (by name) and, only when an email is present, a
// contact -- never a project/opportunity, since this is prospect research,
// not an active deal. Called in small batches from the client (not the
// whole file in one request) to stay under the Worker's subrequest limit.
export async function companiesImport({request, env}) {
  const envError = requireEnv(env, ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  if (envError) return json({error: envError}, {status: 500});
  const user = await resolveSession(request, env);
  if (!user || user.role !== 'admin') return json({error: 'Admin session is invalid or has expired. Please log in again.'}, {status: 401});

  const payload = await request.json();
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  if (!rows.length) return json({error: 'No rows to import.'}, {status: 400});

  const results = {companiesCreated: 0, companiesUpdated: 0, contactsCreated: 0, contactsSkipped: 0, errors: []};

  for (const row of rows) {
    try {
      const name = cleanString(row.company_name);
      if (!name) {
        results.errors.push('A row had no company name and was skipped.');
        continue;
      }

      const archetype = cleanString(row.archetype);
      if (archetype) {
        await supabaseFetch(env, 'archetypes', {
          method: 'POST',
          headers: {prefer: 'resolution=ignore-duplicates'},
          body: JSON.stringify({name: archetype})
        });
      }
      const industry = cleanString(row.industry);
      if (industry && industry.toLowerCase() !== 'n/a') {
        await supabaseFetch(env, 'industries', {
          method: 'POST',
          headers: {prefer: 'resolution=ignore-duplicates'},
          body: JSON.stringify({name: industry})
        });
      }

      const companyFields = pick(row, COMPANY_FIELDS);
      if (companyFields.industry && String(companyFields.industry).toLowerCase() === 'n/a') delete companyFields.industry;

      const existing = await supabaseFetch(env, `companies?name=ilike.${encodeURIComponent(name)}&select=id`);
      let companyId;
      if (existing[0]) {
        companyId = existing[0].id;
        if (Object.keys(companyFields).length) {
          await supabaseFetch(env, `companies?id=eq.${companyId}`, {
            method: 'PATCH',
            body: JSON.stringify(companyFields)
          });
        }
        results.companiesUpdated += 1;
      } else {
        const inserted = await supabaseFetch(env, 'companies?select=id', {
          method: 'POST',
          headers: {prefer: 'return=representation'},
          body: JSON.stringify({name, ...companyFields})
        });
        companyId = inserted[0].id;
        results.companiesCreated += 1;
      }

      const email = cleanString(row.contact_email).toLowerCase();
      if (email) {
        const existingContact = await supabaseFetch(env, `users?email=eq.${encodeURIComponent(email)}&select=id`);
        if (existingContact.length) {
          results.contactsSkipped += 1;
        } else {
          await supabaseFetch(env, 'users', {
            method: 'POST',
            body: JSON.stringify({
              email,
              role: 'member',
              status: 'lead',
              name: cleanString(row.contact_name) || null,
              job_title: cleanString(row.contact_title) || null,
              phone: cleanString(row.contact_phone) || null,
              linkedin_url: cleanString(row.contact_linkedin) || null,
              company_id: companyId,
              company_name: name
            })
          });
          results.contactsCreated += 1;
        }
      }
    } catch (error) {
      results.errors.push(`${row.company_name || 'Unknown row'}: ${error.message}`);
    }
  }

  return json(results);
}
