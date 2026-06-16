import type { HumorRegistro } from '../store/slices/bemEstarSlice'
import type { DiaHumorAgregado } from './moodInsights'
import { mediaHumor, ultimoRegistro } from './moodInsights'
import { moodLabel } from './moodConstants'

export type MoodProfile = 'recuperacao' | 'cuidado' | 'equilibrado' | 'energizado' | 'sem_registro'

export interface MoodLoadThresholds
{
  warningPercent: number
  overloadPercent: number
  flowSuggestMinPercent: number
  maxActiveForFlow: number
}

export interface MoodOrchestrationContext
{
  profile: MoodProfile
  humorMedia: number | null
  energia: number | null
  hasMoodToday: boolean
  baseDailyCap: number
  effectiveDailyCap: number
  capMultiplier: number
  thresholds: MoodLoadThresholds
  profileLabel: string
  axelNote: string
  loadTooltipSuffix: string
  snoozeReason: string
}

const DEFAULT_THRESHOLDS: MoodLoadThresholds = {
  warningPercent: 80,
  overloadPercent: 100,
  flowSuggestMinPercent: 80,
  maxActiveForFlow: 3,
}

function profileLabel(profile: MoodProfile): string
{
  if (profile === 'recuperacao') return 'Modo recuperação'
  if (profile === 'cuidado') return 'Modo cuidado'
  if (profile === 'equilibrado') return 'Ritmo equilibrado'
  if (profile === 'energizado') return 'Ritmo alto'
  return 'Humor não registrado'
}

function resolveProfile(media: number | null, hasToday: boolean): MoodProfile
{
  if (!hasToday || media == null) return 'sem_registro'
  if (media <= 2) return 'recuperacao'
  if (media <= 3.2) return 'cuidado'
  if (media >= 4.3) return 'energizado'
  return 'equilibrado'
}

function resolveMultiplier(profile: MoodProfile, energia: number | null): number
{
  let mult = 1
  if (profile === 'recuperacao') mult = 0.55
  else if (profile === 'cuidado') mult = 0.78
  else if (profile === 'equilibrado') mult = 0.95
  else if (profile === 'energizado') mult = 1.05
  else mult = 0.9 // sem registro — levemente conservador

  if (energia === 1) mult *= 0.88
  else if (energia === 2) mult *= 0.96
  else if (energia === 3) mult *= 1.04

  return Math.min(1.1, Math.max(0.45, mult))
}

function resolveThresholds(profile: MoodProfile): MoodLoadThresholds
{
  if (profile === 'recuperacao')
  {
    return {
      warningPercent: 55,
      overloadPercent: 75,
      flowSuggestMinPercent: 50,
      maxActiveForFlow: 2,
    }
  }
  if (profile === 'cuidado')
  {
    return {
      warningPercent: 65,
      overloadPercent: 85,
      flowSuggestMinPercent: 65,
      maxActiveForFlow: 3,
    }
  }
  if (profile === 'sem_registro')
  {
    return {
      warningPercent: 72,
      overloadPercent: 92,
      flowSuggestMinPercent: 72,
      maxActiveForFlow: 3,
    }
  }
  if (profile === 'energizado')
  {
    return {
      warningPercent: 88,
      overloadPercent: 105,
      flowSuggestMinPercent: 88,
      maxActiveForFlow: 5,
    }
  }
  return DEFAULT_THRESHOLDS
}

function buildAxelNote(
  profile: MoodProfile,
  humorMedia: number | null,
  baseCap: number,
  effectiveCap: number,
): string
{
  if (profile === 'sem_registro')
  {
    return `Cap de Hoje em ${effectiveCap} pts (conservador). Registre seu humor para o AXEL calibrar melhor.`
  }
  if (profile === 'recuperacao')
  {
    return `Humor ${humorMedia}/5 — AXEL reduziu Hoje para ${effectiveCap} pts (era ${baseCap}). Priorize o essencial.`
  }
  if (profile === 'cuidado')
  {
    return `Humor ${humorMedia}/5 (${moodLabel(Math.round(humorMedia!))}) — cap ajustado para ${effectiveCap} pts.`
  }
  if (profile === 'energizado')
  {
    return `Humor ${humorMedia}/5 — você tem espaço para até ${effectiveCap} pts em Hoje.`
  }
  return `Humor ${humorMedia}/5 — cap do dia: ${effectiveCap} pts.`
}

export function buildMoodOrchestrationContext(
  humorHoje: HumorRegistro[],
  humorSemana: DiaHumorAgregado[],
  baseDailyCap: number,
): MoodOrchestrationContext
{
  const hasMoodToday = humorHoje.length > 0
  const humorMedia = hasMoodToday ? mediaHumor(humorHoje) : null
  const ultimo = ultimoRegistro(humorHoje)
  const energia = ultimo?.energia ?? null

  let profile = resolveProfile(humorMedia, hasMoodToday)

  // Semana difícil — não força modo alto mesmo com um dia bom isolado
  if (profile === 'energizado' && humorSemana.length >= 3)
  {
    const mediaSemana = humorSemana.reduce((s, d) => s + d.humor, 0) / humorSemana.length
    if (mediaSemana < 3.2) profile = 'equilibrado'
  }

  const capMultiplier = resolveMultiplier(profile, energia)
  const effectiveDailyCap = Math.max(80, Math.round(baseDailyCap * capMultiplier))
  const thresholds = resolveThresholds(profile)

  const axelNote = buildAxelNote(profile, humorMedia, baseDailyCap, effectiveDailyCap)

  let loadTooltipSuffix = ''
  if (profile === 'recuperacao' || profile === 'cuidado')
  {
    loadTooltipSuffix = ' Cap reduzido pelo seu bem-estar de hoje.'
  }
  else if (profile === 'sem_registro')
  {
    loadTooltipSuffix = ' Registre humor no dashboard para calibrar.'
  }

  const snoozeReason =
    profile === 'recuperacao' || profile === 'cuidado'
      ? 'AXEL adiou — carga ajustada ao seu humor de hoje'
      : 'Excesso de carga para hoje'

  return {
    profile,
    humorMedia,
    energia,
    hasMoodToday,
    baseDailyCap,
    effectiveDailyCap,
    capMultiplier,
    thresholds,
    profileLabel: profileLabel(profile),
    axelNote,
    loadTooltipSuffix,
    snoozeReason,
  }
}
