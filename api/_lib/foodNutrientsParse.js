// Leitura pura das respostas da IA para a Comida (kcal, proteína, açúcar, porção, fontes).
// Sem rede e sem process.env: testado em packages/shared/src/__tests__/foodNutrientsServer.test.ts.

import { stripDashes } from './noDashes.js'

export const MAX_KCAL = 3000
export const MAX_GRAMS = 300
export const MAX_SOURCES = 2

function toNumber(v)
{
  if (typeof v === 'number') return v
  if (typeof v === 'string')
  {
    // "18 g", "18,5", "~320" → número; texto sem número → NaN
    const m = v.replace(',', '.').match(/-?\d+(?:\.\d+)?/)
    return m ? Number(m[0]) : NaN
  }
  return NaN
}

export function clampKcal(v)
{
  if (v == null) return null
  const n = toNumber(v)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(Math.min(MAX_KCAL, n))
}

/** Gramas de 0 a 300; uma casa abaixo de 10 g, inteiro acima (sem falsa precisão). */
export function clampGrams(v)
{
  if (v == null || v === '') return null
  const n = toNumber(v)
  if (!Number.isFinite(n) || n < 0) return null
  const c = Math.min(MAX_GRAMS, n)
  return c < 10 ? Math.round(c * 10) / 10 : Math.round(c)
}

/** Só http(s), sem espaço, até 500 caracteres, sem repetir, no máximo 2. */
export function sanitizeUrls(list)
{
  if (!Array.isArray(list)) return []
  const out = []
  for (const raw of list)
  {
    if (typeof raw !== 'string') continue
    const u = raw.trim()
    if (u.length > 500 || !/^https?:\/\/[^\s"'<>]+$/i.test(u)) continue
    if (!out.includes(u)) out.push(u)
    if (out.length >= MAX_SOURCES) break
  }
  return out
}

/**
 * Acha o JSON dentro de um texto livre: tira cercas ```json, depois tenta o texto inteiro,
 * depois o trecho entre a primeira "{" e a última "}". null quando nada serve.
 */
export function extractJsonFromText(text)
{
  const raw = String(text || '').trim()
  if (!raw) return null
  const candidates = []
  const fenced = [...raw.matchAll(/```(?:json|JSON)?\s*([\s\S]*?)```/g)].map((m) => m[1].trim())
  candidates.push(...fenced, raw)
  for (const c of [...candidates])
  {
    const a = c.indexOf('{')
    const b = c.lastIndexOf('}')
    if (a >= 0 && b > a) candidates.push(c.slice(a, b + 1))
    const la = c.indexOf('[')
    const lb = c.lastIndexOf(']')
    if (la >= 0 && lb > la) candidates.push(c.slice(la, lb + 1))
  }
  for (const c of candidates)
  {
    try
    {
      return JSON.parse(c)
    }
    catch
    {
      // tenta o próximo; vírgula sobrando antes de } ou ] é comum
      try
      {
        return JSON.parse(c.replace(/,\s*([}\]])/g, '$1'))
      }
      catch
      {
        // segue
      }
    }
  }
  return null
}

/**
 * Resposta da IA → lista alinhada com o pedido, valores validados.
 * `fontesPorItem` (opcional) vem da pesquisa na web, alinhado pelo índice.
 */
export function normalizeFoodNutrientsAi(parsed, n, fontesPorItem = [])
{
  const arr = Array.isArray(parsed?.items) ? parsed.items : Array.isArray(parsed) ? parsed : []
  const out = []
  for (let i = 0; i < n; i++)
  {
    const r = arr[i]
    const kcal = clampKcal(r?.kcal)
    const conf = Number(r?.confianca)
    const porcao = typeof r?.porcao === 'string' ? stripDashes(r.porcao).replace(/\s+/g, ' ').trim().slice(0, 40) : null
    const fontes = kcal == null ? [] : sanitizeUrls(fontesPorItem[i] ?? [])
    const item = {
      kcal,
      proteina: kcal == null ? null : clampGrams(r?.proteina),
      acucar: kcal == null ? null : clampGrams(r?.acucar),
      porcao: kcal == null ? null : porcao || null,
      confianca: kcal == null ? 0 : Number.isFinite(conf) ? Math.max(0, Math.min(1, conf)) : 0.5,
    }
    if (fontes.length) item.fontes = fontes
    out.push(item)
  }
  return out
}

function fold(s)
{
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/**
 * Links da pesquisa do Gemini, por item. Usa groundingSupports quando o trecho citado fala do
 * item (pelo nome); sem isso, os primeiros links da resposta valem para todos os itens.
 */
export function groundingSourcesPerItem(metadata, itemNames)
{
  const chunks = Array.isArray(metadata?.groundingChunks) ? metadata.groundingChunks : []
  const uris = chunks.map((c) => (typeof c?.web?.uri === 'string' ? c.web.uri : null))
  const all = sanitizeUrls(uris.filter(Boolean))
  const supports = Array.isArray(metadata?.groundingSupports) ? metadata.groundingSupports : []
  return itemNames.map((nome) =>
  {
    const key = fold(nome).trim()
    const picked = []
    if (key)
    {
      for (const s of supports)
      {
        const seg = fold(s?.segment?.text)
        if (!seg.includes(key)) continue
        for (const idx of Array.isArray(s?.groundingChunkIndices) ? s.groundingChunkIndices : [])
        {
          const u = uris[idx]
          if (u) picked.push(u)
        }
      }
    }
    const own = sanitizeUrls(picked)
    return own.length ? own : all
  })
}

/**
 * Corpo inteiro da resposta do Gemini com google_search → { parsed, fontesPorItem }.
 * O JSON vem como texto (a busca não aceita responseMimeType JSON), às vezes com cercas
 * ou frase antes; o texto pode vir partido em várias partes.
 */
export function parseGroundedGeminiResponse(data, itemNames)
{
  const cand = data?.candidates?.[0]
  const parts = Array.isArray(cand?.content?.parts) ? cand.content.parts : []
  const text = stripDashes(parts.map((p) => (typeof p?.text === 'string' ? p.text : '')).join(''))
  const parsed = extractJsonFromText(text)
  const fontesPorItem = groundingSourcesPerItem(cand?.groundingMetadata, itemNames)
  return { parsed, fontesPorItem }
}
