import {json, requireEnv, supabaseFetch} from '../lib/supabase.js';

function isAdmin(request, env) {
  const token = request.headers.get('x-admin-token');
  return env.ADMIN_PORTAL_TOKEN && token === env.ADMIN_PORTAL_TOKEN;
}

export async function adminOverview({request, env}) {
  const envError = requireEnv(env, ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'ADMIN_PORTAL_TOKEN']);
  if (envError) return json({error: envError}, {status: 500});
  if (!isAdmin(request, env)) return json({error: 'Admin access required.'}, {status: 401});

  try {
    const [companies, enquiries, projects, samples] = await Promise.all([
      supabaseFetch(env, 'companies?select=id,name,region,industry,access_status,created_at&order=created_at.desc'),
      supabaseFetch(env, 'enquiries?select=id,first_name,last_name,company,email,country,application,message,status,created_at&order=created_at.desc'),
      supabaseFetch(env, 'projects?select=id,reference_code,name,status,polymer,process,target,created_at,companies(name)&order=created_at.desc'),
      supabaseFetch(env, 'sample_requests?select=id,status,shipping_name,tracking_number,created_at,projects(reference_code,name,companies(name))&order=created_at.desc')
    ]);

    return json({companies, enquiries, projects, samples});
  } catch (error) {
    return json({error: error.message}, {status: 500});
  }
}
