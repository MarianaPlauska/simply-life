/**
 * Dia visual (estilo Tiimo/Structured) + encaixe em horários livres (estilo Motion/Reclaim):
 * junta eventos da agenda (.ics), compromissos com hora e tarefas do dia, e coloca
 * as tarefas flexíveis nas janelas livres — essenciais primeiro, com pausas entre elas.
 * Também dá o "agora / depois" e os avisos de transição (autismo/TDAH).
 */
import type { MobileTask } from './tasks'
import { localTodayIso } from './dates'
import { freeSlots, type CalendarEvent } from './icsCalendar'

export type DayBlockKind = 'agenda' | 'compromisso' | 'tarefa' | 'pausa'

export type DayBlock = {
  id: string
  kind: DayBlockKind
  titulo: string
  inicio: number
  fim: number
  /** agenda/compromisso: horário fixo · tarefa/pausa: sugerido pelo Axel */
  fixed: boolean
  /** evento marcado como "livre" na agenda: aparece, mas não ocupa tempo */
  soft?: boolean
  taskId?: string
  essential?: boolean
  local?: string | null
  /** agenda de origem (Gmail, Teams...) */
  origem?: string
}

export type VisualDay = {
  date: string
  blocks: DayBlock[]
  allDay: CalendarEvent[]
  /** tarefas do dia que não couberam nas janelas livres */
  unplaced: { taskId: string; titulo: string; minutos: number }[]
  doneCount: number
  busyMinutes: number
  freeMinutes: number
}

export type VisualDayInput = {
  date: string
  tasks: MobileTask[]
  events: CalendarEvent[]
  /** ids escolhidos no ritual da noite (entram primeiro) */
  essentialIds?: string[]
  ref?: Date
  /** horário ativo do dia, minutos desde 0h */
  dayStart?: number
  dayEnd?: number
  /** folga nas estimativas (TDAH: 1.25) */
  estimateFactor?: number
  /** fator por tarefa (aprendido do histórico); tem prioridade sobre estimateFactor */
  factorFor?: (titulo: string) => number
  pauseMin?: number
  /** tempo livre para tarefas no dia; essenciais entram mesmo assim */
  capacityMinutes?: number
}

const round5 = (n: number) => Math.ceil(n / 5) * 5
/** maior bloco contínuo de uma tarefa (minutos) */
const MAX_BLOCK = 90

export function buildVisualDay(input: VisualDayInput): VisualDay
{
  const ref = input.ref ?? new Date()
  const today = localTodayIso(ref)
  const isToday = input.date === today
  const nowMin = ref.getHours() * 60 + ref.getMinutes()
  const dayStart = input.dayStart ?? 8 * 60
  const dayEnd = input.dayEnd ?? 21 * 60 + 30
  const factor = input.estimateFactor ?? 1
  const pause = input.pauseMin ?? 10
  const essentials = input.essentialIds ?? []

  const dayEvents = input.events.filter((e) => e.date === input.date)
  const blocks: DayBlock[] = dayEvents
    .filter((e) => !e.allDay && e.inicio != null && e.fim != null)
    .map((e) => ({
      id: `ev:${e.id}`,
      kind: 'agenda' as const,
      titulo: e.titulo,
      inicio: e.inicio!,
      fim: e.fim!,
      fixed: true,
      soft: !e.busy,
      local: e.local,
      origem: e.origem,
    }))

  const dayTasks = input.tasks.filter((t) =>
  {
    const d = t.dataVencimento?.slice(0, 10)
    if (!d) return false
    // hoje também puxa o que ficou de dias anteriores
    return isToday ? d <= input.date : d === input.date
  })
  const open = dayTasks.filter((t) => t.status !== 'done')
  const doneCount = dayTasks.filter((t) => t.status === 'done' && t.dataVencimento?.slice(0, 10) === input.date).length

  for (const t of open.filter((x) => x.horaMinutos != null && x.dataVencimento?.slice(0, 10) === input.date))
  {
    blocks.push({
      id: `cp:${t.id}`,
      kind: 'compromisso',
      titulo: t.titulo,
      inicio: t.horaMinutos!,
      fim: t.horaMinutos! + Math.max(15, t.estimativaMinutos || 30),
      fixed: true,
      taskId: t.id,
      essential: essentials.includes(t.id),
    })
  }

  // janelas livres: agenda + compromissos contam como ocupado
  const asBusy: CalendarEvent[] = blocks.filter((b) => !b.soft).map((b) => ({
    id: b.id,
    titulo: b.titulo,
    date: input.date,
    inicio: b.inicio,
    fim: b.fim,
    allDay: false,
    busy: true,
    local: null,
  }))
  const from = isToday ? Math.max(dayStart, round5(nowMin)) : dayStart
  const slots = freeSlots(asBusy, input.date, { dayStart, dayEnd, buffer: 5, from })
    .map((s) => ({ ...s }))

  const flexible = open
    .filter((t) => t.horaMinutos == null)
    .sort((a, b) =>
    {
      const ea = essentials.indexOf(a.id)
      const eb = essentials.indexOf(b.id)
      if (ea !== eb) return (ea === -1 ? 99 : ea) - (eb === -1 ? 99 : eb)
      if (a.prioridade !== b.prioridade) return a.prioridade - b.prioridade
      return (a.estimativaMinutos || 30) - (b.estimativaMinutos || 30)
    })

  const unplaced: VisualDay['unplaced'] = []
  const capacity = input.capacityMinutes ?? Infinity
  let usedFlex = 0
  const placePause = (slot: { inicio: number; fim: number }, key: string) =>
  {
    if (slot.fim - slot.inicio >= pause + 10)
    {
      blocks.push({ id: `pz:${key}`, kind: 'pausa', titulo: 'Pausa', inicio: slot.inicio, fim: slot.inicio + pause, fixed: false })
      slot.inicio += pause
    }
  }
  for (const t of flexible)
  {
    const f = input.factorFor ? input.factorFor(t.titulo) : factor
    const minutos = round5(Math.max(10, (t.estimativaMinutos || 30) * (1 - (t.progresso || 0)) * f))
    // blocos longos cansam e travam o começo: no máximo MAX_BLOCK por vez
    const parts = Math.ceil(minutos / MAX_BLOCK)
    const partMin = round5(minutos / parts)
    let placedParts = 0
    for (let i = 0; i < parts; i += 1)
    {
      const isEssential = essentials.includes(t.id)
      if (!isEssential && usedFlex + partMin > capacity) break
      const slot = slots.find((sl) => sl.fim - sl.inicio >= partMin)
      if (!slot) break
      usedFlex += partMin
      blocks.push({
        id: `tk:${t.id}:${i}`,
        kind: 'tarefa',
        titulo: parts > 1 ? `${t.titulo} (parte ${i + 1} de ${parts})` : t.titulo,
        inicio: slot.inicio,
        fim: slot.inicio + partMin,
        fixed: false,
        taskId: t.id,
        essential: essentials.includes(t.id),
      })
      slot.inicio += partMin
      placePause(slot, `${t.id}:${i}`)
      placedParts += 1
    }
    if (placedParts < parts)
    {
      unplaced.push({
        taskId: t.id,
        titulo: placedParts ? `${t.titulo} (o resto)` : t.titulo,
        minutos: (parts - placedParts) * partMin,
      })
    }
  }

  blocks.sort((a, b) => a.inicio - b.inicio || (a.fixed === b.fixed ? 0 : a.fixed ? -1 : 1))
  const busyMinutes = blocks.filter((b) => b.fixed && !b.soft).reduce((s, b) => s + (b.fim - b.inicio), 0)
  const freeMinutes = Math.max(0, dayEnd - dayStart - busyMinutes)
  return {
    date: input.date,
    blocks,
    allDay: dayEvents.filter((e) => e.allDay),
    unplaced,
    doneCount,
    busyMinutes,
    freeMinutes,
  }
}

export type NowNext = {
  now: DayBlock | null
  next: DayBlock[]
  /** minutos até começar o próximo bloco */
  minutesToNext: number | null
  /** minutos restantes do bloco atual */
  minutesLeft: number | null
}

export function nowAndNext(day: VisualDay, ref = new Date(), limit = 3): NowNext
{
  const nowMin = ref.getHours() * 60 + ref.getMinutes()
  const now = day.blocks.find((b) => b.inicio <= nowMin && b.fim > nowMin && b.kind !== 'pausa')
    ?? day.blocks.find((b) => b.inicio <= nowMin && b.fim > nowMin)
    ?? null
  const upcoming = day.blocks.filter((b) => b.inicio > nowMin && b.kind !== 'pausa').slice(0, limit)
  return {
    now,
    next: upcoming,
    minutesToNext: upcoming[0] ? upcoming[0].inicio - nowMin : null,
    minutesLeft: now ? now.fim - nowMin : null,
  }
}

export type TransitionAlert = { atMin: number; title: string; body: string; blockId: string }

/** Avisos antes de cada atividade de horário fixo (e das tarefas encaixadas). */
export function transitionAlerts(day: VisualDay, warningsMin: number[], ref = new Date()): TransitionAlert[]
{
  if (!warningsMin.length) return []
  const nowMin = ref.getHours() * 60 + ref.getMinutes()
  const hhmm = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`
  const out: TransitionAlert[] = []
  for (const b of day.blocks)
  {
    if (b.kind === 'pausa') continue
    for (const w of warningsMin)
    {
      const at = b.inicio - w
      if (at <= nowMin) continue
      out.push({
        atMin: at,
        blockId: b.id,
        title: `Em ${w} min: ${b.titulo}`,
        body: b.fixed
          ? `Começa às ${hhmm(b.inicio)}${b.local ? ` · ${b.local}` : ''}. Dá tempo de terminar o que está fazendo com calma.`
          : `Às ${hhmm(b.inicio)} o plano sugere começar isso. Se não der, tudo bem.`,
      })
    }
  }
  return out.sort((a, b) => a.atMin - b.atMin).slice(0, 24)
}
