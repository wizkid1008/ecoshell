import {json, requireEnv, supabaseFetch} from '../lib/supabase.js';
import {resolveSession} from '../lib/auth.js';

export async function adminOverview({request, env}) {
  const envError = requireEnv(env, ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  if (envError) return json({error: envError}, {status: 500});
  const user = await resolveSession(request, env);
  if (!user || user.role !== 'admin') return json({error: 'Admin session is invalid or has expired. Please log in again.'}, {status: 401});

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
