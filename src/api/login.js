import {cleanString, generateToken, json, requireEnv, supabaseFetch} from '../lib/supabase.js';
import {hashPassword, verifyPassword} from '../lib/password.js';

export async function login({request, env}) {
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
    const existing = await supabaseFetch(env, `users?email=eq.${encodeURIComponent(email)}&select=id,password_hash,role,status`);
    let user = existing[0];

    if (!user) {
      if (password.length < 8) return json({error: 'Password must be at least 8 characters.'}, {status: 400});
      const hash = await hashPassword(password);
      const inserted = await supabaseFetch(env, 'users?select=id,password_hash,role,status', {
        method: 'POST',
        headers: {prefer: 'return=representation'},
        body: JSON.stringify({email, password_hash: hash, role: 'member', status: 'contact'})
      });
      user = inserted[0];
    } else if (!user.password_hash) {
      if (password.length < 8) return json({error: 'Password must be at least 8 characters.'}, {status: 400});
      const hash = await hashPassword(password);
      const update = {password_hash: hash};
      if (user.role === 'member' && user.status === 'lead') update.status = 'contact';
      await supabaseFetch(env, `users?id=eq.${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify(update)
      });
      Object.assign(user, update);
    } else {
      const ok = await verifyPassword(password, user.password_hash);
      if (!ok) return json({error: 'Incorrect email or password.'}, {status: 401});
    }

    const sessionToken = generateToken();
    const sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await supabaseFetch(env, 'login_tokens', {
      method: 'POST',
      body: JSON.stringify({email, token: sessionToken, kind: 'session', expires_at: sessionExpiresAt})
    });

    return json({session_token: sessionToken, email, role: user.role, status: user.status});
  } catch (error) {
    return json({error: error.message}, {status: 500});
  }
}
