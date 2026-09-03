// Modelo de capacidade - softmin ponderado (gargalo suave, estilo rede neural)

import type { CapacityMode } from './dayCapacity'

export type CapacityFactorId = 'mood' | 'finance' | 'kanban'

export interface CapacityFactorInput
{
  id: CapacityFactorId
  pct: number
}

/** Pesos de importância relativa - finanças pesa um pouco mais no dia a dia */
export const CAPACITY_FACTOR_WEIGHTS: Record<CapacityFactorId, number> = {
  mood: 0.34,
  finance: 0.38,
  kanban: 0.28,
}

const SOFTMIN_TEMPERATURE = 0.22

function clamp01(n: number): number
{
  return Math.min(100, Math.max(0, n))
}

/**
 * Softmin ponderado - aproximação diferenciável do mínimo (comum em redes de atenção).
 * Quanto menor a temperatura, mais o score segue o pior fator.
 */
export function weightedSoftminScore(
  factors: CapacityFactorInput[],
  weights: Record<CapacityFactorId, number> = CAPACITY_FACTOR_WEIGHTS,
  temperature: number = SOFTMIN_TEMPERATURE,
): number
{
  if (factors.length === 0) return 0

  const logits = factors.map((f) =>
  {
    const w = weights[f.id] ?? 1 / factors.length
    return (-f.pct / 100) / temperature + Math.log(Math.max(w, 1e-6))
  })

  const maxLogit = Math.max(...logits)
  let sumExp = 0
  let weighted = 0

  for (let i = 0; i < factors.length; i++)
  {
    const e = Math.exp(logits[i] - maxLogit)
    sumExp += e
    weighted += e * factors[i].pct
  }

  return clamp01(weighted / Math.max(sumExp, 1e-9))
}

/** Dano por fator - quanto cada eixo “puxa” a capacidade para baixo */
export function factorHarmScores(
  factors: CapacityFactorInput[],
  weights: Record<CapacityFactorId, number> = CAPACITY_FACTOR_WEIGHTS,
): { id: CapacityFactorId; harm: number; pct: number }[]
{
  return factors.map((f) =>
  {
    const w = weights[f.id] ?? 1 / factors.length
    const deficit = (100 - f.pct) / 100
    return { id: f.id, harm: deficit * w, pct: f.pct }
  })
}

export function resolveWeightedBottleneck(
  factors: CapacityFactorInput[],
  weights: Record<CapacityFactorId, number> = CAPACITY_FACTOR_WEIGHTS,
): CapacityFactorId
{
  const harms = factorHarmScores(factors, weights)
  let top = harms[0]
  for (const h of harms)
  {
    if (h.harm > top.harm)
    {
      top = h
    }
  }
  return top.id
}

export function computeCapacityScore(
  factors: CapacityFactorInput[],
  weights: Record<CapacityFactorId, number> = CAPACITY_FACTOR_WEIGHTS,
): number
{
  const soft = weightedSoftminScore(factors, weights)
  const avg = factors.reduce((acc, f) => acc + f.pct, 0) / Math.max(factors.length, 1)
  // Mistura conservadora: 68% softmin + 32% média
  return Math.round(clamp01(soft * 0.68 + avg * 0.32))
}

export function resolveMode(score: number): CapacityMode
{
  if (score >= 72) return 'pleno'
  if (score >= 52) return 'equilibrado'
  if (score >= 32) return 'cuidado'
  return 'critico'
}
