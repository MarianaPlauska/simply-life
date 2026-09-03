/** Keywords do usuário - preferencias_usuario + palavras_chave (Supabase) */

export const KEYWORD_BOOST_DEFAULT = 50;

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @returns {Promise<string[]>}
 */
export async function fetchUserKeywords(supabase, userId)
{
  const terms = new Set();

  const { data: prefs } = await supabase
    .from('preferencias_usuario')
    .select('palavras_chave_email')
    .eq('user_id', userId)
    .maybeSingle();

  if (prefs?.palavras_chave_email)
  {
    prefs.palavras_chave_email
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean)
      .forEach((k) => terms.add(k));
  }

  const { data: rows } = await supabase
    .from('palavras_chave')
    .select('termo, peso')
    .eq('user_id', userId);

  if (rows)
  {
    for (const row of rows)
    {
      if (row.termo) terms.add(String(row.termo).trim().toLowerCase());
    }
  }

  return Array.from(terms);
}

/**
 * @param {string} rawText
 * @param {string[]} keywords
 * @param {number} [boostAmount]
 */
export function matchUserKeywords(rawText, keywords, boostAmount = KEYWORD_BOOST_DEFAULT)
{
  if (!keywords?.length) return { boost: 0, matched: [] };

  const haystack = (rawText || '').toLowerCase();
  const matched = keywords.filter((kw) => haystack.includes(kw));

  return {
    boost: matched.length > 0 ? boostAmount : 0,
    matched,
  };
}
