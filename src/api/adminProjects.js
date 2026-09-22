import {json, requireEnv, supabaseFetch} from '../lib/supabase.js';
import {resolveSession} from '../lib/auth.js';
import {isValidStage} from '../lib/pipeline.js';

export async function adminProjectsUpdate({request, env}) {
  const envError = requireEnv(env, ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  if (envError) return json({error: envError}, {status: 500});
  const user = await resolveSession(request, env);
  if (!user || user.role !== 'admin') return json({error: 'Admin session is invalid or has expired. Please log in again.'}, {status: 401});

  const payload = await request.json();
  if (!payload.id) return json({error: 'Project id is required.'}, {status: 400});

  if (payload.status !== undefined && !isValidStage(payload.status)) {
    return json({error: 'Invalid pipeline stage.'}, {status: 400});
  }

  const update = {};
  ['status', 'polymer', 'process', 'target'].forEach((key) => {
    if (payload[key] !== undefined) update[key] = payload[key];
  });
  if (payload.owner_id !== undefined) update.owner_id = payload.owner_id || null;

  try {
    if (update.owner_id) {
      const owners = await supabaseFetch(env, `users?id=eq.${update.owner_id}&role=eq.admin&select=id`);
      if (!owners.length) return json({error: 'Owner must be an existing admin.'}, {status: 400});
    }

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
          created_by: user.email
        })
      });
    }

    if (payload.internal_note) {
      await supabaseFetch(env, 'internal_notes', {
        method: 'POST',
        body: JSON.stringify({
          project_id: payload.id,
          body: payload.internal_note,
          created_by: user.email
        })
      });
    }

    return json({project: project[0]});
  } catch (error) {
    return json({error: error.message}, {status: 500});
  }
}
