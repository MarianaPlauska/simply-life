import type { TarefaUnificada } from '../types'
import type { UserQuest } from '../store/slices/gamificacaoSlice'

// Episódio semanal — resumo narrativo (Finch / Duolingo recap)

export interface WeeklyEpisode
{
  periodo: string
  ofensivasSalvas: number
  tarefasConcluidas: number
  focoMinutos: number
  humorMedio: number
  questsConcluidas: number
  xpTotal: number
  nivel: number
  headline: string
  resumo: string
}

function isoDaysAgo(n: number): string
{
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function weekPeriodLabel(): string
{
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 6)
  const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  return `${fmt(start)} – ${fmt(end)}`
}

function media(nums: number[]): number
{
  if (nums.length === 0) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

export function buildWeeklyEpisode(input: {
  streakSavedDays: Record<string, boolean>
  focusMinutesByDate: Record<string, number>
  tarefas: TarefaUnificada[]
  humorSemana: { humor: number }[]
  userQuests: UserQuest[]
  xpTotal: number
  nivel: number
}): WeeklyEpisode
{
  const desde = isoDaysAgo(6)
  const dias = Array.from({ length: 7 }, (_, i) => isoDaysAgo(6 - i))

  const ofensivasSalvas = dias.filter((d) => input.streakSavedDays[d]).length
  const focoMinutos = dias.reduce((s, d) => s + (input.focusMinutesByDate[d] ?? 0), 0)

  const tarefasConcluidas = input.tarefas.filter((t) =>
  {
    if (t.status !== 'concluida') return false
    const ref = (t.created_at || t.data_vencimento || '').slice(0, 10)
    return ref >= desde
  }).length

  const humorMedio = media(input.humorSemana.map((h) => h.humor))
  const questsConcluidas = input.userQuests.filter((q) => q.concluida).length

  let headline = 'Sua semana em números'
  if (ofensivasSalvas >= 5)
  {
    headline = 'Semana impecável na ofensiva'
  }
  else if (ofensivasSalvas >= 3)
  {
    headline = 'Boa consistência esta semana'
  }
  else if (tarefasConcluidas >= 5)
  {
    headline = 'Muita execução — parabéns'
  }

  const partes: string[] = []
  if (ofensivasSalvas > 0)
  {
    partes.push(
      `Você salvou ${ofensivasSalvas} ofensiva${ofensivasSalvas !== 1 ? 's' : ''}`,
    )
  }
  if (tarefasConcluidas > 0)
  {
    partes.push(`concluiu ${tarefasConcluidas} tarefa${tarefasConcluidas !== 1 ? 's' : ''}`)
  }
  if (focoMinutos > 0)
  {
    partes.push(`${focoMinutos} min de foco profundo`)
  }

  const resumo = partes.length > 0
    ? `${partes.join(', ')}. Nível ${input.nivel} · ${input.xpTotal} XP acumulados.`
    : `Semana tranquila. Um registro de humor ou uma tarefa já abre o próximo episódio.`

  return {
    periodo: weekPeriodLabel(),
    ofensivasSalvas,
    tarefasConcluidas,
    focoMinutos,
    humorMedio,
    questsConcluidas,
    xpTotal: input.xpTotal,
    nivel: input.nivel,
    headline,
    resumo,
  }
}
