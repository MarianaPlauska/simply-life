// Modelo do Gemini usado em todas as rotas de IA. O Google desliga modelos antigos
// (o gemini-2.0-flash saiu do ar em 1/6/2026), então o nome fica num lugar só e
// pode ser trocado pela variável GEMINI_MODEL sem mexer no código.
// Lista atual: https://ai.google.dev/gemini-api/docs/models

const PADRAO = 'gemini-3.5-flash-lite'

/** Nome do modelo, validado; `override` vem de uma variável específica da rota (ex.: GEMINI_FOOD_MODEL). */
export function geminiModel(override)
{
  const m = String(override || process.env.GEMINI_MODEL || '').trim()
  return /^[a-z0-9.\-]+$/i.test(m) ? m : PADRAO
}

/** URL do generateContent (v1beta) para a chave informada */
export function geminiUrl(apiKey, override)
{
  return `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel(override)}:generateContent?key=${apiKey}`
}
