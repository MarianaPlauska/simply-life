// Explicação auditável da capacidade - passo a passo para o usuário

import type { DayCapacityFactor } from './dayCapacity'
import {
  CAPACITY_FACTOR_WEIGHTS,
  computeCapacityScore,
  factorHarmScores,
  weightedSoftminScore,
  type CapacityFactorId,
} from './dayCapacityModel'

export interface CapacityExplainStep
{
  id: string
  title: string
  detail: string
}

export interface CapacityExplanation
{
  steps: CapacityExplainStep[]
  formulaSummary: string
  bottleneckReason: string
}

function fmtPct(n: number): string
{
  return `${Math.round(n)}%`
}

export function buildCapacityExplanation(
  factors: DayCapacityFactor[],
  bottleneckId: CapacityFactorId,
  score: number,
): CapacityExplanation
{
  const inputs = factors.map((f) => ({ id: f.id, pct: f.pct }))
  const soft = weightedSoftminScore(inputs)
  const avg = inputs.reduce((a, f) => a + f.pct, 0) / Math.max(inputs.length, 1)
  const harms = factorHarmScores(inputs)
  const bottleneckHarm = harms.find((h) => h.id === bottleneckId) ?? harms[0]
  const bottleneckFactor = factors.find((f) => f.id === bottleneckId) ?? factors[0]

  const steps: CapacityExplainStep[] = []

  for (const f of factors)
  {
    if (f.id === 'mood')
    {
      steps.push({
        id: 'mood',
        title: 'Humor / energia',
        detail: f.detail === 'Sem registro hoje'
          ? 'Sem humor hoje → estimamos 32% (conservador até você registrar).'
          : `Média de humor/energia convertida em escala 0-100 → ${fmtPct(f.pct)} (${f.detail}).`,
      })
    }
    if (f.id === 'finance')
    {
      steps.push({
        id: 'finance',
        title: 'Folga financeira',
        detail: `Saldo disponível menos boletos dos próximos 7 dias → ${fmtPct(f.pct)}. ${f.detail}.`,
      })
    }
    if (f.id === 'kanban')
    {
      steps.push({
        id: 'kanban',
        title: 'Carga em Hoje',
        detail: `Tarefas ativas em Hoje, vencidas e carga mental → ${fmtPct(f.pct)}. ${f.detail}.`,
      })
    }
  }

  const harmLines = harms
    .map((h) =>
    {
      const label = factors.find((f) => f.id === h.id)?.shortLabel ?? h.id
      const w = CAPACITY_FACTOR_WEIGHTS[h.id]
      return `${label}: dano ${(h.harm * 100).toFixed(1)} (peso ${Math.round(w * 100)}%)`
    })
    .join(' · ')

  steps.push({
    id: 'softmin',
    title: 'Softmin ponderado',
    detail: `Combina os três eixos com pesos (humor 34%, folga 38%, carga 28%). O softmin puxa para o eixo mais fraco → ${fmtPct(soft)}. Média simples: ${fmtPct(avg)}.`,
  })

  steps.push({
    id: 'score',
    title: 'Capacidade final',
    detail: `Score = 68% × softmin (${fmtPct(soft)}) + 32% × média (${fmtPct(avg)}) = ${score}%. Modo derivado desse número.`,
  })

  const bottleneckReason =
    `Gargalo: ${bottleneckFactor.shortLabel} - dano ${(bottleneckHarm.harm * 100).toFixed(1)} (${harmLines}). `
    + `Mesmo com outros eixos melhores, este puxa a recomendação do dia.`

  const formulaSummary =
    'Capacidade = 0,68 × softmin(ponderado) + 0,32 × média(humor, folga, carga)'

  return {
    steps,
    formulaSummary,
    bottleneckReason,
  }
}

/** Garante que score e explicação usam o mesmo pipeline */
export function verifyCapacityScore(factors: DayCapacityFactor[]): number
{
  return computeCapacityScore(factors.map((f) => ({ id: f.id, pct: f.pct })))
}
