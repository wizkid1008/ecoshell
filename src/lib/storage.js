import {resolveSecret} from './supabase.js';

const BUCKET = 'documents';
const SIGNED_URL_TTL_SECONDS = 3600;

export async function uploadDocumentFile(env, path, file) {
  const serviceRoleKey = await resolveSecret(env.SUPABASE_SERVICE_ROLE_KEY);
  const res = await fetch(`${env.SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      'content-type': file.type || 'application/octet-stream'
    },
    body: file
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed: ${text}`);
  }
}

async function signDocumentUrl(env, path) {
  const serviceRoleKey = await resolveSecret(env.SUPABASE_SERVICE_ROLE_KEY);
  const res = await fetch(`${env.SUPABASE_URL}/storage/v1/object/sign/${BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({expiresIn: SIGNED_URL_TTL_SECONDS})
  });
  if (!res.ok) return null;
  const body = await res.json();
  return body.signedURL ? `${env.SUPABASE_URL}/storage/v1${body.signedURL}` : null;
}

// A document either has a permanent url (linked) or a storage_path
// (uploaded) — only the latter needs a freshly signed link per request.
export async function withSignedUrl(env, doc) {
  if (doc && doc.storage_path && !doc.url) {
    return {...doc, url: await signDocumentUrl(env, doc.storage_path)};
  }
  return doc;
}

export async function withSignedUrls(env, docs) {
  return Promise.all((docs || []).map((doc) => withSignedUrl(env, doc)));
}
