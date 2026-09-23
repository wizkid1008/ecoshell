import {cleanString, json, requireEnv, supabaseFetch} from '../lib/supabase.js';
import {resolveSession} from '../lib/auth.js';

function makeListGet(table) {
  return async function get({env}) {
    const envError = requireEnv(env, ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
    if (envError) return json({error: envError}, {status: 500});
    try {
      const rows = await supabaseFetch(env, `${table}?select=name&order=name.asc`);
      return json({[table]: rows.map((row) => row.name)});
    } catch (error) {
      return json({error: error.message}, {status: 500});
    }
  };
}

function makeListCreate(table) {
  return async function create({request, env}) {
    const envError = requireEnv(env, ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
    if (envError) return json({error: envError}, {status: 500});
    const user = await resolveSession(request, env);
    if (!user || user.role !== 'admin') return json({error: 'Admin session is invalid or has expired. Please log in again.'}, {status: 401});

    const payload = await request.json();
    const name = cleanString(payload.name);
    if (!name) return json({error: 'A name is required.'}, {status: 400});

    try {
      await supabaseFetch(env, table, {
        method: 'POST',
        headers: {prefer: 'resolution=ignore-duplicates'},
        body: JSON.stringify({name})
      });
      const rows = await supabaseFetch(env, `${table}?select=name&order=name.asc`);
      return json({[table]: rows.map((row) => row.name)});
    } catch (error) {
      return json({error: error.message}, {status: 500});
    }
  };
}

function makeListDelete(table) {
  return async function del({request, env}) {
    const envError = requireEnv(env, ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
    if (envError) return json({error: envError}, {status: 500});
    const user = await resolveSession(request, env);
    if (!user || user.role !== 'admin') return json({error: 'Admin session is invalid or has expired. Please log in again.'}, {status: 401});

    const payload = await request.json();
    const name = cleanString(payload.name);
    if (!name) return json({error: 'A name is required.'}, {status: 400});

    try {
      await supabaseFetch(env, `${table}?name=eq.${encodeURIComponent(name)}`, {method: 'DELETE'});
      const rows = await supabaseFetch(env, `${table}?select=name&order=name.asc`);
      return json({[table]: rows.map((row) => row.name)});
    } catch (error) {
      return json({error: error.message}, {status: 500});
    }
  };
}

export const industriesList = makeListGet('industries');
export const archetypesList = makeListGet('archetypes');
export const industryCreate = makeListCreate('industries');
export const archetypeCreate = makeListCreate('archetypes');
export const industryDelete = makeListDelete('industries');
export const archetypeDelete = makeListDelete('archetypes');

export const polymersList = makeListGet('polymers');
export const processesList = makeListGet('processes');
export const polymerCreate = makeListCreate('polymers');
export const processCreate = makeListCreate('processes');
export const polymerDelete = makeListDelete('polymers');
export const processDelete = makeListDelete('processes');
