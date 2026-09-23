import {json, requireEnv, supabaseFetch} from '../lib/supabase.js';
import {resolveSession} from '../lib/auth.js';
import {findOrCreateCompany} from '../lib/companies.js';

const PROFILE_FIELDS = 'email,name,role,status,company_name,job_title,phone,country,industry,archetype,linkedin_url';

export async function profileGet({request, env}) {
  const envError = requireEnv(env, ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  if (envError) return json({error: envError}, {status: 500});

  const user = await resolveSession(request, env);
  if (!user) return json({error: 'Session is invalid or has expired. Please log in again.'}, {status: 401});

  try {
    const rows = await supabaseFetch(env, `users?email=eq.${encodeURIComponent(user.email)}&select=${PROFILE_FIELDS}`);
    return json({profile: rows[0] || null});
  } catch (error) {
    return json({error: error.message}, {status: 500});
  }
}

export async function profileUpdate({request, env}) {
  const envError = requireEnv(env, ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  if (envError) return json({error: envError}, {status: 500});

  const user = await resolveSession(request, env);
  if (!user) return json({error: 'Session is invalid or has expired. Please log in again.'}, {status: 401});

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({error: 'Invalid JSON body.'}, {status: 400});
  }

  const update = {};
  var fields = ['name', 'phone', 'country'];
  if (user.role === 'member') fields = fields.concat(['company_name', 'job_title', 'industry', 'archetype', 'linkedin_url']);
  fields.forEach((key) => {
    if (payload[key] !== undefined) update[key] = String(payload[key] || '').trim() || null;
  });

  try {
    if (update.country) {
      const matches = await supabaseFetch(env, `countries?name=eq.${encodeURIComponent(update.country)}&select=name`);
      if (!matches.length) return json({error: 'Invalid country.'}, {status: 400});
    }
    if (update.industry) {
      const matches = await supabaseFetch(env, `industries?name=eq.${encodeURIComponent(update.industry)}&select=name`);
      if (!matches.length) return json({error: 'Invalid industry.'}, {status: 400});
    }
    if (update.archetype) {
      const matches = await supabaseFetch(env, `archetypes?name=eq.${encodeURIComponent(update.archetype)}&select=name`);
      if (!matches.length) return json({error: 'Invalid archetype.'}, {status: 400});
    }

    if (update.company_name) {
      update.company_id = await findOrCreateCompany(env, update.company_name);
    }

    const rows = await supabaseFetch(env, `users?email=eq.${encodeURIComponent(user.email)}&select=${PROFILE_FIELDS}`, {
      method: 'PATCH',
      headers: {prefer: 'return=representation'},
      body: JSON.stringify(update)
    });
    return json({profile: rows[0]});
  } catch (error) {
    return json({error: error.message}, {status: 500});
  }
}
