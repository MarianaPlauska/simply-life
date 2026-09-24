/**
 * Relatório do ritmo (semana): o que foi planejado à noite × o que foi feito,
 * humor, tempo dedicado e o efeito de planejar.
 * Linguagem gentil por regra: celebra o pouco, nunca compara com "o ideal",
 * e sinaliza cuidado (CVV 188) quando a semana foi pesada. Não é diagnóstico.
 */
import type { HumorRegistro } from './mood'
import type { MobileTask } from './tasks'
import { localTodayIso } from './dates'
import { addDaysIso, weekdayOfIso } from './taskPrompt'
import { formatMinutesPt } from './taskOrchestrator'
import type { AnxietyLevel, DayPlanMode } from './eveningPlan'
import { DAY_PLAN_MODE_COPY } from './eveningPlan'
import type { TaskEnergy } from './taskPrompt'

export type PlanRecord = {
  /** dia planejado */
  date: string
  mode: DayPlanMode
  mood: number | null
  energy: TaskEnergy
  anxiety: AnxietyLevel
  essentialIds: string[]
  plannedIds: string[]
  capacityMin: number
  plannedMin: number
  worriesCount: number
  createdAt: string
}

export type CompletionEntry = { taskId: string; at: string }

export type ReportDay = {
  iso: string
  label: string
  planned: boolean
  mode: DayPlanMode | null
  essentials: number
  essentialsDone: number
  doneCount: number
  doneMinutes: number
  mood: number | null
}

export type CareLevel = 'none' | 'watch' | 'concern'

export type RhythmReport = {
  from: string
  to: string
  days: ReportDay[]
  totals: {
    nightsPlanned: number
    essentials: number
    essentialsDone: number
    doneCount: number
    doneMinutes: number
    axelMoves: number
  }
  compare: { withPlan: number | null; withoutPlan: number | null }
  moodAvg: number | null
  insights: string[]
  care: { level: CareLevel; text: string | null }
}

const WEEKDAY = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const WEEKDAY_LONG = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

function isoOfInstant(at: string): string
{
  const d = new Date(at)
  return Number.isNaN(d.getTime()) ? at.slice(0, 10) : localTodayIso(d)
}

function avg(values: number[]): number | null
{
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null
}

/** Quando cada tarefa foi concluída: banco (concluido_em) ou registro local do aparelho. */
export function completionDays(tasks: MobileTask[], log: CompletionEntry[]): Map<string, string>
{
  const out = new Map<string, string>()
  for (const e of log) out.set(e.taskId, isoOfInstant(e.at))
  for (const t of tasks)
  {
    if (t.status === 'done' && t.concluidoEm) out.set(t.id, isoOfInstant(t.concluidoEm))
  }
  // sem registro nenhum: usa o vencimento como aproximação para tarefas concluídas
  for (const t of tasks)
  {
    if (t.status === 'done' && !out.has(t.id) && t.dataVencimento) out.set(t.id, t.dataVencimento.slice(0, 10))
  }
  return out
}

export function buildRhythmReport(input: {
  plans: PlanRecord[]
  completions: CompletionEntry[]
  tasks: MobileTask[]
  humor: HumorRegistro[]
  axelMoves?: number
  days?: number
  ref?: Date
}): RhythmReport
{
  const ref = input.ref ?? new Date()
  const n = input.days ?? 7
  const to = localTodayIso(ref)
  const from = addDaysIso(to, -(n - 1))
  const byId = new Map(input.tasks.map((t) => [t.id, t]))
  const doneOn = completionDays(input.tasks, input.completions)
  const planByDate = new Map(input.plans.map((p) => [p.date, p]))

  const days: ReportDay[] = []
  for (let i = 0; i < n; i += 1)
  {
    const iso = addDaysIso(from, i)
    const plan = planByDate.get(iso) ?? null
    const doneIds = [...doneOn.entries()].filter(([, d]) => d === iso).map(([id]) => id)
    const doneMinutes = doneIds.reduce((s, id) => s + (byId.get(id)?.estimativaMinutos ?? 0), 0)
    const essentialsDone = plan
      ? plan.essentialIds.filter((id) => doneOn.get(id) && doneOn.get(id)! <= addDaysIso(iso, 1)).length
      : 0
    const moods = input.humor.filter((h) => h.data?.slice(0, 10) === iso).map((h) => h.humor)
    days.push({
      iso,
      label: i === n - 1 ? 'Hoje' : WEEKDAY[weekdayOfIso(iso)],
      planned: Boolean(plan),
      mode: plan?.mode ?? null,
      essentials: plan?.essentialIds.length ?? 0,
      essentialsDone,
      doneCount: doneIds.length,
      doneMinutes,
      mood: moods.length ? Math.round((avg(moods) ?? 0) * 10) / 10 : (plan?.mood ?? null),
    })
  }

  const totals = {
    // noites em que o ritual aconteceu (o plano de amanhã feito hoje à noite também conta)
    nightsPlanned: input.plans.filter((p) =>
    {
      const night = p.createdAt ? isoOfInstant(p.createdAt) : addDaysIso(p.date, -1)
      return night >= from && night <= to
    }).length,
    essentials: days.reduce((s, d) => s + d.essentials, 0),
    essentialsDone: days.reduce((s, d) => s + d.essentialsDone, 0),
    doneCount: days.reduce((s, d) => s + d.doneCount, 0),
    doneMinutes: days.reduce((s, d) => s + d.doneMinutes, 0),
    axelMoves: input.axelMoves ?? 0,
  }
  const past = days.slice(0, -1) // hoje ainda está acontecendo
  const compare = {
    withPlan: avg(past.filter((d) => d.planned).map((d) => d.doneCount)),
    withoutPlan: avg(past.filter((d) => !d.planned).map((d) => d.doneCount)),
  }
  const moodVals = days.map((d) => d.mood).filter((m): m is number => m != null)
  const moodAvg = avg(moodVals)

  // ----- cuidado -----
  const heavyDays = days.filter((d) => d.mood != null && d.mood <= 2).length
  const veryHeavy = days.filter((d) => d.mood != null && d.mood <= 1.5).length
  let care: RhythmReport['care'] = { level: 'none', text: null }
  if (veryHeavy >= 3 || heavyDays >= 5)
  {
    care = {
      level: 'concern',
      text: 'Foram vários dias pesados. Você não precisa carregar isso sem apoio: conversar com alguém de confiança ou com um profissional ajuda. CVV 188, 24 horas, gratuito.',
    }
  }
  else if (heavyDays >= 3)
  {
    care = {
      level: 'watch',
      text: 'A semana teve dias difíceis. Observe o que ajudou, sem se cobrar. Se continuar pesado, procure apoio.',
    }
  }

  // ----- frases (no máximo 4, sempre gentis) -----
  const insights: string[] = []
  if (totals.essentials > 0)
  {
    const rate = totals.essentialsDone / totals.essentials
    if (rate >= 0.7)
    {
      insights.push(`Você cumpriu ${totals.essentialsDone} de ${totals.essentials} essenciais. Isso é consistência.`)
    }
    else if (rate >= 0.4)
    {
      insights.push(`${totals.essentialsDone} de ${totals.essentials} essenciais feitos. Metade do caminho também é caminho.`)
    }
    else
    {
      insights.push(`Semana puxada: ${totals.essentialsDone} de ${totals.essentials} essenciais. Planejar menos por dia costuma ajudar; o modo gentil faz isso por você.`)
    }
  }
  if (compare.withPlan != null && compare.withoutPlan != null && compare.withPlan - compare.withoutPlan >= 0.5)
  {
    insights.push(`Nos dias planejados na noite anterior você concluiu em média ${compare.withPlan.toFixed(1).replace('.', ',')} tarefas; nos outros, ${compare.withoutPlan.toFixed(1).replace('.', ',')}.`)
  }
  const lowMoodDays = past.filter((d) => d.mood != null && d.mood <= 2)
  const goodMoodDays = past.filter((d) => d.mood != null && d.mood >= 4)
  if (lowMoodDays.length && goodMoodDays.length)
  {
    const low = avg(lowMoodDays.map((d) => d.doneCount)) ?? 0
    const good = avg(goodMoodDays.map((d) => d.doneCount)) ?? 0
    if (good > low)
    {
      insights.push('Nos dias de humor mais baixo você fez menos, e tudo bem: o plano gentil existe exatamente para esses dias.')
    }
  }
  const best = [...past].sort((a, b) => b.doneCount - a.doneCount)[0]
  if (best && best.doneCount >= 2)
  {
    insights.push(`Seu dia mais produtivo foi ${WEEKDAY_LONG[weekdayOfIso(best.iso)]}, com ${best.doneCount} tarefas${best.doneMinutes > 0 ? ` e ${formatMinutesPt(best.doneMinutes)}` : ''}.`)
  }
  if (totals.nightsPlanned === 0)
  {
    insights.push('Experimente planejar amanhã hoje à noite: leva uns 3 minutos e o Axel ajusta o tamanho do dia por você.')
  }
  if (totals.axelMoves > 0 && insights.length < 4)
  {
    insights.push(`O Axel reorganizou ${totals.axelMoves} ${totals.axelMoves === 1 ? 'tarefa' : 'tarefas'} para seus dias não passarem do limite.`)
  }

  return { from, to, days, totals, compare, moodAvg, insights: insights.slice(0, 4), care }
}

/** Texto para compartilhar (ex.: com quem acompanha você). Sem notas nem preocupações. */
export function rhythmReportToText(r: RhythmReport): string
{
  const fmt = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
  const lines = [
    `Meu ritmo · ${fmt(r.from)} a ${fmt(r.to)} (Simply Life)`,
    '',
    `Noites planejadas: ${r.totals.nightsPlanned} de ${r.days.length}`,
    `Essenciais feitos: ${r.totals.essentialsDone} de ${r.totals.essentials}`,
    `Tarefas concluídas: ${r.totals.doneCount} · tempo: ${formatMinutesPt(r.totals.doneMinutes)}`,
    r.moodAvg != null ? `Humor médio: ${r.moodAvg.toFixed(1).replace('.', ',')} de 5` : 'Humor: sem registros',
    '',
    'Dia a dia:',
    ...r.days.map((d) =>
      `${d.label} ${fmt(d.iso)} · ${d.planned ? `${DAY_PLAN_MODE_COPY[d.mode!].label}, ${d.essentialsDone}/${d.essentials} essenciais` : 'sem plano'} · ${d.doneCount} ${d.doneCount === 1 ? 'feita' : 'feitas'}${d.mood != null ? ` · humor ${String(d.mood).replace('.', ',')}` : ''}`),
    '',
    ...r.insights.map((i) => `• ${i}`),
    '',
    'Registro pessoal de organização. Não é avaliação clínica nem diagnóstico.',
  ]
  return lines.join('\n')
}
