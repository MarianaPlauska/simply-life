import type { Label, TarefaUnificada } from '../types'

/** Mapeia linha do Supabase (fetch ou Realtime) para o modelo da UI */
export function mapTarefaFromRow(row: Record<string, unknown>): TarefaUnificada
{
  const raw = row as unknown as TarefaUnificada & {
    tarefa_labels?: { label_id: number; labels: Label }[]
    subtarefas?: TarefaUnificada['subtarefas']
  }

  const labelsFromJoin = (raw.tarefa_labels || [])
    .map((tl) => tl.labels)
    .filter(Boolean) as Label[]

  return {
    ...raw,
    subtarefas: raw.subtarefas ?? [],
    labels: raw.labels?.length ? raw.labels : labelsFromJoin,
  }
}
