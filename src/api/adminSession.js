import {cleanString, generateToken, json, requireEnv, supabaseFetch} from '../lib/supabase.js';

export async function adminSession({request, env}) {
  const envError = requireEnv(env, ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  if (envError) return json({error: envError}, {status: 500});

  const url = new URL(request.url);
  const token = cleanString(url.searchParams.get('token'));
  if (!token) return json({error: 'Login token is required.'}, {status: 400});

  try {
    const nowIso = new Date().toISOString();
    const matches = await supabaseFetch(
      env,
      `admin_login_tokens?token=eq.${encodeURIComponent(token)}&kind=eq.magic&used_at=is.null&expires_at=gt.${encodeURIComponent(nowIso)}&select=id,email`
    );

    const magicToken = matches[0];
    if (!magicToken) return json({error: 'This login link is invalid or has expired.'}, {status: 401});

    await supabaseFetch(env, `admin_login_tokens?id=eq.${magicToken.id}`, {
      method: 'PATCH',
      body: JSON.stringify({used_at: nowIso})
    });

    const sessionToken = generateToken();
    const sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await supabaseFetch(env, 'admin_login_tokens', {
      method: 'POST',
      body: JSON.stringify({email: magicToken.email, token: sessionToken, kind: 'session', expires_at: sessionExpiresAt})
    });

    return json({session_token: sessionToken, email: magicToken.email});
  } catch (error) {
    return json({error: error.message}, {status: 500});
  }
}
