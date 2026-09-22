import {json, requireEnv, supabaseFetch} from '../lib/supabase.js';
import {resolveSession} from '../lib/auth.js';

export async function clientProjects({request, env}) {
  const envError = requireEnv(env, ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  if (envError) return json({error: envError}, {status: 500});

  try {
    const user = await resolveSession(request, env);
    if (!user) return json({error: 'Session is invalid or has expired. Please log in again.'}, {status: 401});

    if (!user.company_id) return json({projects: []});

    const projects = await supabaseFetch(
      env,
      `projects?company_id=eq.${user.company_id}&select=id,reference_code,name,status,polymer,process,target,created_at,companies(name),sample_requests(id,status,tracking_number,created_at),pilots(id,status,success_criteria,start_date,end_date,pilot_results(outcome,summary,created_at)),proposals(id,status,amount,currency,sent_at),contracts(id,status,value,currency,signed_at),project_documents(id,title,url,document_type,visibility),project_updates(id,body,created_at)&project_documents.visibility=eq.client&order=created_at.desc`
    );

    return json({projects});
  } catch (error) {
    return json({error: error.message}, {status: 500});
  }
}
