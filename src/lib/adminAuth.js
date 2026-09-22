import {cleanString, supabaseFetch} from './supabase.js';

export async function requireAdminSession(request, env) {
  const sessionToken = cleanString(request.headers.get('x-admin-session'));
  if (!sessionToken) return null;

  const nowIso = new Date().toISOString();
  const sessions = await supabaseFetch(
    env,
    `admin_login_tokens?token=eq.${encodeURIComponent(sessionToken)}&kind=eq.session&expires_at=gt.${encodeURIComponent(nowIso)}&select=email`
  );

  return sessions[0]?.email || null;
}
