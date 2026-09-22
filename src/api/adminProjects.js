import {json, requireEnv, supabaseFetch} from '../lib/supabase.js';
import {requireAdminSession} from '../lib/adminAuth.js';

export async function adminProjectsUpdate({request, env}) {
  const envError = requireEnv(env, ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  if (envError) return json({error: envError}, {status: 500});
  const adminEmail = await requireAdminSession(request, env);
  if (!adminEmail) return json({error: 'Admin session is invalid or has expired. Please log in again.'}, {status: 401});

  const payload = await request.json();
  if (!payload.id) return json({error: 'Project id is required.'}, {status: 400});

  const update = {};
  ['status', 'polymer', 'process', 'target'].forEach((key) => {
    if (payload[key] !== undefined) update[key] = payload[key];
  });

  try {
    const project = await supabaseFetch(env, `projects?id=eq.${payload.id}&select=id,reference_code,status`, {
      method: 'PATCH',
      headers: {prefer: 'return=representation'},
      body: JSON.stringify(update)
    });

    if (payload.client_update) {
      await supabaseFetch(env, 'project_updates', {
        method: 'POST',
        body: JSON.stringify({
          project_id: payload.id,
          audience: 'client',
          body: payload.client_update,
          created_by: adminEmail
        })
      });
    }

    return json({project: project[0]});
  } catch (error) {
    return json({error: error.message}, {status: 500});
  }
}
