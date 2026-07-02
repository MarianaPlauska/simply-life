// Carta do eu de ontem — loop emocional → comportamental

import type { HumorRegistro, EntradaDiario } from '../store/slices/bemEstarSlice'
import type { MoodOrchestrationContext } from './moodOrchestration'

export interface YesterdayLetter
{
  visible: boolean
  yesterdayIso: string
  moodLabel: string | null
  noteSnippet: string | null
  kanbanSlots: number
  axelMessage: string
  ctaLabel: string
}

const MOOD_WORDS: Record<number, string> = {
  1: 'no fundo do poço',
  2: 'exausta',
  3: 'no meio do caminho',
  4: 'bem',
  5: 'animada',
}

function yesterdayIso(ref: Date = new Date()): string
{
  const d = new Date(ref)
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function truncate(text: string, max: number): string
{
  const t = text.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

function findYesterdayMood(
  iso: string,
  humorSemana: HumorRegistro[],
  humorMes: HumorRegistro[],
): HumorRegistro | null
{
  const fromWeek = humorSemana.find((h) => h.data === iso)
  if (fromWeek) return fromWeek
  return humorMes.find((h) => h.data === iso) ?? null
}

function findYesterdayNote(iso: string, entradas: EntradaDiario[]): EntradaDiario | null
{
  return entradas.find((e) => e.data === iso) ?? null
}

export function buildYesterdayLetter(input: {
  humorSemana: HumorRegistro[]
  humorMes: HumorRegistro[]
  entradasRecentes: EntradaDiario[]
  mood?: MoodOrchestrationContext | null
  reference?: Date
}): YesterdayLetter
{
  const iso = yesterdayIso(input.reference)
  const mood = findYesterdayMood(iso, input.humorSemana, input.humorMes)
  const entrada = findYesterdayNote(iso, input.entradasRecentes)

  const hasContent = Boolean(mood || entrada)
  const kanbanSlots = input.mood?.effectiveDailyCap
    ? Math.min(5, Math.max(1, Math.round(input.mood.effectiveDailyCap / 120)))
    : 3

  if (!hasContent)
  {
    return {
      visible: false,
      yesterdayIso: iso,
      moodLabel: null,
      noteSnippet: null,
      kanbanSlots,
      axelMessage: '',
      ctaLabel: '',
    }
  }

  const moodWord = mood ? (MOOD_WORDS[Math.round(mood.humor)] ?? 'como estava') : null
  const noteFromMood = mood?.nota?.trim() || null
  const noteFromDiary = entrada?.conteudo?.trim() || null
  const noteSnippet = noteFromDiary || noteFromMood

  let axelMessage: string

  if (noteSnippet && moodWord)
  {
    axelMessage = `Ontem você escreveu que estava ${moodWord} — "${truncate(noteSnippet, 90)}". Hoje o Kanban tem só ${kanbanSlots} slots. Quer manter assim?`
  }
  else if (noteSnippet)
  {
    axelMessage = `Ontem você anotou: "${truncate(noteSnippet, 100)}". Hoje o AXEL sugere ${kanbanSlots} focos em Hoje. Quer manter assim?`
  }
  else if (mood && moodWord)
  {
    axelMessage = `Ontem seu humor ficou em ${mood.humor}/5 (${moodWord}). Hoje cabem ~${kanbanSlots} prioridades em Hoje — quer manter leve?`
  }
  else
  {
    axelMessage = `Lembrei do seu registro de ontem. Hoje o Kanban está com ${kanbanSlots} slots — quer manter assim?`
  }

  return {
    visible: true,
    yesterdayIso: iso,
    moodLabel: moodWord,
    noteSnippet: noteSnippet ? truncate(noteSnippet, 120) : null,
    kanbanSlots,
    axelMessage,
    ctaLabel: 'Manter leve hoje',
  }
}
