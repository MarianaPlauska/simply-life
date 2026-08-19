import type { TarefaUnificada } from '../types'

// Classificação por prazo — ortogonal à fila Executar agora (ExecQueue)

export type DueBucket =
  | 'vencido'
  | 'hoje'
  | 'esta_semana'
  | 'proxima_semana'
  | 'sem_prazo'
  | 'concluido'

export const DUE_BUCKET_ORDER: DueBucket[] = [
  'vencido',
  'hoje',
  'esta_semana',
  'proxima_semana',
  'sem_prazo',
  'concluido',
]

export const ACTIVE_DUE_BUCKETS: DueBucket[] = DUE_BUCKET_ORDER.filter(
  (b) => b !== 'concluido',
)

/** Só "hoje" fica visível vazia — demais faixas aparecem quando têm itens */
export const DUE_BUCKET_ALWAYS_VISIBLE: DueBucket[] = [
  'hoje',
]

export const DUE_BUCKET_LABELS: Record<DueBucket, string> = {
  vencido: 'Atrasadas',
  hoje: 'Prazo: hoje',
  esta_semana: 'Esta semana',
  proxima_semana: 'Próximas semanas',
  sem_prazo: 'Sem data definida',
  concluido: 'Já concluídas',
}

/** Explicação curta — o que entra em cada faixa (só prazo, não fila de execução). */
export const DUE_BUCKET_HINTS: Record<DueBucket, string> = {
  vencido: 'Data limite já passou e a tarefa segue aberta.',
  hoje: 'A data de vencimento é hoje — precisa sair até o fim do dia.',
  esta_semana: 'Vence entre amanhã e os próximos 7 dias.',
  proxima_semana: 'Vence daqui a mais de uma semana.',
  sem_prazo: 'Nenhuma data marcada — fica no backlog até você definir prazo.',
  concluido: 'Tarefas finalizadas — não entram na fila de execução.',
}

export const DUE_BUCKET_META: Record<
  DueBucket,
  { index: string; tone: 'urgente' | 'atencao' | 'accent' | 'muted' }
> = {
  vencido: { index: 'A', tone: 'urgente' },
  hoje: { index: 'B', tone: 'atencao' },
  esta_semana: { index: 'C', tone: 'accent' },
  proxima_semana: { index: 'D', tone: 'muted' },
  sem_prazo: { index: 'E', tone: 'muted' },
  concluido: { index: 'F', tone: 'muted' },
}

export const DUE_BUCKET_DROP_PREFIX = 'due:'

const MS_PER_DAY = 86_400_000

export function startOfDay(d: Date): Date
{
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function diffDaysFromToday(due: Date, now: Date): number
{
  const today = startOfDay(now).getTime()
  const dueDay = startOfDay(due).getTime()
  return Math.round((dueDay - today) / MS_PER_DAY)
}

function parseDueDate(dataVencimento: string | null | undefined): Date | null
{
  if (!dataVencimento) return null
  const day = dataVencimento.slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(day))
  {
    const local = new Date(`${day}T12:00:00`)
    return Number.isNaN(local.getTime()) ? null : local
  }
  const due = new Date(dataVencimento)
  if (Number.isNaN(due.getTime())) return null
  return due
}

/** Data civil YYYY-MM-DD ou ISO — meio-dia local evita virar dia anterior no fuso BR */
export function parseCalendarDate(dataVencimento: string | null | undefined): Date | null
{
  return parseDueDate(dataVencimento)
}

/** Classifica tarefa pela data de vencimento (determinístico). */
export function resolveDueBucket(
  tarefa: TarefaUnificada,
  now: Date = new Date(),
): DueBucket
{
  if (tarefa.status === 'concluida')
  {
    return 'concluido'
  }

  const due = parseDueDate(tarefa.data_vencimento)
  if (!due)
  {
    return 'sem_prazo'
  }

  const diff = diffDaysFromToday(due, now)

  if (diff < 0) return 'vencido'
  if (diff === 0) return 'hoje'
  if (diff >= 1 && diff <= 7) return 'esta_semana'
  return 'proxima_semana'
}

export function bucketByDueDate(
  tarefas: TarefaUnificada[],
  now: Date = new Date(),
): Record<DueBucket, TarefaUnificada[]>
{
  const buckets = Object.fromEntries(
    DUE_BUCKET_ORDER.map((b) => [b, [] as TarefaUnificada[]]),
  ) as Record<DueBucket, TarefaUnificada[]>

  for (const t of tarefas)
  {
    const bucket = resolveDueBucket(t, now)
    buckets[bucket].push(t)
  }

  const sortActive = (a: TarefaUnificada, b: TarefaUnificada) =>
    (b.score_urgencia ?? 0) - (a.score_urgencia ?? 0)

  for (const key of ACTIVE_DUE_BUCKETS)
  {
    buckets[key].sort(sortActive)
  }

  buckets.concluido.sort((a, b) =>
  {
    const ad = a.data_vencimento ? new Date(a.data_vencimento).getTime() : 0
    const bd = b.data_vencimento ? new Date(b.data_vencimento).getTime() : 0
    return bd - ad
  })

  return buckets
}

function toIsoDate(d: Date): string
{
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}T17:00:00.000Z`
}

/** Snap de prazo ao soltar em uma faixa do board de Prazo. */
export function snapDueDateForBucket(
  bucket: DueBucket,
  now: Date = new Date(),
): string | null
{
  const today = startOfDay(now)

  switch (bucket)
  {
    case 'vencido':
    case 'hoje':
      return toIsoDate(today)
    case 'esta_semana':
    {
      const target = new Date(today)
      target.setDate(target.getDate() + 4)
      return toIsoDate(target)
    }
    case 'proxima_semana':
    {
      const target = new Date(today)
      target.setDate(target.getDate() + 11)
      return toIsoDate(target)
    }
    case 'sem_prazo':
      return null
    case 'concluido':
      return null
    default:
      return null
  }
}

export function dueBucketDropId(bucket: DueBucket): string
{
  return `${DUE_BUCKET_DROP_PREFIX}${bucket}`
}

export function parseDueBucketDropId(id: string | number): DueBucket | null
{
  if (typeof id !== 'string' || !id.startsWith(DUE_BUCKET_DROP_PREFIX))
  {
    return null
  }

  const bucket = id.slice(DUE_BUCKET_DROP_PREFIX.length) as DueBucket
  if (!DUE_BUCKET_ORDER.includes(bucket))
  {
    return null
  }

  return bucket
}

/** Faixas que aceitam drop para alterar prazo. */
export function isDueBucketDropTarget(bucket: DueBucket): boolean
{
  return bucket !== 'concluido'
}

export function dueBucketDropHint(bucket: DueBucket): string
{
  switch (bucket)
  {
    case 'vencido':
    case 'hoje':
      return 'Mover prazo → hoje'
    case 'esta_semana':
      return 'Mover prazo → esta semana'
    case 'proxima_semana':
      return 'Mover prazo → próxima semana'
    case 'sem_prazo':
      return 'Remover prazo'
    default:
      return 'Mover prazo'
  }
}
