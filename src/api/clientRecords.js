import {cleanString, json, requireEnv, supabaseFetch} from '../lib/supabase.js';
import {resolveSession} from '../lib/auth.js';
import {uploadDocumentFile, withSignedUrl} from '../lib/storage.js';

// Lets a client contact attach a file to one of their own company's
// opportunities. Always visibility: client -- a client can never create an
// internal-only document, unlike the admin upload endpoint.
export async function clientDocumentUpload({request, env}) {
  const envError = requireEnv(env, ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  if (envError) return json({error: envError}, {status: 500});
  const user = await resolveSession(request, env);
  if (!user) return json({error: 'Session is invalid or has expired. Please log in again.'}, {status: 401});
  if (!user.company_id) return json({error: 'No company on this account.'}, {status: 403});

  const form = await request.formData();
  const projectId = cleanString(form.get('project_id'));
  const title = cleanString(form.get('title'));
  const documentType = cleanString(form.get('document_type')) || null;
  const file = form.get('file');

  if (!projectId || !title || !(file && typeof file.arrayBuffer === 'function')) {
    return json({error: 'project_id, title and a file are required.'}, {status: 400});
  }

  try {
    const projects = await supabaseFetch(env, `projects?id=eq.${projectId}&company_id=eq.${user.company_id}&select=id`);
    if (!projects.length) return json({error: 'Opportunity not found.'}, {status: 404});

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
        visibility: 'client',
        created_by: user.email
      })
    });
    return json({document: await withSignedUrl(env, rows[0])});
  } catch (error) {
    return json({error: error.message}, {status: 500});
  }
}
