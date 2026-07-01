import { supabaseAuthHeaders } from './supabaseAuthHeaders'
import { estimateProteinFromText, type ProteinParseResult } from './proteinMealParser'
import { kcalFromProteinGrams } from './healthNutrition'
import type { RefeicaoId } from '../constants/proteinFoods'

export interface ProteinEstimateApiResponse
{
  gramas: number
  kcal?: number
  matches: Array<{ label: string; gramas: number }>
  confianca: 'alta' | 'media' | 'baixa'
  reasoning?: string
  source: 'ai' | 'local'
  iaDisponivel?: boolean
}

/** Estimativa no servidor (IA) com fallback local no browser */
export async function fetchProteinEstimate(
  texto: string,
  refeicao: RefeicaoId,
): Promise<ProteinParseResult & { source: 'ai' | 'local'; reasoning?: string; kcal: number }>
{
  const local = estimateProteinFromText(texto, refeicao)
  const localKcal = kcalFromProteinGrams(local.gramas)

  try
  {
    const headers = await supabaseAuthHeaders()
    const res = await fetch('/api/estimate-protein', {
      method: 'POST',
      headers,
      body: JSON.stringify({ texto, refeicao }),
    })

    if (!res.ok)
    {
      return { ...local, source: 'local', kcal: localKcal }
    }

    const data = (await res.json()) as ProteinEstimateApiResponse
    const kcal = typeof data.kcal === 'number' && data.kcal > 0
      ? data.kcal
      : kcalFromProteinGrams(data.gramas)

    return {
      gramas: data.gramas,
      matches: data.matches?.length
        ? data.matches
        : local.matches,
      confianca: data.confianca ?? local.confianca,
      source: data.source === 'ai' ? 'ai' : 'local',
      reasoning: data.reasoning,
      kcal,
    }
  }
  catch
  {
    return { ...local, source: 'local', kcal: localKcal }
  }
}
