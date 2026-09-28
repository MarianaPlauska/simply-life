import {
  CHART_DARK,
  CHART_LIGHT,
  CHART_SERIES,
  chartColor,
  type ChartPalette,
  type ChartSeries,
} from '@simply-life/ui-tokens'
import { isoDaysAgo, localTodayIso, startOfDay, todayIso } from './dates'
import {
  LIFE_CATEGORIES,
  filterByLifeCategory,
  filterByUserList,
  inferLifeCategory,
  lifeCategoryAccent,
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

/**
 * Cores de pasta: guardamos a chave da paleta categórica (`ChartSeries`),
 * nunca o hex. A cor final depende do modo e sai de `folderColor(stored, chart)`.
 * Ordem usada para pastas novas (cicla por índice).
 */
export const FOLDER_SERIES: readonly ChartSeries[] = CHART_SERIES

/** Nomes para leitores de tela no seletor de cor */
export const FOLDER_SERIES_LABELS: Readonly<Record<ChartSeries, string>> = {
  teal: 'Verde-azulado',
  amber: 'Âmbar',
  blue: 'Azul',
  clay: 'Terracota',
  violet: 'Violeta',
  green: 'Verde',
  plum: 'Ameixa',
  slate: 'Ardósia',
}

/**
 * Paleta antiga (hex fixo, com coral e vermelho). Só para leitura de dados
 * antigos; não use em cores novas.
 */
export const LEGACY_FOLDER_PALETTE = [
  '#E8734A',
  '#7BC9A0',
  '#D4B896',
  '#9AA8B5',
  '#C4784A',
  '#C44B4B',
  '#5B8DEF',
] as const

/**
 * Hex antigo para chave. Coral (ação) e vermelho (parece erro) saem da
 * identidade de pasta: coral e ferrugem viram `clay`, vermelho vira `plum`.
 */
export const LEGACY_FOLDER_HEX_TO_SERIES: Readonly<Record<string, ChartSeries>> = {
  '#E8734A': 'clay',
  '#7BC9A0': 'teal',
  '#D4B896': 'amber',
  '#9AA8B5': 'slate',
  '#C4784A': 'clay',
  '#C44B4B': 'plum',
  '#5B8DEF': 'blue',
}

export function isChartSeries(value: unknown): value is ChartSeries
{
  return typeof value === 'string' && (CHART_SERIES as readonly string[]).includes(value)
}

export function defaultFolderSeries(index: number): ChartSeries
{
  const n = FOLDER_SERIES.length
  return FOLDER_SERIES[((Math.trunc(index) % n) + n) % n]
}

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i

function hexToLab(hex: string): [number, number, number] | null
{
  const m = HEX_RE.exec(hex.trim())
  if (!m) return null
  const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1]
  const lin = [0, 2, 4].map((i) =>
  {
    const c = parseInt(h.slice(i, i + 2), 16) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  const [r, g, b] = lin
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  const x = f((r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047)
  const y = f(r * 0.2126 + g * 0.7152 + b * 0.0722)
  const z = f((r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883)
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)]
}

let seriesLab: { key: ChartSeries; light: [number, number, number]; dark: [number, number, number] }[] | null = null

/** Chave mais próxima (distância Lab média entre os modos claro e escuro). */
export function nearestChartSeries(hex: string): ChartSeries | null
{
  const lab = hexToLab(hex)
  if (!lab) return null
  if (!seriesLab)
  {
    seriesLab = CHART_SERIES.map((key, i) => ({
      key,
      light: hexToLab(CHART_LIGHT[i]) as [number, number, number],
      dark: hexToLab(CHART_DARK[i]) as [number, number, number],
    }))
  }
  const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
  let best: ChartSeries | null = null
  let bestD = Infinity
  for (const s of seriesLab)
  {
    const d = (dist(lab, s.light) + dist(lab, s.dark)) / 2
    if (d < bestD)
    {
      bestD = d
      best = s.key
    }
  }
  return best
}

function normalizeHex(raw: string): string
{
  const t = raw.trim()
  return (t.startsWith('#') ? t : `#${t}`).toUpperCase()
}

/**
 * Normaliza qualquer cor guardada (pasta, categoria de gasto, conta fixa, meta):
 * chave válida fica como está, hex antigo passa pela tabela `legacy`, hex qualquer
 * vai para a chave mais próxima, vazio ou lixo cai em `fallback` (chave ou índice).
 */
export function seriesFromStored(
  stored: unknown,
  fallback: ChartSeries | number = 0,
  legacy: Readonly<Record<string, ChartSeries>> = LEGACY_FOLDER_HEX_TO_SERIES,
): ChartSeries
{
  if (isChartSeries(stored)) return stored
  if (typeof stored === 'string' && stored.trim())
  {
    const hit = legacy[normalizeHex(stored)]
    if (hit) return hit
    const near = nearestChartSeries(stored)
    if (near) return near
  }
  return typeof fallback === 'number' ? defaultFolderSeries(fallback) : fallback
}

/** Cor final no modo atual para um valor guardado: passe `chart` de `useTheme()`. */
export function seriesColor(
  stored: unknown,
  palette: ChartPalette,
  fallback: ChartSeries | number = 0,
  legacy?: Readonly<Record<string, ChartSeries>>,
): string
{
  return chartColor(palette, seriesFromStored(stored, fallback, legacy))
}

/** Normaliza o valor guardado em `UserTaskList.color`. */
export function folderSeriesFromStored(stored: unknown, fallbackIndex = 0): ChartSeries
{
  return seriesFromStored(stored, fallbackIndex)
}

/** Cor da pasta no modo atual: passe `chart` de `useTheme()`. */
export function folderColor(stored: unknown, palette: ChartPalette, fallbackIndex = 0): string
{
  return seriesColor(stored, palette, fallbackIndex)
}

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
  palette: ChartPalette,
): ScopeSnapshot[]
{
  return lists.map((list, i) =>
    snapshotFromTasks(
      list.id,
      list.name,
      'user',
      folderColor(list.color, palette, i),
      filterByUserList(tasks, list.id),
      list.createdAt,
    ),
  )
}

export function buildLifeScopeSnapshots(tasks: MobileTask[], palette: ChartPalette): ScopeSnapshot[]
{
  return LIFE_CATEGORIES.filter((c) => c.id !== 'todos').map((c) =>
    snapshotFromTasks(
      `life-${c.id}`,
      c.label,
      'life',
      lifeCategoryAccent(c.id, palette),
      filterByLifeCategory(tasks, c.id),
    ),
  )
}

/**
 * "Sem pasta" usa um neutro do tema (ex. `colors.inkFaint`), não uma cor da paleta,
 * para não se confundir com uma pasta `slate`.
 */
export function buildLooseScopeSnapshot(tasks: MobileTask[], neutralColor: string): ScopeSnapshot
{
  const loose = tasks.filter((t) => !taskListId(t))
  return snapshotFromTasks('loose', 'Sem pasta', 'loose', neutralColor, loose)
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

export function inferScopeColor(
  task: MobileTask,
  lists: UserTaskList[],
  palette: ChartPalette,
): string
{
  const listId = taskListId(task)
  if (listId)
  {
    const idx = lists.findIndex((l) => l.id === listId)
    if (idx >= 0) return folderColor(lists[idx].color, palette, idx)
  }
  return lifeCategoryAccent(inferLifeCategory(task), palette)
}

/** Marca visual da linha: urgente vermelho; senão a cor da pasta. */
export function taskMarkColor(
  task: MobileTask,
  lists: UserTaskList[],
  urgentColor: string,
  palette: ChartPalette,
): string
{
  if (task.prioridade === 1) return urgentColor
  return inferScopeColor(task, lists, palette)
}
