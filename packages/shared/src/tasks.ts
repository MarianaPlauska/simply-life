import { startOfDay } from './dates'

export type TaskStatus = 'todo' | 'doing' | 'done'

export interface MobileTask
{
  id: string
  titulo: string
  status: TaskStatus
  dataVencimento: string | null
  /** minutos desde meia-noite, para timeline */
  horaMinutos: number | null
  estimativaMinutos: number
  progresso: number
  checklist: { id: string; texto: string; feito: boolean }[]
  anotacao: string
  prioridade: 1 | 2 | 3
}

export type DueBucket = 'vencido' | 'hoje' | 'esta_semana' | 'proxima_semana' | 'sem_prazo' | 'concluido'

export const DUE_BUCKET_LABELS: Record<DueBucket, string> = {
  vencido: 'Passou da data',
  hoje: 'Prazo hoje',
  esta_semana: 'Esta semana',
  proxima_semana: 'Próximas semanas',
  sem_prazo: 'Intenções',
  concluido: 'Já concluídas',
}

/** Colunas ativas do Kanban (sem concluídas) */
export const ACTIVE_DUE_BUCKETS: DueBucket[] = [
  'vencido',
  'hoje',
  'esta_semana',
  'proxima_semana',
  'sem_prazo',
]

export type DueBucketGroup = {
  id: DueBucket
  label: string
  tasks: MobileTask[]
}

export function groupTasksByDueBucket(
  tasks: MobileTask[] | null | undefined,
  ref = new Date(),
): DueBucketGroup[]
{
  const buckets: Record<string, MobileTask[]> = {}
  for (const id of ACTIVE_DUE_BUCKETS)
  {
    buckets[id] = []
  }

  for (const task of tasks ?? [])
  {
    const id = classifyDueBucket(task.dataVencimento, task.status, ref)
    if (id === 'concluido') continue
    if (!buckets[id]) buckets[id] = []
    buckets[id].push(task)
  }

  return ACTIVE_DUE_BUCKETS.map((id) => ({
    id,
    label: DUE_BUCKET_LABELS[id],
    tasks: buckets[id] ?? [],
  }))
}

const MS_PER_DAY = 86_400_000

export function classifyDueBucket(
  dataVencimento: string | null,
  status: TaskStatus,
  now = new Date(),
): DueBucket
{
  if (status === 'done') return 'concluido'
  if (!dataVencimento) return 'sem_prazo'
  const due = new Date(`${dataVencimento.slice(0, 10)}T12:00:00`)
  if (Number.isNaN(due.getTime())) return 'sem_prazo'
  const diff = Math.round(
    (startOfDay(due).getTime() - startOfDay(now).getTime()) / MS_PER_DAY,
  )
  if (diff < 0) return 'vencido'
  if (diff === 0) return 'hoje'
  if (diff <= 7) return 'esta_semana'
  return 'proxima_semana'
}

export function partitionTodayTimeline(tasks: MobileTask[], ref = new Date()): MobileTask[]
{
  const iso = ref.toISOString().slice(0, 10)
  return tasks
    .filter((t) => t.status !== 'done')
    .filter((t) =>
    {
      if (t.dataVencimento?.slice(0, 10) === iso) return true
      if (t.horaMinutos != null && !t.dataVencimento) return true
      return classifyDueBucket(t.dataVencimento, t.status, ref) === 'hoje'
    })
    .sort((a, b) => (a.horaMinutos ?? 9999) - (b.horaMinutos ?? 9999))
}

export type PriorityTodayItem = {
  task: MobileTask
  bucket: 'vencido' | 'hoje'
}

/**
 * Home orquestradora - só "Passou da data" + "Prazo hoje".
 * Ordem: vencido primeiro, depois hoje; mais antigo primeiro.
 */
export function priorityTodayTasks(
  tasks: MobileTask[] | null | undefined,
  ref = new Date(),
  limit = 4,
): PriorityTodayItem[]
{
  const list = (tasks ?? [])
    .filter((t) => t.status !== 'done')
    .map((task) =>
    {
      const bucket = classifyDueBucket(task.dataVencimento, task.status, ref)
      return { task, bucket }
    })
    .filter((x): x is PriorityTodayItem => x.bucket === 'vencido' || x.bucket === 'hoje')
    .sort((a, b) =>
    {
      if (a.bucket !== b.bucket) return a.bucket === 'vencido' ? -1 : 1
      const da = a.task.dataVencimento || ''
      const db = b.task.dataVencimento || ''
      if (da !== db) return da.localeCompare(db)
      return (a.task.horaMinutos ?? 9999) - (b.task.horaMinutos ?? 9999)
    })
  return list.slice(0, limit)
}

export function formatTimelineHour(hour: number): string
{
  return `${String(hour).padStart(2, '0')}:00`
}

export function minutesToLabel(total: number): string
{
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Data ISO (YYYY-MM-DD) alvo para um bucket de prazo */
export function dueDateForBucket(bucket: DueBucket, ref = new Date()): string | null
{
  const d = new Date(ref)
  d.setHours(12, 0, 0, 0)
  if (bucket === 'sem_prazo' || bucket === 'concluido') return null
  if (bucket === 'hoje') return d.toISOString().slice(0, 10)
  if (bucket === 'vencido')
  {
    d.setDate(d.getDate() - 1)
    return d.toISOString().slice(0, 10)
  }
  if (bucket === 'esta_semana')
  {
    d.setDate(d.getDate() + 3)
    return d.toISOString().slice(0, 10)
  }
  d.setDate(d.getDate() + 10)
  return d.toISOString().slice(0, 10)
}
