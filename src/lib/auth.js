import {cleanString, supabaseFetch} from './supabase.js';

export async function resolveSession(request, env) {
  const token = cleanString(request.headers.get('x-session'));
  if (!token) return null;

  const nowIso = new Date().toISOString();
  const sessions = await supabaseFetch(
    env,
    `login_tokens?token=eq.${encodeURIComponent(token)}&kind=eq.session&expires_at=gt.${encodeURIComponent(nowIso)}&select=email`
  );

  const session = sessions[0];
  if (!session) return null;

  const users = await supabaseFetch(env, `users?email=eq.${encodeURIComponent(session.email)}&select=id,email,role,status`);
  return users[0] || null;
}
