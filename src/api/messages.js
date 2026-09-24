import {cleanString, json, requireEnv, supabaseFetch} from '../lib/supabase.js';
import {resolveSession} from '../lib/auth.js';

const MESSAGE_SELECT = 'id,project_id,sender_role,body,created_by,created_at';

async function postMessage(env, projectId, senderRole, body, createdBy) {
  const rows = await supabaseFetch(env, `project_messages?select=${MESSAGE_SELECT}`, {
    method: 'POST',
    headers: {prefer: 'return=representation'},
    body: JSON.stringify({project_id: projectId, sender_role: senderRole, body, created_by: createdBy})
  });
  return rows[0];
}

// A client can only post to a project belonging to their own company.
export async function clientMessageCreate({request, env}) {
  const envError = requireEnv(env, ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  if (envError) return json({error: envError}, {status: 500});
  const user = await resolveSession(request, env);
  if (!user) return json({error: 'Session is invalid or has expired. Please log in again.'}, {status: 401});
  if (!user.company_id) return json({error: 'No company on this account.'}, {status: 403});

  const payload = await request.json();
  const projectId = cleanString(payload.project_id);
  const body = cleanString(payload.body);
  if (!projectId || !body) return json({error: 'project_id and body are required.'}, {status: 400});

  try {
    const projects = await supabaseFetch(env, `projects?id=eq.${projectId}&company_id=eq.${user.company_id}&select=id`);
    if (!projects.length) return json({error: 'Opportunity not found.'}, {status: 404});

    const message = await postMessage(env, projectId, 'client', body, user.email);
    return json({message});
  } catch (error) {
    return json({error: error.message}, {status: 500});
  }
}

export async function adminMessageCreate({request, env}) {
  const envError = requireEnv(env, ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  if (envError) return json({error: envError}, {status: 500});
  const user = await resolveSession(request, env);
  if (!user || user.role !== 'admin') return json({error: 'Admin session is invalid or has expired. Please log in again.'}, {status: 401});

  const payload = await request.json();
  const projectId = cleanString(payload.project_id);
  const body = cleanString(payload.body);
  if (!projectId || !body) return json({error: 'project_id and body are required.'}, {status: 400});

  try {
    const message = await postMessage(env, projectId, 'admin', body, user.email);
    return json({message});
  } catch (error) {
    return json({error: error.message}, {status: 500});
  }
}
