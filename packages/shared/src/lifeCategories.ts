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
  return tasks.filter((t) => inferLifeCategory(t) === category)
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
