/**
 * Estimativa de calorias, proteína e açúcar pela IA da Vercel (POST /api/axel/estimate-food-kcal).
 * O servidor tenta o Gemini com pesquisa na web (devolve até 2 links por item) e depois o Groq.
 * Nunca falha: sem conta, sem rede ou sem IA, devolve só nulos e a tela usa a tabela local.
 * Campos desconhecidos na resposta são ignorados (normalizeFoodKcalAiResponse).
 */
import {
  FOOD_KCAL_AI_MAX_ITEMS,
  buildFoodKcalAiRequest,
  normalizeFoodKcalAiResponse,
  type FoodKcalAiResponse,
  type FoodKcalCandidate,
  type FoodMealType,
} from '@simply-life/shared'
import { apiFetch } from './apiBase'
import { supabase, supabaseConfigured } from './supabase'

/** o servidor desiste em ~14 s (pesquisa na web + reserva); aqui um pouco mais */
const AI_TIMEOUT_MS = 18000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T>
{
  return new Promise((resolve, reject) =>
  {
    const timer = setTimeout(() => reject(new Error('timeout')), ms)
    promise.then(
      (v) =>
      {
        clearTimeout(timer)
        resolve(v)
      },
      (e) =>
      {
        clearTimeout(timer)
        reject(e)
      },
    )
  })
}

/** Candidatos da IA alinhados com `items` (null onde não veio nada). */
export async function estimateKcalWithAi(
  items: { nome: string; quantidade?: string | null }[],
  tipo: FoodMealType,
  opts: { isGuest?: boolean } = {},
): Promise<(FoodKcalCandidate | null)[]>
{
  const none = items.map(() => null)
  if (!items.length || opts.isGuest || !supabaseConfigured) return none
  try
  {
    const { data: session } = await supabase.auth.getSession()
    const token = session.session?.access_token
    if (!token) return none
    const out: (FoodKcalCandidate | null)[] = []
    for (let i = 0; i < items.length; i += FOOD_KCAL_AI_MAX_ITEMS)
    {
      const chunk = items.slice(i, i + FOOD_KCAL_AI_MAX_ITEMS)
      const res = await withTimeout(
        apiFetch('/api/axel/estimate-food-kcal', { method: 'POST', token, body: buildFoodKcalAiRequest(chunk, tipo) }),
        AI_TIMEOUT_MS,
      )
      if (!res.ok) return [...out, ...items.slice(i).map(() => null)]
      const json = (await res.json().catch(() => null)) as FoodKcalAiResponse | null
      out.push(...normalizeFoodKcalAiResponse(json, chunk.length))
    }
    return out
  }
  catch
  {
    return none
  }
}
