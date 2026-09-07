import { isoDaysAgo, localTodayIso, startOfDay, todayIso } from './dates'
import {
  LIFE_CATEGORIES,
  filterByLifeCategory,
  filterByUserList,
  inferLifeCategory,
  parseEvoPct,
  hasReviewLater,
  taskListId,
  type LifeCategoryId,
  type UserTaskList,
} from './lifeCategories'
import type { MobileTask } from './tasks'

export type ReportPeriod = 'all' | '7d' | 'month' | '30d'

export const REPORT_PERIODS: { id: ReportPeriod; label: string }[] = [
  { id: 'all', label: 'Todo o período' },
  { id: '7d', label: '7 dias' },
  { id: 'month', label: 'Este mês' },
  { id: '30d', label: '30 dias' },
]

export const FOLDER_PALETTE = [
  '#E8734A',
  '#7BC9A0',
  '#D4B896',
  '#9AA8B5',
  '#C4784A',
  '#C44B4B',
  '#5B8DEF',
] as const

export function periodRange(period: ReportPeriod, ref = new Date()): { from: string | null; to: string }
{
  const to = todayIso(ref)
  if (period === 'all') return { from: null, to }
  if (period === '7d') return { from: isoDaysAgo(6, ref), to }
  if (period === '30d') return { from: isoDaysAgo(29, ref), to }
  const start = new Date(ref.getFullYear(), ref.getMonth(), 1)
  return { from: start.toISOString().slice(0, 10), to }
}

/** Tarefa entra no recorte se o prazo (ou a ausência dele, no período total) cair na faixa. */
export function taskInPeriod(task: MobileTask, from: string | null, to: string): boolean
{
  const iso = task.dataVencimento?.slice(0, 10)
  if (!iso) return from == null
  if (from && iso < from) return false
  if (iso > to) return false
  return true
}

export function filterTasksByPeriod(
  tasks: MobileTask[] | null | undefined,
  period: ReportPeriod,
  ref = new Date(),
): MobileTask[]
{
  const { from, to } = periodRange(period, ref)
  return (tasks ?? []).filter((t) => taskInPeriod(t, from, to))
}

export function taskProgressPct(task: MobileTask): number
{
  if (task.status === 'done') return 100
  const evo = parseEvoPct(task.anotacao)
  if (evo != null) return evo
  const raw = task.progresso || 0
  if (raw > 0 && raw <= 1) return Math.round(raw * 100)
  if (raw > 1) return Math.min(100, Math.round(raw))
  const total = task.checklist.length
  if (total > 0)
  {
    const done = task.checklist.filter((c) => c.feito).length
    return Math.round((done / total) * 100)
  }
  if (task.status === 'doing') return 40
  return 0
}

/** Cobre só urgente, quase pronto, ou flag “ver depois” (mesmo concluída). */
export function taskHasAccent(task: MobileTask, today = localTodayIso()): boolean
{
  const later = hasReviewLater(task.anotacao)
  if (task.status === 'done') return later
  const pct = taskProgressPct(task)
  const almost = pct >= 75
  const urgent = task.prioridade === 1
  const due = task.dataVencimento?.slice(0, 10)
  const overdue = Boolean(due && due < today)
  return later || almost || urgent || overdue
}

export function daysUntilDue(iso: string | null | undefined, ref = new Date()): number | null
{
  if (!iso) return null
  const due = new Date(`${iso.slice(0, 10)}T12:00:00`)
  if (Number.isNaN(due.getTime())) return null
  const a = startOfDay(ref)
  const b = startOfDay(due)
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

export function formatCountdown(days: number | null): string
{
  if (days == null) return 'Sem prazo'
  if (days === 0) return 'Hoje'
  if (days === 1) return '1 dia'
  if (days === -1) return '1 dia atrasado'
  if (days < 0) return `${Math.abs(days)} dias atrasado`
  return `${days} dias`
}

export type BinaryStat = {
  id: string
  label: string
  done: number
  missed: number
}

function checklistTotals(tasks: MobileTask[]): { done: number; open: number }
{
  let done = 0
  let open = 0
  for (const t of tasks)
  {
    for (const item of t.checklist)
    {
      if (item.feito) done += 1
      else open += 1
    }
  }
  return { done, open }
}

export function taskBinaryStats(tasks: MobileTask[]): BinaryStat[]
{
  const done = tasks.filter((t) => t.status === 'done').length
  const open = tasks.filter((t) => t.status !== 'done').length
  const checks = checklistTotals(tasks)
  return [
    { id: 'tasks', label: 'Tarefas', done, missed: open },
    { id: 'checks', label: 'Checklist', done: checks.done, missed: checks.open },
  ]
}

export type WeekPoint = {
  iso: string
  label: string
  done: number
  open: number
  minutes: number
  score: number
}

export type WeekMetric = 'score' | 'done' | 'time'

export function weekEvolution(tasks: MobileTask[], days = 7, ref = new Date()): WeekPoint[]
{
  const out: WeekPoint[] = []
  for (let i = days - 1; i >= 0; i -= 1)
  {
    const iso = isoDaysAgo(i, ref)
    const dayTasks = tasks.filter((t) => t.dataVencimento?.slice(0, 10) === iso)
    const done = dayTasks.filter((t) => t.status === 'done').length
    const open = dayTasks.filter((t) => t.status !== 'done').length
    const minutes = dayTasks
      .filter((t) => t.status === 'done')
      .reduce((s, t) => s + (t.estimativaMinutos || 0), 0)
    const checks = checklistTotals(dayTasks.filter((t) => t.status === 'done'))
    out.push({
      iso,
      label: new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'narrow' }),
      done,
      open,
      minutes,
      score: done * 10 + checks.done * 2,
    })
  }
  return out
}

export function weekMetricValue(point: WeekPoint, metric: WeekMetric): number
{
  if (metric === 'done') return point.done
  if (metric === 'time') return point.minutes
  return point.score
}

export type TimeTriad = {
  done: number
  onTime: number
  late: number
}

/** Tríade: concluídas, em aberto no prazo, atrasadas. */
export function timeTriad(tasks: MobileTask[], ref = new Date()): TimeTriad
{
  let done = 0
  let onTime = 0
  let late = 0
  for (const t of tasks)
  {
    if (t.status === 'done')
    {
      done += 1
      continue
    }
    const days = daysUntilDue(t.dataVencimento, ref)
    if (days != null && days < 0) late += 1
    else onTime += 1
  }
  return { done, onTime, late }
}

export type ScopeKind = 'user' | 'life' | 'loose'

export type ScopeSnapshot = {
  id: string
  name: string
  kind: ScopeKind
  color: string
  total: number
  done: number
  open: number
  pct: number
  latestDue: string | null
  checklistDone: number
  checklistTotal: number
  createdAt?: string
}

function snapshotFromTasks(
  id: string,
  name: string,
  kind: ScopeKind,
  color: string,
  list: MobileTask[],
  createdAt?: string,
): ScopeSnapshot
{
  const done = list.filter((t) => t.status === 'done').length
  const total = list.length
  const checks = checklistTotals(list)
  const dues = list
    .map((t) => t.dataVencimento?.slice(0, 10))
    .filter((iso): iso is string => Boolean(iso))
    .sort()
  return {
    id,
    name,
    kind,
    color,
    total,
    done,
    open: total - done,
    pct: total > 0 ? Math.round((done / total) * 100) : 0,
    latestDue: dues[0] ?? null,
    checklistDone: checks.done,
    checklistTotal: checks.done + checks.open,
    createdAt,
  }
}

export function buildUserScopeSnapshots(
  tasks: MobileTask[],
  lists: UserTaskList[],
): ScopeSnapshot[]
{
  return lists.map((list, i) =>
    snapshotFromTasks(
      list.id,
      list.name,
      'user',
      list.color || FOLDER_PALETTE[i % FOLDER_PALETTE.length],
      filterByUserList(tasks, list.id),
      list.createdAt,
    ),
  )
}

export function buildLifeScopeSnapshots(tasks: MobileTask[]): ScopeSnapshot[]
{
  return LIFE_CATEGORIES.filter((c) => c.id !== 'todos').map((c) =>
    snapshotFromTasks(
      `life-${c.id}`,
      c.label,
      'life',
      c.accent,
      filterByLifeCategory(tasks, c.id),
    ),
  )
}

export function buildLooseScopeSnapshot(tasks: MobileTask[]): ScopeSnapshot
{
  const loose = tasks.filter((t) => !taskListId(t))
  return snapshotFromTasks('loose', 'Sem pasta', 'loose', '#9AA8B5', loose)
}

export function folderBinaryStats(snapshots: ScopeSnapshot[]): BinaryStat
{
  const complete = snapshots.filter((s) => s.total > 0 && s.open === 0).length
  const incomplete = snapshots.filter((s) => s.open > 0).length
  return { id: 'folders', label: 'Pastas', done: complete, missed: incomplete }
}

export function tasksForScope(
  tasks: MobileTask[],
  scopeId: string,
  lists: UserTaskList[],
): MobileTask[]
{
  if (scopeId === 'loose') return tasks.filter((t) => !taskListId(t))
  if (scopeId.startsWith('life-'))
  {
    const cat = scopeId.slice(5) as LifeCategoryId
    return filterByLifeCategory(tasks, cat)
  }
  if (lists.some((l) => l.id === scopeId)) return filterByUserList(tasks, scopeId)
  return []
}

export function inferScopeColor(task: MobileTask, lists: UserTaskList[]): string
{
  const listId = taskListId(task)
  if (listId)
  {
    const found = lists.find((l) => l.id === listId)
    if (found?.color) return found.color
  }
  return LIFE_CATEGORIES.find((c) => c.id === inferLifeCategory(task))?.accent ?? '#E8734A'
}

/** Marca visual da linha: urgente vermelho; senão a cor da pasta. */
export function taskMarkColor(
  task: MobileTask,
  lists: UserTaskList[],
  urgentColor = '#C44B4B',
): string
{
  if (task.prioridade === 1) return urgentColor
  return inferScopeColor(task, lists)
}
