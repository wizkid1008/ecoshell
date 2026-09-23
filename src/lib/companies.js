import {pgQuote, supabaseFetch} from './supabase.js';

// Companies aren't deduped by a unique constraint (names can legitimately
// collide across regions), so this matches case-insensitively on name and
// creates one if nothing matches yet.
export async function findOrCreateCompany(env, name, extra = {}) {
  const trimmed = String(name || '').trim();
  if (!trimmed) return null;

  const existing = await supabaseFetch(env, `companies?name=ilike.${encodeURIComponent(pgQuote(trimmed))}&select=id&limit=1`);
  if (existing[0]) return existing[0].id;

  const inserted = await supabaseFetch(env, 'companies?select=id', {
    method: 'POST',
    headers: {prefer: 'return=representation'},
    body: JSON.stringify({name: trimmed, ...extra})
  });
  return inserted[0].id;
}
