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
  hoje: 'Prazo: hoje',
  esta_semana: 'Esta semana',
  proxima_semana: 'Próximas semanas',
  sem_prazo: 'Intenções',
  concluido: 'Já concluídas',
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
