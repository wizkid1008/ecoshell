import {json, requireEnv, supabaseFetch} from '../lib/supabase.js';
import {resolveSession} from '../lib/auth.js';

export async function adminOverview({request, env}) {
  const envError = requireEnv(env, ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  if (envError) return json({error: envError}, {status: 500});
  const user = await resolveSession(request, env);
  if (!user || user.role !== 'admin') return json({error: 'Admin session is invalid or has expired. Please log in again.'}, {status: 401});

  try {
    const [enquiries, projects, samples, pilots, proposals, contracts, clients, admins, companies] = await Promise.all([
      supabaseFetch(env, 'enquiries?select=id,first_name,last_name,company,email,country,application,message,status,created_at&order=created_at.desc'),
      supabaseFetch(env, 'projects?select=id,reference_code,name,status,polymer,process,target,created_at,stage_changed_at,companies(name),owner:users!owner_id(name,email),contact:users!contact_id(name,email)&order=created_at.desc'),
      supabaseFetch(env, 'sample_requests?select=id,status,shipping_name,tracking_number,created_at,projects(reference_code,name,companies(name))&order=created_at.desc'),
      supabaseFetch(env, 'pilots?select=id,status,success_criteria,start_date,end_date,created_at,projects(reference_code,name,companies(name))&order=created_at.desc'),
      supabaseFetch(env, 'proposals?select=id,status,amount,currency,sent_at,created_at,projects(reference_code,name,companies(name))&order=created_at.desc'),
      supabaseFetch(env, 'contracts?select=id,status,value,currency,signed_at,created_at,projects(reference_code,name,companies(name))&order=created_at.desc'),
      supabaseFetch(env, 'users?role=eq.member&select=id,email,name,status,company_name,job_title,phone,country,industry,archetype,linkedin_url,created_at&order=created_at.desc'),
      supabaseFetch(env, 'users?role=eq.admin&select=id,email,name&order=name.asc'),
      supabaseFetch(env, 'companies?select=id,name,industry,archetype,country,website,geography,sustainable_packaging_coalition,principal_product_target,material_types,technical_process_fit,rank,time_to_paid_revenue,revenue_12_24m,downstream_multiplier,technical_fit,commitment_potential,strategic_value,engineering_efficiency,regulatory_simplicity,weighted_score,priority_tier,commercial_gate_status,why_it_fits,recommended_entry_proposition,next_action,scoring_basis,account_owner,notes,created_at&order=created_at.desc')
    ]);

    return json({enquiries, projects, samples, pilots, proposals, contracts, clients, admins, companies});
  } catch (error) {
    return json({error: error.message}, {status: 500});
  }
}
