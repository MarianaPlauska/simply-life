import type { MobileTask } from './tasks'

/** Pilares de vida - UI estilo “Planos” (calendário amarelo) */
export type LifeCategoryId =
  | 'importante'
  | 'todos'
  | 'saude'
  | 'crescimento'
  | 'carreira'

export type LifeCategoryDef = {
  id: LifeCategoryId
  label: string
  icon: string
  /** Cor de acento para chips/timeline */
  accent: string
}

export const LIFE_CATEGORIES: LifeCategoryDef[] = [
  { id: 'importante', label: 'Importante', icon: 'flag-outline', accent: '#E85D4C' },
  { id: 'todos', label: 'Todos', icon: 'albums-outline', accent: '#5B8DEF' },
  { id: 'saude', label: 'Saúde', icon: 'heart-outline', accent: '#3DBE8B' },
  { id: 'crescimento', label: 'Crescimento pessoal', icon: 'book-outline', accent: '#F0A03A' },
  { id: 'carreira', label: 'Carreira', icon: 'briefcase-outline', accent: '#6B7280' },
]

const SAUDE_RE = /sa[uú]de|agua|água|treino|academia|medic|sono|humor|prote[ií]na|caminh|yoga/i
const CRESC_RE = /estud|curso|ler|leitura|curso|aprend|idioma|habito|hábito|crescimento|meta/i
const CARREIRA_RE =
  /trabalho|reuni[aã]o|relat[oó]rio|cliente|carreira|projeto|e-?mail|standup|sprint|entrega/i

/** Infere pilar a partir de prioridade + texto (sem schema novo no sync). */
export function inferLifeCategory(task: MobileTask): Exclude<LifeCategoryId, 'todos'>
{
  const blob = `${task.titulo} ${task.anotacao}`
  if (task.prioridade === 1) return 'importante'
  if (SAUDE_RE.test(blob)) return 'saude'
  if (CRESC_RE.test(blob)) return 'crescimento'
  if (CARREIRA_RE.test(blob)) return 'carreira'
  if (task.prioridade === 2) return 'importante'
  return 'carreira'
}

export function filterByLifeCategory(
  tasks: MobileTask[],
  category: LifeCategoryId,
): MobileTask[]
{
  if (category === 'todos') return tasks
  if (category === 'importante')
  {
    return tasks.filter((t) => inferLifeCategory(t) === 'importante' || hasReviewLater(t.anotacao))
  }
  return tasks.filter((t) => inferLifeCategory(t) === category)
}

const LIST_TAG = /#lista:([a-z0-9-]+)/i
const DEP_TAG = /#dep:([a-zA-Z0-9_-]+)/i
const LATER_TAG = /#verdepois\b/i

export type UserTaskList = {
  id: string
  name: string
  color?: string
  notas?: string
  createdAt?: string
}

export function taskListId(task: MobileTask): string | null
{
  const m = LIST_TAG.exec(task.anotacao || '')
  return m?.[1] ?? null
}

export function stampListTag(notas: string, listId: string): string
{
  const clean = (notas || '').replace(LIST_TAG, '').trim()
  return clean ? `${clean}\n#lista:${listId}` : `#lista:${listId}`
}

export function stripListTag(notas: string): string
{
  return (notas || '').replace(LIST_TAG, '').trim()
}

export function taskDependsOnId(task: MobileTask): string | null
{
  const m = DEP_TAG.exec(task.anotacao || '')
  return m?.[1] ?? null
}

export function stripDepTag(notas: string): string
{
  return (notas || '').replace(DEP_TAG, '').trim()
}

/** Flag “ver depois” — mantém destaque depois de concluir. */
export function hasReviewLater(notas: string): boolean
{
  return LATER_TAG.test(notas || '')
}

export function stampReviewLater(notas: string, on: boolean): string
{
  const clean = (notas || '').replace(LATER_TAG, '').trim()
  if (!on) return clean
  return clean ? `${clean}\n#verdepois` : '#verdepois'
}

export const EVO_STEPS = [0, 25, 50, 75, 100] as const
export type EvoStep = (typeof EVO_STEPS)[number]

const EVO_PCT_TAG = /#evopct:(\d+)/i
const EVO_NOTE_TAG = /#evo:(\d+):(\S*)/gi

export function parseEvoPct(notas: string): number | null
{
  const m = EVO_PCT_TAG.exec(notas || '')
  if (!m) return null
  const n = Number(m[1])
  if (!Number.isFinite(n)) return null
  return Math.max(0, Math.min(100, Math.round(n)))
}

export function parseEvoNotes(notas: string): Record<number, string>
{
  const out: Record<number, string> = {}
  const re = new RegExp(EVO_NOTE_TAG.source, 'gi')
  let m: RegExpExecArray | null = re.exec(notas || '')
  while (m)
  {
    const pct = Number(m[1])
    try
    {
      out[pct] = decodeURIComponent(m[2] || '')
    }
    catch
    {
      out[pct] = m[2] || ''
    }
    m = re.exec(notas || '')
  }
  return out
}

export function stampEvoPct(notas: string, pct: number): string
{
  const clean = (notas || '').replace(EVO_PCT_TAG, '').trim()
  const n = Math.max(0, Math.min(100, Math.round(pct)))
  return clean ? `${clean}\n#evopct:${n}` : `#evopct:${n}`
}

export function stampEvoNote(notas: string, pct: number, text: string): string
{
  const re = new RegExp(`#evo:${pct}:\\S*`, 'i')
  const without = (notas || '').replace(re, '').trim()
  const trimmed = text.trim()
  if (!trimmed) return without
  const line = `#evo:${pct}:${encodeURIComponent(trimmed)}`
  return without ? `${without}\n${line}` : line
}

export function stripEvoTags(notas: string): string
{
  return (notas || '')
    .replace(EVO_PCT_TAG, '')
    .replace(/#evo:\d+:\S*/gi, '')
    .trim()
}

export function nearestEvoStep(pct: number): EvoStep
{
  let best: EvoStep = 0
  for (const step of EVO_STEPS)
  {
    if (Math.abs(step - pct) < Math.abs(best - pct)) best = step
  }
  return best
}

export function stripTaskMetaTags(notas: string): string
{
  return stampReviewLater(stripDepTag(stripListTag(notas)), false)
}

/** Texto visível: sem tags de pasta, dependência, flag ou evolução. */
export function stripTaskDisplayNotes(notas: string): string
{
  return stripEvoTags(stripTaskMetaTags(notas))
}

export function stampDepTag(notas: string, depId: string): string
{
  const clean = stripDepTag(notas)
  return clean ? `${clean}\n#dep:${depId}` : `#dep:${depId}`
}

export function applyTaskList(notas: string, listId: string | null): string
{
  const body = stripListTag(notas)
  if (!listId) return body
  return stampListTag(body, listId)
}

function restampEvo(body: string, source: string): string
{
  let next = stripEvoTags(body)
  const pct = parseEvoPct(source)
  if (pct != null) next = stampEvoPct(next, pct)
  for (const [key, text] of Object.entries(parseEvoNotes(source)))
  {
    next = stampEvoNote(next, Number(key), text)
  }
  return next
}

/** Reaplica marcos de evolução sobre o texto visível. */
export function mergeEvoTags(visible: string, source: string): string
{
  return restampEvo(visible, source)
}

export function applyTaskMeta(
  notas: string,
  listId: string | null,
  dependsOnId: string | null,
): string
{
  let body = stripEvoTags(stripTaskMetaTags(notas))
  if (listId) body = stampListTag(body, listId)
  if (dependsOnId) body = stampDepTag(body, dependsOnId)
  return restampEvo(body, notas)
}

export function filterByUserList(tasks: MobileTask[], listId: string): MobileTask[]
{
  return tasks.filter((t) => taskListId(t) === listId)
}

export function countByLifeCategory(
  tasks: MobileTask[],
): Record<LifeCategoryId, number>
{
  const open = tasks.filter((t) => t.status !== 'done')
  return {
    importante: filterByLifeCategory(open, 'importante').length,
    todos: open.length,
    saude: filterByLifeCategory(open, 'saude').length,
    crescimento: filterByLifeCategory(open, 'crescimento').length,
    carreira: filterByLifeCategory(open, 'carreira').length,
  }
}

/** Ícone Ionicons para nó da timeline do dia */
export function timelineIconForTask(task: MobileTask): string
{
  const cat = inferLifeCategory(task)
  if (cat === 'saude') return 'fitness-outline'
  if (cat === 'crescimento') return 'school-outline'
  if (cat === 'carreira') return 'car-outline'
  if (cat === 'importante') return 'star-outline'
  return 'ellipse-outline'
}

export function timelineColorForTask(task: MobileTask): string
{
  const cat = inferLifeCategory(task)
  return LIFE_CATEGORIES.find((c) => c.id === cat)?.accent ?? '#B76021'
}
