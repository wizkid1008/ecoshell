import {json, requireEnv, supabaseFetch} from '../lib/supabase.js';

export async function countriesList({env}) {
  const envError = requireEnv(env, ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  if (envError) return json({error: envError}, {status: 500});

  try {
    const rows = await supabaseFetch(env, 'countries?select=name&order=name.asc');
    return json({countries: rows.map((row) => row.name)});
  } catch (error) {
    return json({error: error.message}, {status: 500});
  }
}
