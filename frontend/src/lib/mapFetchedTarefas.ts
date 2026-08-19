import type { Label, Subtarefa, TarefaUnificada } from '../types'
import { mapTarefaFromRow } from '../utils/mapTarefaFromRow'

type FetchedRow = Record<string, unknown> & {
  id: number
  tarefa_labels?: { label_id: number; labels: Label | null }[]
  subtarefas?: Subtarefa[]
  contexto_itens?: Array<{
    tipo_item?: string
    contextos?: { titulo: string; cor: string } | null
  }>
}

function mergeUniqueById<T extends { id: number }>(a: T[], b: T[]): T[]
{
  const map = new Map<number, T>()
  for (const item of [...a, ...b])
  {
    if (!item) continue
    map.set(item.id, item)
  }
  return [...map.values()]
}

function attachContexto(row: FetchedRow, tarefa: TarefaUnificada): TarefaUnificada
{
  const cItem = row.contexto_itens?.[0]
  const contexto = cItem?.contextos
    ? { titulo: cItem.contextos.titulo, cor: cItem.contextos.cor }
    : tarefa.contexto
  return contexto ? { ...tarefa, contexto } : tarefa
}

/**
 * Normaliza o fetch do board.
 * PostgREST aninha 1:N, mas um JOIN cartesiano (labels × subtarefas) pode
 * devolver a mesma tarefa mais de uma vez. Colapsa por id e une relações.
 */
export function mapFetchedTarefas(rows: unknown[] | null | undefined): TarefaUnificada[]
{
  const byId = new Map<number, TarefaUnificada>()

  for (const raw of rows || [])
  {
    const row = raw as FetchedRow
    if (row == null || typeof row.id !== 'number') continue

    const mapped = attachContexto(row, mapTarefaFromRow(row))
    const existing = byId.get(mapped.id)
    if (!existing)
    {
      byId.set(mapped.id, mapped)
      continue
    }

    byId.set(mapped.id, {
      ...existing,
      ...mapped,
      labels: mergeUniqueById(existing.labels || [], mapped.labels || []),
      subtarefas: mergeUniqueById(existing.subtarefas || [], mapped.subtarefas || []),
    })
  }

  return [...byId.values()]
}
