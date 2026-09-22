import {cleanString, json, requireEnv, supabaseFetch} from '../lib/supabase.js';
import {resolveSession} from '../lib/auth.js';

export async function opportunityDetail({request, env}) {
  const envError = requireEnv(env, ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  if (envError) return json({error: envError}, {status: 500});
  const user = await resolveSession(request, env);
  if (!user || user.role !== 'admin') return json({error: 'Admin session is invalid or has expired. Please log in again.'}, {status: 401});

  const url = new URL(request.url);
  const id = cleanString(url.searchParams.get('id'));
  if (!id) return json({error: 'Opportunity id is required.'}, {status: 400});

  try {
    const [projectRows, samples, pilots, proposals, contracts, documents, updates, notes] = await Promise.all([
      supabaseFetch(env, `projects?id=eq.${id}&select=id,reference_code,name,status,polymer,process,target,created_at,companies(id,name,industry,archetype,country),owner:users!owner_id(id,name,email),contact:users!contact_id(id,name,email,job_title,phone)`),
      supabaseFetch(env, `sample_requests?project_id=eq.${id}&select=id,status,shipping_name,shipping_address,tracking_number,admin_note,created_at&order=created_at.desc`),
      supabaseFetch(env, `pilots?project_id=eq.${id}&select=id,status,success_criteria,start_date,end_date,created_at,pilot_results(id,outcome,summary,recorded_by,created_at)&order=created_at.desc`),
      supabaseFetch(env, `proposals?project_id=eq.${id}&select=id,status,amount,currency,terms,sent_at,created_at&order=created_at.desc`),
      supabaseFetch(env, `contracts?project_id=eq.${id}&select=id,status,value,currency,term,signed_at,created_at&order=created_at.desc`),
      supabaseFetch(env, `project_documents?project_id=eq.${id}&select=id,title,url,document_type,visibility,created_at&order=created_at.desc`),
      supabaseFetch(env, `project_updates?project_id=eq.${id}&select=id,body,created_by,created_at&order=created_at.desc`),
      supabaseFetch(env, `internal_notes?project_id=eq.${id}&select=id,body,created_by,created_at&order=created_at.desc`)
    ]);

    const project = projectRows[0];
    if (!project) return json({error: 'Opportunity not found.'}, {status: 404});

    return json({project, samples, pilots, proposals, contracts, documents, updates, notes});
  } catch (error) {
    return json({error: error.message}, {status: 500});
  }
}
