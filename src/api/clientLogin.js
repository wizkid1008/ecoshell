import {cleanString, generateToken, json, requireEnv, supabaseFetch} from '../lib/supabase.js';
import {hashPassword, verifyPassword} from '../lib/password.js';

export async function clientLogin({request, env}) {
  const envError = requireEnv(env, ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  if (envError) return json({error: envError}, {status: 500});

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({error: 'Invalid JSON body.'}, {status: 400});
  }

  const email = cleanString(payload.email).toLowerCase();
  const password = String(payload.password || '');
  if (!email || !password) return json({error: 'Email and password are required.'}, {status: 400});

  try {
    const accounts = await supabaseFetch(env, `client_accounts?email=eq.${encodeURIComponent(email)}&select=id,password_hash`);
    let account = accounts[0];

    if (!account) {
      if (password.length < 8) return json({error: 'Password must be at least 8 characters.'}, {status: 400});
      const hash = await hashPassword(password);
      const inserted = await supabaseFetch(env, 'client_accounts?select=id,password_hash', {
        method: 'POST',
        headers: {prefer: 'return=representation'},
        body: JSON.stringify({email, password_hash: hash})
      });
      account = inserted[0];
    } else {
      const ok = await verifyPassword(password, account.password_hash);
      if (!ok) return json({error: 'Incorrect email or password.'}, {status: 401});
    }

    const sessionToken = generateToken();
    const sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await supabaseFetch(env, 'client_login_tokens', {
      method: 'POST',
      body: JSON.stringify({email, token: sessionToken, kind: 'session', expires_at: sessionExpiresAt})
    });

    return json({session_token: sessionToken, email});
  } catch (error) {
    return json({error: error.message}, {status: 500});
  }
}
