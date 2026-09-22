import {cleanString, json, requireEnv, supabaseFetch} from '../lib/supabase.js';
import {resolveSession} from '../lib/auth.js';
import {findOrCreateCompany} from '../lib/companies.js';
import {isValidStage} from '../lib/pipeline.js';

async function requireAdmin(request, env) {
  const envError = requireEnv(env, ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  if (envError) return {error: json({error: envError}, {status: 500})};
  const user = await resolveSession(request, env);
  if (!user || user.role !== 'admin') return {error: json({error: 'Admin session is invalid or has expired. Please log in again.'}, {status: 401})};
  return {user};
}

function pick(payload, fields) {
  const out = {};
  fields.forEach((key) => {
    if (payload[key] !== undefined) out[key] = payload[key];
  });
  return out;
}

export async function opportunityCreate({request, env}) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  const payload = await request.json();
  const companyName = cleanString(payload.company_name);
  const contactEmail = cleanString(payload.contact_email).toLowerCase();
  const name = cleanString(payload.name);

  if (!companyName || !contactEmail || !name) {
    return json({error: 'Company name, contact email and opportunity name are required.'}, {status: 400});
  }
  if (payload.status !== undefined && !isValidStage(payload.status)) {
    return json({error: 'Invalid pipeline stage.'}, {status: 400});
  }

  try {
    const companyId = await findOrCreateCompany(env, companyName);

    const existing = await supabaseFetch(env, `users?email=eq.${encodeURIComponent(contactEmail)}&select=id,company_id`);
    let contactId = existing[0]?.id;

    if (!contactId) {
      const inserted = await supabaseFetch(env, 'users?select=id', {
        method: 'POST',
        headers: {prefer: 'return=representation'},
        body: JSON.stringify({
          email: contactEmail,
          role: 'member',
          status: 'lead',
          name: cleanString(payload.contact_name) || null,
          company_id: companyId,
          company_name: companyName
        })
      });
      contactId = inserted[0].id;
    } else if (!existing[0].company_id) {
      await supabaseFetch(env, `users?id=eq.${contactId}`, {
        method: 'PATCH',
        body: JSON.stringify({company_id: companyId, company_name: companyName})
      });
    }

    const rows = await supabaseFetch(env, 'projects?select=id,reference_code,name,status', {
      method: 'POST',
      headers: {prefer: 'return=representation'},
      body: JSON.stringify({
        company_id: companyId,
        contact_id: contactId,
        name,
        status: payload.status || 'new_inquiry',
        ...pick(payload, ['polymer', 'process', 'target'])
      })
    });

    return json({project: rows[0]});
  } catch (error) {
    return json({error: error.message}, {status: 500});
  }
}

export async function sampleCreate({request, env}) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  const payload = await request.json();
  if (!payload.project_id) return json({error: 'project_id is required.'}, {status: 400});

  try {
    const rows = await supabaseFetch(env, 'sample_requests?select=id,status,shipping_name,shipping_address,tracking_number,admin_note,created_at', {
      method: 'POST',
      headers: {prefer: 'return=representation'},
      body: JSON.stringify({
        project_id: payload.project_id,
        ...pick(payload, ['status', 'shipping_name', 'shipping_address', 'tracking_number', 'admin_note'])
      })
    });
    return json({sample: rows[0]});
  } catch (error) {
    return json({error: error.message}, {status: 500});
  }
}

export async function pilotCreate({request, env}) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  const payload = await request.json();
  if (!payload.project_id) return json({error: 'project_id is required.'}, {status: 400});

  try {
    const rows = await supabaseFetch(env, 'pilots?select=id,status,success_criteria,start_date,end_date,created_at', {
      method: 'POST',
      headers: {prefer: 'return=representation'},
      body: JSON.stringify({
        project_id: payload.project_id,
        ...pick(payload, ['status', 'success_criteria', 'start_date', 'end_date'])
      })
    });
    return json({pilot: rows[0]});
  } catch (error) {
    return json({error: error.message}, {status: 500});
  }
}

export async function pilotResultCreate({request, env}) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  const payload = await request.json();
  if (!payload.pilot_id) return json({error: 'pilot_id is required.'}, {status: 400});
  if (!payload.summary) return json({error: 'summary is required.'}, {status: 400});

  try {
    const rows = await supabaseFetch(env, 'pilot_results?select=id,outcome,summary,recorded_by,created_at', {
      method: 'POST',
      headers: {prefer: 'return=representation'},
      body: JSON.stringify({
        pilot_id: payload.pilot_id,
        outcome: payload.outcome || null,
        summary: payload.summary,
        recorded_by: auth.user.email
      })
    });
    return json({result: rows[0]});
  } catch (error) {
    return json({error: error.message}, {status: 500});
  }
}

export async function proposalCreate({request, env}) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  const payload = await request.json();
  if (!payload.project_id) return json({error: 'project_id is required.'}, {status: 400});

  try {
    const rows = await supabaseFetch(env, 'proposals?select=id,status,amount,currency,terms,sent_at,created_at', {
      method: 'POST',
      headers: {prefer: 'return=representation'},
      body: JSON.stringify({
        project_id: payload.project_id,
        ...pick(payload, ['status', 'amount', 'currency', 'terms', 'sent_at'])
      })
    });
    return json({proposal: rows[0]});
  } catch (error) {
    return json({error: error.message}, {status: 500});
  }
}

export async function contractCreate({request, env}) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  const payload = await request.json();
  if (!payload.project_id) return json({error: 'project_id is required.'}, {status: 400});

  try {
    const rows = await supabaseFetch(env, 'contracts?select=id,status,value,currency,term,signed_at,created_at', {
      method: 'POST',
      headers: {prefer: 'return=representation'},
      body: JSON.stringify({
        project_id: payload.project_id,
        ...pick(payload, ['status', 'value', 'currency', 'term', 'signed_at'])
      })
    });
    return json({contract: rows[0]});
  } catch (error) {
    return json({error: error.message}, {status: 500});
  }
}

export async function documentCreate({request, env}) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  const payload = await request.json();
  if (!payload.project_id || !payload.title || !payload.url) {
    return json({error: 'project_id, title and url are required.'}, {status: 400});
  }

  try {
    const rows = await supabaseFetch(env, 'project_documents?select=id,title,url,document_type,visibility,created_at', {
      method: 'POST',
      headers: {prefer: 'return=representation'},
      body: JSON.stringify({
        project_id: payload.project_id,
        title: payload.title,
        url: payload.url,
        document_type: payload.document_type || null,
        visibility: payload.visibility === 'internal' ? 'internal' : 'client'
      })
    });
    return json({document: rows[0]});
  } catch (error) {
    return json({error: error.message}, {status: 500});
  }
}
