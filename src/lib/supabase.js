export function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init.headers || {})
    }
  });
}

export function requireEnv(env, keys) {
  const missing = keys.filter((key) => env[key] === undefined || env[key] === null || env[key] === '');
  if (missing.length) {
    return `Missing required environment variables: ${missing.join(', ')}`;
  }
  return null;
}

// Secrets Store bindings are objects with an async .get(); plain vars are already strings.
export async function resolveSecret(value) {
  if (value && typeof value.get === 'function') {
    return await value.get();
  }
  return value;
}

export async function supabaseFetch(env, path, options = {}) {
  const serviceRoleKey = await resolveSecret(env.SUPABASE_SERVICE_ROLE_KEY);
  const url = `${env.SUPABASE_URL}/rest/v1/${path}`;
  const headers = {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    'content-type': 'application/json',
    ...(options.headers || {})
  };

  const res = await fetch(url, {...options, headers});
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const error = body?.message || body?.error || `Supabase request failed with ${res.status}`;
    throw new Error(error);
  }

  return body;
}

export function cleanString(value) {
  return String(value || '').trim();
}

export function generateToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
