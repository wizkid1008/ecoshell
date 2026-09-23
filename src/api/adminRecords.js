import {cleanString, json, requireEnv, supabaseFetch} from '../lib/supabase.js';
import {resolveSession} from '../lib/auth.js';
import {findOrCreateCompany} from '../lib/companies.js';
import {isValidStage} from '../lib/pipeline.js';
import {uploadDocumentFile, withSignedUrl} from '../lib/storage.js';
import {COMPANY_RESEARCH_FIELDS, COMPANY_SELECT} from '../lib/companyFields.js';

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
    const rows = await supabaseFetch(env, 'sample_requests?select=id,status,shipping_name,shipping_address,tracking_number,admin_note,created_by,created_at', {
      method: 'POST',
      headers: {prefer: 'return=representation'},
      body: JSON.stringify({
        project_id: payload.project_id,
        created_by: auth.user.email,
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
    const rows = await supabaseFetch(env, 'pilots?select=id,status,success_criteria,start_date,end_date,created_by,created_at', {
      method: 'POST',
      headers: {prefer: 'return=representation'},
      body: JSON.stringify({
        project_id: payload.project_id,
        created_by: auth.user.email,
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
    const rows = await supabaseFetch(env, 'proposals?select=id,status,amount,currency,terms,sent_at,created_by,created_at', {
      method: 'POST',
      headers: {prefer: 'return=representation'},
      body: JSON.stringify({
        project_id: payload.project_id,
        created_by: auth.user.email,
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
    const rows = await supabaseFetch(env, 'contracts?select=id,status,value,currency,term,signed_at,created_by,created_at', {
      method: 'POST',
      headers: {prefer: 'return=representation'},
      body: JSON.stringify({
        project_id: payload.project_id,
        created_by: auth.user.email,
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
    const rows = await supabaseFetch(env, 'project_documents?select=id,title,url,document_type,visibility,created_by,created_at', {
      method: 'POST',
      headers: {prefer: 'return=representation'},
      body: JSON.stringify({
        project_id: payload.project_id,
        title: payload.title,
        url: payload.url,
        document_type: payload.document_type || null,
        visibility: payload.visibility === 'internal' ? 'internal' : 'client',
        created_by: auth.user.email
      })
    });
    return json({document: rows[0]});
  } catch (error) {
    return json({error: error.message}, {status: 500});
  }
}

export async function documentUpload({request, env}) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  const form = await request.formData();
  const projectId = cleanString(form.get('project_id'));
  const title = cleanString(form.get('title'));
  const documentType = cleanString(form.get('document_type')) || null;
  const visibility = form.get('visibility') === 'internal' ? 'internal' : 'client';
  const file = form.get('file');

  if (!projectId || !title || !(file && typeof file.arrayBuffer === 'function')) {
    return json({error: 'project_id, title and a file are required.'}, {status: 400});
  }

  try {
    const path = `${projectId}/${Date.now()}-${file.name}`;
    await uploadDocumentFile(env, path, file);

    const rows = await supabaseFetch(env, 'project_documents?select=id,title,url,storage_path,document_type,visibility,created_by,created_at', {
      method: 'POST',
      headers: {prefer: 'return=representation'},
      body: JSON.stringify({
        project_id: projectId,
        title,
        storage_path: path,
        document_type: documentType,
        visibility,
        created_by: auth.user.email
      })
    });
    return json({document: await withSignedUrl(env, rows[0])});
  } catch (error) {
    return json({error: error.message}, {status: 500});
  }
}

function makeUpdater(table, fields, select) {
  return async function update({request, env}) {
    const auth = await requireAdmin(request, env);
    if (auth.error) return auth.error;

    const payload = await request.json();
    if (!payload.id) return json({error: 'id is required.'}, {status: 400});

    const update = pick(payload, fields);
    if (!Object.keys(update).length) return json({error: 'No fields to update.'}, {status: 400});

    try {
      const rows = await supabaseFetch(env, `${table}?id=eq.${payload.id}&select=${select}`, {
        method: 'PATCH',
        headers: {prefer: 'return=representation'},
        body: JSON.stringify(update)
      });
      if (!rows.length) return json({error: 'Not found.'}, {status: 404});
      return json({record: rows[0]});
    } catch (error) {
      return json({error: error.message}, {status: 500});
    }
  };
}

export const sampleUpdate = makeUpdater(
  'sample_requests',
  ['status', 'shipping_name', 'shipping_address', 'tracking_number', 'admin_note'],
  'id,status,shipping_name,shipping_address,tracking_number,admin_note,created_by,created_at'
);

export const pilotUpdate = makeUpdater(
  'pilots',
  ['status', 'success_criteria', 'start_date', 'end_date'],
  'id,status,success_criteria,start_date,end_date,created_by,created_at'
);

export const pilotResultUpdate = makeUpdater(
  'pilot_results',
  ['outcome', 'summary'],
  'id,outcome,summary,recorded_by,created_at'
);

export const proposalUpdate = makeUpdater(
  'proposals',
  ['status', 'amount', 'currency', 'terms', 'sent_at'],
  'id,status,amount,currency,terms,sent_at,created_by,created_at'
);

export const contractUpdate = makeUpdater(
  'contracts',
  ['status', 'value', 'currency', 'term', 'signed_at'],
  'id,status,value,currency,term,signed_at,created_by,created_at'
);

export const documentUpdate = makeUpdater(
  'project_documents',
  ['title', 'url', 'document_type', 'visibility'],
  'id,title,url,storage_path,document_type,visibility,created_by,created_at'
);

export const noteUpdate = makeUpdater(
  'internal_notes',
  ['body'],
  'id,body,created_by,created_at'
);

export const clientUpdateEdit = makeUpdater(
  'project_updates',
  ['body'],
  'id,body,created_by,created_at'
);

export async function companyUpdate({request, env}) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  const payload = await request.json();
  if (!payload.id) return json({error: 'id is required.'}, {status: 400});

  const update = pick(payload, ['name', ...COMPANY_RESEARCH_FIELDS]);
  if (!Object.keys(update).length) return json({error: 'No fields to update.'}, {status: 400});

  try {
    const rows = await supabaseFetch(env, `companies?id=eq.${payload.id}&select=${COMPANY_SELECT}`, {
      method: 'PATCH',
      headers: {prefer: 'return=representation'},
      body: JSON.stringify(update)
    });
    if (!rows.length) return json({error: 'Not found.'}, {status: 404});
    return json({company: rows[0]});
  } catch (error) {
    return json({error: error.message}, {status: 500});
  }
}

const CLIENT_FIELDS = 'id,email,name,role,status,company_name,job_title,phone,country,industry,archetype,linkedin_url,created_at';
const CLIENT_STATUSES = ['lead', 'contact', 'client'];

export async function companyCreate({request, env}) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  const payload = await request.json();
  const name = cleanString(payload.name);
  if (!name) return json({error: 'Company name is required.'}, {status: 400});

  const extra = pick(payload, ['industry', 'archetype', 'country']);

  try {
    const existing = await supabaseFetch(env, `companies?name=ilike.${encodeURIComponent(name)}&select=id`);
    let rows;
    if (existing[0]) {
      rows = Object.keys(extra).length
        ? await supabaseFetch(env, `companies?id=eq.${existing[0].id}&select=${COMPANY_SELECT}`, {
            method: 'PATCH',
            headers: {prefer: 'return=representation'},
            body: JSON.stringify(extra)
          })
        : await supabaseFetch(env, `companies?id=eq.${existing[0].id}&select=${COMPANY_SELECT}`);
    } else {
      rows = await supabaseFetch(env, `companies?select=${COMPANY_SELECT}`, {
        method: 'POST',
        headers: {prefer: 'return=representation'},
        body: JSON.stringify({name, ...extra})
      });
    }
    return json({company: rows[0]});
  } catch (error) {
    return json({error: error.message}, {status: 500});
  }
}

export async function contactCreate({request, env}) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  const payload = await request.json();
  const email = cleanString(payload.email).toLowerCase();
  if (!email) return json({error: 'Email is required.'}, {status: 400});
  if (payload.status !== undefined && !CLIENT_STATUSES.includes(payload.status)) {
    return json({error: 'Invalid status.'}, {status: 400});
  }

  try {
    const existing = await supabaseFetch(env, `users?email=eq.${encodeURIComponent(email)}&select=id`);
    if (existing.length) return json({error: 'A contact with this email already exists.'}, {status: 400});

    const companyName = cleanString(payload.company_name);
    if (payload.country) {
      const matches = await supabaseFetch(env, `countries?name=eq.${encodeURIComponent(payload.country)}&select=name`);
      if (!matches.length) return json({error: 'Invalid country.'}, {status: 400});
    }

    const insert = {
      email,
      name: cleanString(payload.name) || null,
      role: 'member',
      status: payload.status || 'lead',
      company_name: companyName || null,
      company_id: companyName ? await findOrCreateCompany(env, companyName) : null,
      ...pick(payload, ['job_title', 'phone', 'country', 'industry', 'archetype', 'linkedin_url'])
    };

    const rows = await supabaseFetch(env, `users?select=${CLIENT_FIELDS}`, {
      method: 'POST',
      headers: {prefer: 'return=representation'},
      body: JSON.stringify(insert)
    });
    return json({client: rows[0]});
  } catch (error) {
    return json({error: error.message}, {status: 500});
  }
}

export async function clientUpdate({request, env}) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  const payload = await request.json();
  if (!payload.id) return json({error: 'id is required.'}, {status: 400});
  if (payload.status !== undefined && !CLIENT_STATUSES.includes(payload.status)) {
    return json({error: 'Invalid status.'}, {status: 400});
  }

  const update = pick(payload, ['name', 'status', 'job_title', 'phone', 'country', 'industry', 'archetype', 'linkedin_url']);
  if (!Object.keys(update).length) return json({error: 'No fields to update.'}, {status: 400});

  try {
    if (update.country) {
      const matches = await supabaseFetch(env, `countries?name=eq.${encodeURIComponent(update.country)}&select=name`);
      if (!matches.length) return json({error: 'Invalid country.'}, {status: 400});
    }
    if (payload.company_name !== undefined) {
      const companyName = cleanString(payload.company_name);
      update.company_name = companyName || null;
      update.company_id = companyName ? await findOrCreateCompany(env, companyName) : null;
    }

    const rows = await supabaseFetch(env, `users?id=eq.${payload.id}&role=eq.member&select=${CLIENT_FIELDS}`, {
      method: 'PATCH',
      headers: {prefer: 'return=representation'},
      body: JSON.stringify(update)
    });
    if (!rows.length) return json({error: 'Not found.'}, {status: 404});
    return json({client: rows[0]});
  } catch (error) {
    return json({error: error.message}, {status: 500});
  }
}
