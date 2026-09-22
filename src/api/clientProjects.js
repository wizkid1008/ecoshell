import {json, requireEnv, supabaseFetch} from '../lib/supabase.js';
import {resolveSession} from '../lib/auth.js';

export async function clientProjects({request, env}) {
  const envError = requireEnv(env, ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  if (envError) return json({error: envError}, {status: 500});

  try {
    const user = await resolveSession(request, env);
    if (!user) return json({error: 'Session is invalid or has expired. Please log in again.'}, {status: 401});

    const projects = await supabaseFetch(
      env,
      `projects?user_id=eq.${user.id}&select=id,reference_code,name,status,polymer,process,target,created_at,users(company_name),sample_requests(id,status,tracking_number),project_updates(id,audience,body,created_at)&order=created_at.desc`
    );

    return json({projects});
  } catch (error) {
    return json({error: error.message}, {status: 500});
  }
}
