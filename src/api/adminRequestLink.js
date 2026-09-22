import {cleanString, generateToken, json, requireEnv, sendEmail, supabaseFetch} from '../lib/supabase.js';

const GENERIC_RESPONSE = {ok: true, message: 'If that email has admin access, a login link has been sent.'};

export async function adminRequestLink({request, env}) {
  const envError = requireEnv(env, ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY', 'RESEND_FROM_EMAIL', 'PUBLIC_SITE_URL']);
  if (envError) return json({error: envError}, {status: 500});

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({error: 'Invalid JSON body.'}, {status: 400});
  }

  const email = cleanString(payload.email).toLowerCase();
  if (!email) return json({error: 'Email is required.'}, {status: 400});

  try {
    const admins = await supabaseFetch(env, `admin_users?email=eq.${encodeURIComponent(email)}&select=id&limit=1`);
    if (!admins.length) return json(GENERIC_RESPONSE);

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await supabaseFetch(env, 'admin_login_tokens', {
      method: 'POST',
      body: JSON.stringify({email, token, kind: 'magic', expires_at: expiresAt})
    });

    const link = `${env.PUBLIC_SITE_URL.replace(/\/$/, '')}/admin.html?token=${token}`;

    await sendEmail(env, {
      to: email,
      subject: 'Your Ecoshell admin login link',
      html: `<p>Use the link below to open the Ecoshell admin dashboard. This link expires in 15 minutes and can only be used once.</p><p><a href="${link}">${link}</a></p>`
    });

    return json(GENERIC_RESPONSE);
  } catch (error) {
    return json({error: error.message}, {status: 500});
  }
}
