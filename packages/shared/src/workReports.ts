/**
 * Relatórios de trabalho para quem tem gestão e agenda cheia:
 * revisão da semana, carga da agenda, prazos em risco, melhor horário,
 * energia e entrega. Funções puras: a tela só junta os dados e desenha.
 */
import type { MobileTask } from './tasks'
import type { CalendarEvent } from './icsCalendar'
import type { FocusSessionLog } from './timeLearning'
import type { CompletionEntry, PlanRecord } from './planInsights'
import type { HumorRegistro } from './mood'
import { isDemoHumorRow } from './mood'
import { localTodayIso } from './dates'
import { addDaysIso } from './taskPrompt'

/** Tarefa sem estimativa conta como meia hora: melhor avisar cedo do que tarde. */
export const DEFAULT_TASK_MINUTES = 30
/** Janela de trabalho usada para a carga do dia (8h às 18h). */
export const WORKDAY_START_MIN = 8 * 60
export const WORKDAY_END_MIN = 18 * 60
/** Bloco de foco: intervalo livre de pelo menos uma hora na janela de trabalho. */
export const FOCUS_BLOCK_MIN = 60

function taskMinutes(t: MobileTask): number
{
  return t.estimativaMinutos > 0 ? t.estimativaMinutos : DEFAULT_TASK_MINUTES
}

function isoOf(d: Date): string
{
  return localTodayIso(d)
}

/** Segunda-feira da semana de `iso`. */
export function mondayOf(iso: string): string
{
  const d = new Date(`${iso}T12:00:00`)
  const dow = d.getDay()
  return addDaysIso(iso, dow === 0 ? -6 : 1 - dow)
}

export type CompletionTime = { taskId: string; at: Date }

/** Quando cada tarefa foi concluída: o registro do aparelho vale sobre o `concluidoEm` do banco. */
export function completionTimes(tasks: MobileTask[], log: CompletionEntry[]): CompletionTime[]
{
  const byId = new Map<string, Date>()
  for (const t of tasks)
  {
    if (t.status === 'done' && t.concluidoEm)
    {
      const d = new Date(t.concluidoEm)
      if (!Number.isNaN(d.getTime())) byId.set(t.id, d)
    }
  }
  for (const c of log)
  {
    const d = new Date(c.at)
    if (!Number.isNaN(d.getTime())) byId.set(c.taskId, d)
  }
  return [...byId.entries()].map(([taskId, at]) => ({ taskId, at }))
}

/* ------------------------------------------------------------------ */
/* 1. Revisão da semana                                               */
/* ------------------------------------------------------------------ */

export type WeeklyReview = {
  start: string
  end: string
  done: MobileTask[]
  doneMinutes: number
  plannedCount: number
  plannedDone: number
  /** prazo vencido nesta semana e ainda aberto, ou planejado e não feito */
  slipped: MobileTask[]
  highlights: MobileTask[]
  /** o que vence nos próximos 7 dias */
  next: MobileTask[]
}

export function weeklyReview(input: {
  tasks: MobileTask[]
  completions: CompletionEntry[]
  plans: PlanRecord[]
  /** 0 = esta semana, -1 = a passada */
  offset?: number
  today?: string
}): WeeklyReview
{
  const today = input.today ?? localTodayIso()
  const start = addDaysIso(mondayOf(today), (input.offset ?? 0) * 7)
  const end = addDaysIso(start, 6)
  const inRange = (iso: string) => iso >= start && iso <= end
  const doneAt = new Map(completionTimes(input.tasks, input.completions).map((c) => [c.taskId, isoOf(c.at)]))
  // concluída sem horário registrado (dado antigo ou de exemplo): vale o dia do prazo
  for (const t of input.tasks)
  {
    if (t.status === 'done' && !doneAt.has(t.id) && t.dataVencimento) doneAt.set(t.id, t.dataVencimento.slice(0, 10))
  }

  const done = input.tasks.filter((t) => t.status === 'done' && inRange(doneAt.get(t.id) ?? ''))
  const planned = new Set<string>()
  for (const p of input.plans) if (inRange(p.date)) for (const id of p.plannedIds ?? []) planned.add(id)
  const doneIds = new Set(done.map((t) => t.id))
  const lastDay = end < today ? end : today

  const slipped = input.tasks.filter((t) =>
  {
    if (t.status === 'done') return false
    const due = t.dataVencimento?.slice(0, 10)
    return (due != null && due >= start && due < lastDay) || (planned.has(t.id) && !doneIds.has(t.id))
  })

  const highlights = [...done]
    .sort((a, b) => a.prioridade - b.prioridade || taskMinutes(b) - taskMinutes(a))
    .slice(0, 3)

  const horizon = addDaysIso(today, 6)
  const next = input.tasks
    .filter((t) => t.status !== 'done' && t.dataVencimento && t.dataVencimento.slice(0, 10) >= today && t.dataVencimento.slice(0, 10) <= horizon)
    .sort((a, b) => (a.dataVencimento ?? '').localeCompare(b.dataVencimento ?? '') || a.prioridade - b.prioridade)

  return {
    start,
    end,
    done,
    doneMinutes: done.reduce((acc, t) => acc + taskMinutes(t), 0),
    plannedCount: planned.size,
    plannedDone: [...planned].filter((id) => doneIds.has(id)).length,
    slipped,
    highlights,
    next,
  }
}

/* ------------------------------------------------------------------ */
/* 2 e 3. Carga da agenda e prazos em risco                            */
/* ------------------------------------------------------------------ */

export type AgendaDay = {
  iso: string
  /** minutos ocupados por compromissos dentro da janela de trabalho */
  busyMin: number
  meetings: number
  /** tem compromisso de dia inteiro que ocupa (férias, viagem) */
  allDayBusy: boolean
  /** minutos de tarefas que vencem neste dia */
  taskMin: number
  tasksDue: number
  freeMin: number
  /** blocos livres de 1h ou mais */
  focusBlocks: number
  overloaded: boolean
}

function clip(a: number, b: number, start = WORKDAY_START_MIN): [number, number]
{
  return [Math.max(start, a), Math.min(WORKDAY_END_MIN, b)]
}

function mergeIntervals(list: [number, number][]): [number, number][]
{
  const sorted = list.filter(([a, b]) => b > a).sort((x, y) => x[0] - y[0])
  const out: [number, number][] = []
  for (const cur of sorted)
  {
    const last = out[out.length - 1]
    if (last && cur[0] <= last[1]) last[1] = Math.max(last[1], cur[1])
    else out.push([cur[0], cur[1]])
  }
  return out
}

export function agendaLoad(input: {
  tasks: MobileTask[]
  events: CalendarEvent[]
  days?: number
  today?: string
  /** minutos desde 0h agora: hoje só conta o que ainda resta da janela */
  nowMin?: number
}): AgendaDay[]
{
  const today = input.today ?? localTodayIso()
  const out: AgendaDay[] = []
  for (let i = 0; i < (input.days ?? 7); i++)
  {
    const iso = addDaysIso(today, i)
    const dayStart = i === 0 && input.nowMin != null
      ? Math.min(WORKDAY_END_MIN, Math.max(WORKDAY_START_MIN, input.nowMin))
      : WORKDAY_START_MIN
    const window = WORKDAY_END_MIN - dayStart
    const dayEvents = input.events.filter((e) => e.date === iso && e.busy)
    const allDayBusy = dayEvents.some((e) => e.allDay)
    const timed = mergeIntervals(
      dayEvents
        .filter((e) => !e.allDay && e.inicio != null && e.fim != null)
        .map((e) => clip(e.inicio as number, e.fim as number, dayStart)),
    )
    const busyMin = allDayBusy ? window : timed.reduce((acc, [a, b]) => acc + (b - a), 0)
    // blocos livres entre compromissos
    let focusBlocks = 0
    if (!allDayBusy)
    {
      let cursor = dayStart
      for (const [a, b] of [...timed, [WORKDAY_END_MIN, WORKDAY_END_MIN] as [number, number]])
      {
        if (a - cursor >= FOCUS_BLOCK_MIN) focusBlocks += Math.floor((a - cursor) / FOCUS_BLOCK_MIN)
        cursor = Math.max(cursor, b)
      }
    }
    const due = input.tasks.filter((t) => t.status !== 'done' && t.dataVencimento?.slice(0, 10) === iso)
    const taskMin = due.reduce((acc, t) => acc + taskMinutes(t), 0)
    const freeMin = Math.max(0, window - busyMin)
    out.push({
      iso,
      busyMin,
      meetings: dayEvents.filter((e) => !e.allDay).length,
      allDayBusy,
      taskMin,
      tasksDue: due.length,
      freeMin,
      focusBlocks,
      overloaded: taskMin > freeMin,
    })
  }
  return out
}

export type DeadlineRisk = {
  task: MobileTask
  due: string
  /** minutos de trabalho que faltam até o prazo, contando esta e as que vencem antes */
  neededMin: number
  /** minutos livres na agenda até o prazo */
  freeMin: number
  shortMin: number
}

/**
 * Prazo em risco: somando as tarefas em ordem de vencimento, a estimativa
 * acumulada passa do tempo livre acumulado na agenda até aquele dia.
 */
export function deadlinesAtRisk(input: {
  tasks: MobileTask[]
  events: CalendarEvent[]
  days?: number
  today?: string
  nowMin?: number
}): DeadlineRisk[]
{
  const today = input.today ?? localTodayIso()
  const days = input.days ?? 14
  const load = agendaLoad({ ...input, days, today })
  const freeUntil = (iso: string) => load.filter((d) => d.iso <= iso).reduce((acc, d) => acc + d.freeMin, 0)
  const horizon = addDaysIso(today, days - 1)
  const open = input.tasks
    .filter((t) => t.status !== 'done' && t.dataVencimento && t.dataVencimento.slice(0, 10) >= today && t.dataVencimento.slice(0, 10) <= horizon)
    .sort((a, b) => (a.dataVencimento ?? '').localeCompare(b.dataVencimento ?? '') || a.prioridade - b.prioridade)

  const risks: DeadlineRisk[] = []
  let needed = 0
  for (const t of open)
  {
    const due = (t.dataVencimento as string).slice(0, 10)
    needed += taskMinutes(t)
    const free = freeUntil(due)
    if (needed > free) risks.push({ task: t, due, neededMin: needed, freeMin: free, shortMin: needed - free })
  }
  return risks
}

/* ------------------------------------------------------------------ */
/* 7. Seu melhor horário                                               */
/* ------------------------------------------------------------------ */

export type DayPeriod = 'madrugada' | 'manha' | 'tarde' | 'noite'

export const DAY_PERIOD_LABEL: Record<DayPeriod, string> = {
  madrugada: 'Madrugada',
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
}

function periodOf(hour: number): DayPeriod
{
  if (hour < 5) return 'madrugada'
  if (hour < 12) return 'manha'
  if (hour < 18) return 'tarde'
  return 'noite'
}

export type BestHours = {
  /** conclusões por hora (0 a 23) */
  doneByHour: number[]
  /** minutos de foco por hora de início */
  focusByHour: number[]
  byPeriod: Record<DayPeriod, number>
  bestPeriod: DayPeriod | null
  peakHour: number | null
  samples: number
}

export function bestHours(input: {
  completions: CompletionTime[]
  focus: FocusSessionLog[]
  days?: number
  now?: Date
}): BestHours
{
  const now = input.now ?? new Date()
  const since = now.getTime() - (input.days ?? 28) * 86_400_000
  const doneByHour = Array.from({ length: 24 }, () => 0)
  const focusByHour = Array.from({ length: 24 }, () => 0)
  for (const c of input.completions)
  {
    if (c.at.getTime() >= since) doneByHour[c.at.getHours()] += 1
  }
  for (const s of input.focus)
  {
    const end = new Date(s.at).getTime()
    if (Number.isNaN(end) || end < since) continue
    const start = new Date(end - s.minutes * 60_000)
    focusByHour[start.getHours()] += s.minutes
  }
  // foco vale como meia conclusão a cada 25 min: as duas coisas mostram quando você rende
  const score = doneByHour.map((n, h) => n + focusByHour[h] / 50)
  const byPeriod: Record<DayPeriod, number> = { madrugada: 0, manha: 0, tarde: 0, noite: 0 }
  score.forEach((v, h) => { byPeriod[periodOf(h)] += v })
  const samples = doneByHour.reduce((a, b) => a + b, 0) + input.focus.filter((s) => new Date(s.at).getTime() >= since).length
  const peak = Math.max(...score)
  return {
    doneByHour,
    focusByHour,
    byPeriod,
    bestPeriod: samples >= 3 ? (Object.entries(byPeriod).sort((a, b) => b[1] - a[1])[0][0] as DayPeriod) : null,
    peakHour: samples >= 3 && peak > 0 ? score.indexOf(peak) : null,
    samples,
  }
}

/* ------------------------------------------------------------------ */
/* 8. Energia e entrega                                                */
/* ------------------------------------------------------------------ */

export type EnergyDay = { iso: string; sleep: number | null; mood: number | null; done: number }

export type EnergyDelivery = {
  days: EnergyDay[]
  insights: string[]
}

function avg(list: number[]): number | null
{
  return list.length ? list.reduce((a, b) => a + b, 0) / list.length : null
}

function fmt(n: number): string
{
  return n.toFixed(1).replace('.', ',').replace(',0', '')
}

export function energyDelivery(input: {
  humor: HumorRegistro[]
  sleepHours: Record<string, number>
  completions: CompletionTime[]
  days?: number
  today?: string
}): EnergyDelivery
{
  const today = input.today ?? localTodayIso()
  const n = input.days ?? 14
  const moodBy = new Map<string, number[]>()
  for (const h of input.humor)
  {
    if (isDemoHumorRow(h)) continue
    const iso = (h.data || '').slice(0, 10)
    if (!iso) continue
    moodBy.set(iso, [...(moodBy.get(iso) ?? []), h.humor])
  }
  const doneBy = new Map<string, number>()
  for (const c of input.completions)
  {
    const iso = isoOf(c.at)
    doneBy.set(iso, (doneBy.get(iso) ?? 0) + 1)
  }
  const days: EnergyDay[] = []
  for (let i = n - 1; i >= 0; i--)
  {
    const iso = addDaysIso(today, -i)
    const sleep = input.sleepHours[iso]
    const moods = moodBy.get(iso)
    days.push({
      iso,
      sleep: sleep != null && sleep > 0 ? sleep : null,
      mood: moods?.length ? Math.round((avg(moods) as number) * 10) / 10 : null,
      done: doneBy.get(iso) ?? 0,
    })
  }

  const insights: string[] = []
  const slept = days.filter((d) => d.sleep != null)
  const good = slept.filter((d) => (d.sleep as number) >= 7).map((d) => d.done)
  const short = slept.filter((d) => (d.sleep as number) < 7).map((d) => d.done)
  if (good.length >= 2 && short.length >= 2)
  {
    const a = avg(good) as number
    const b = avg(short) as number
    if (Math.abs(a - b) >= 0.5)
    {
      insights.push(a > b
        ? `Nos dias com 7h de sono ou mais, você concluiu ${fmt(a)} tarefas em média; com menos, ${fmt(b)}.`
        : `Com menos de 7h de sono você concluiu ${fmt(b)} tarefas em média, mais que nos outros dias (${fmt(a)}). Vale olhar se não está compensando no cansaço.`)
    }
  }
  const withMood = days.filter((d) => d.mood != null)
  const up = withMood.filter((d) => (d.mood as number) >= 4).map((d) => d.done)
  const down = withMood.filter((d) => (d.mood as number) <= 2).map((d) => d.done)
  if (up.length >= 2 && down.length >= 2)
  {
    const a = avg(up) as number
    const b = avg(down) as number
    if (Math.abs(a - b) >= 0.5)
    {
      insights.push(`Em dias de humor bom você concluiu ${fmt(a)} tarefas em média; nos dias pesados, ${fmt(b)}. Nos pesados, um passo já conta.`)
    }
  }
  const totalDone = days.reduce((acc, d) => acc + d.done, 0)
  if (!insights.length && totalDone === 0)
  {
    insights.push('Ainda não há tarefas concluídas no período para comparar com sono e humor.')
  }
  if (!insights.length)
  {
    insights.push(slept.length + withMood.length < 6
      ? 'Registre sono e humor por mais alguns dias para aparecerem as relações com a sua entrega.'
      : 'Por enquanto, sono e humor não mudaram muito o quanto você entrega. Bom sinal de ritmo estável.')
  }
  return { days, insights }
}

/* ------------------------------------------------------------------ */
/* 9. Compartilhar                                                     */
/* ------------------------------------------------------------------ */

function dayPt(iso: string): string
{
  return new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '')
}

export function minutesLabel(min: number): string
{
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  if (!h) return `${m} min`
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
}

/** Texto da revisão da semana, pronto para mandar à equipe ou levar a uma conversa 1:1. */
export function weeklyReviewToText(r: WeeklyReview, opts?: { risks?: DeadlineRisk[]; name?: string }): string
{
  const lines: string[] = []
  lines.push(`Revisão da semana${opts?.name ? ` · ${opts.name}` : ''} (${dayPt(r.start)} a ${dayPt(r.end)})`)
  lines.push('')
  lines.push(`Concluí ${r.done.length} tarefa${r.done.length === 1 ? '' : 's'}, cerca de ${minutesLabel(r.doneMinutes)} de trabalho.`)
  if (r.plannedCount) lines.push(`Do que planejei, fiz ${r.plannedDone} de ${r.plannedCount}.`)
  if (r.highlights.length)
  {
    lines.push('')
    lines.push('Destaques:')
    for (const t of r.highlights) lines.push(`• ${t.titulo}`)
  }
  if (r.slipped.length)
  {
    lines.push('')
    lines.push('Ficou para a próxima:')
    for (const t of r.slipped.slice(0, 5)) lines.push(`• ${t.titulo}`)
  }
  if (r.next.length)
  {
    lines.push('')
    lines.push('Próximos 7 dias:')
    for (const t of r.next.slice(0, 5)) lines.push(`• ${t.titulo} (${dayPt((t.dataVencimento as string).slice(0, 10))})`)
  }
  if (opts?.risks?.length)
  {
    lines.push('')
    lines.push('Prazos em risco:')
    for (const k of opts.risks.slice(0, 3)) lines.push(`• ${k.task.titulo}, faltam ${minutesLabel(k.shortMin)} até ${dayPt(k.due)}`)
  }
  return lines.join('\n')
}

function esc(s: string): string
{
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Mesma revisão em HTML para imprimir ou salvar como PDF. */
export function weeklyReviewToHtml(r: WeeklyReview, opts?: { risks?: DeadlineRisk[]; name?: string }): string
{
  // o texto é a fonte: linhas "Algo:" viram título, "• item" viram lista, o resto parágrafo
  const [title, ...rest] = weeklyReviewToText(r, opts).split('\n')
  const parts: string[] = []
  let inList = false
  const close = () =>
  {
    if (inList) parts.push('</ul>')
    inList = false
  }
  for (const line of rest)
  {
    if (line.startsWith('• '))
    {
      if (!inList) parts.push('<ul>')
      inList = true
      parts.push(`<li>${esc(line.slice(2))}</li>`)
      continue
    }
    close()
    if (!line) continue
    parts.push(line.endsWith(':') ? `<h2>${esc(line.slice(0, -1))}</h2>` : `<p>${esc(line)}</p>`)
  }
  close()
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>body{font-family:Lexend,system-ui,sans-serif;color:#1F2A2A;max-width:640px;margin:40px auto;padding:0 24px;line-height:1.5}
h1{font-family:Fraunces,Georgia,serif;font-size:26px;color:#1F3A3D;margin:0 0 16px}h2{font-size:15px;color:#1F3A3D;margin:24px 0 8px}
ul{margin:0;padding-left:20px}p{margin:4px 0}</style></head><body><h1>${esc(title)}</h1>${parts.join('')}</body></html>`
}
