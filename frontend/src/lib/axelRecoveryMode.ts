// Modo recuperação automático - Finch-like (nível 11+)

import type { HumorRegistro } from '../store/slices/bemEstarSlice'
import type { DiaHumorAgregado } from './moodInsights'
import type { MoodOrchestrationContext, MoodProfile } from './moodOrchestration'
import { mediaHumor } from './moodInsights'

export const AXEL_AUTO_RECOVERY_LEVEL = 11

export interface AxelRecoveryDecision
{
  active: boolean
  reason: string
  forcedProfile: MoodProfile | null
}

/** Sinais para forçar recuperação mesmo com humor “médio” isolado */
export function evaluateAxelAutoRecovery(input: {
  level: number
  humorHoje: HumorRegistro[]
  humorSemana: DiaHumorAgregado[]
  kanbanLoadPct: number
}): AxelRecoveryDecision
{
  if (input.level < AXEL_AUTO_RECOVERY_LEVEL)
  {
    return { active: false, reason: '', forcedProfile: null }
  }

  const hasToday = input.humorHoje.length > 0
  const humorMedia = hasToday ? mediaHumor(input.humorHoje) : null

  let weekAvg: number | null = null
  if (input.humorSemana.length >= 3)
  {
    weekAvg = input.humorSemana.reduce((s, d) => s + d.humor, 0) / input.humorSemana.length
  }

  const loadHigh = input.kanbanLoadPct >= 72
  const moodLowToday = humorMedia != null && humorMedia <= 2.2
  const weekHard = weekAvg != null && weekAvg < 2.8
  const burnoutNote = input.humorHoje.some((h) =>
    /cansad|exaust|burnout|sem energia/i.test(h.nota ?? ''),
  )

  if (moodLowToday && loadHigh)
  {
    return {
      active: true,
      reason: 'humor baixo + Kanban cheio',
      forcedProfile: 'recuperacao',
    }
  }

  if (weekHard && loadHigh)
  {
    return {
      active: true,
      reason: 'semana difícil + carga alta',
      forcedProfile: 'recuperacao',
    }
  }

  if (burnoutNote && (moodLowToday || weekHard))
  {
    return {
      active: true,
      reason: 'nota de cansaço + semana pesada',
      forcedProfile: 'recuperacao',
    }
  }

  if (moodLowToday && weekHard)
  {
    return {
      active: true,
      reason: 'humor de hoje e da semana pedem pausa',
      forcedProfile: 'recuperacao',
    }
  }

  return { active: false, reason: '', forcedProfile: null }
}

/** Aplica boost Finch quando recuperação automática dispara */
export function applyAxelRecoveryBoost(
  base: MoodOrchestrationContext,
  decision: AxelRecoveryDecision,
): MoodOrchestrationContext
{
  if (!decision.active || !decision.forcedProfile)
  {
    return base
  }

  const effectiveDailyCap = Math.max(
    80,
    Math.min(base.effectiveDailyCap, Math.round(base.baseDailyCap * 0.5)),
  )

  return {
    ...base,
    profile: decision.forcedProfile,
    profileLabel: 'Modo recuperação (AXEL)',
    capMultiplier: Math.min(base.capMultiplier, 0.5),
    effectiveDailyCap,
    thresholds: {
      warningPercent: 50,
      overloadPercent: 68,
      flowSuggestMinPercent: 45,
      maxActiveForFlow: 2,
    },
    axelNote: `AXEL ativou recuperação automática (${decision.reason}) - Hoje em ${effectiveDailyCap} pts.`,
    loadTooltipSuffix: ' Recuperação automática ativa - priorize o essencial.',
    snoozeReason: 'AXEL adiou - modo recuperação automático',
  }
}
