import { useEffect, useRef } from 'react'
import { useDataStore } from '../store/dataStore'
import { usePlanLogStore } from '../store/planLogStore'

/**
 * Registra no aparelho QUANDO cada tarefa foi concluída (e desfaz se reabrir).
 * O banco também grava (concluido_em, migração 059); este registro cobre
 * convidado, offline e contas sem a migração. Base dos relatórios do ritmo.
 */
export function useTaskCompletionLog(): void
{
  const tasks = useDataStore((s) => s.tasks)
  const hydrate = usePlanLogStore((s) => s.hydrate)
  const prev = useRef<Map<string, string> | null>(null)

  useEffect(() =>
  {
    void hydrate()
  }, [hydrate])

  useEffect(() =>
  {
    const list = tasks ?? []
    const current = new Map(list.map((t) => [t.id, t.status]))
    const before = prev.current
    prev.current = current
    // primeira carga: não é conclusão, é só o estado que veio do servidor
    if (!before) return
    const log = usePlanLogStore.getState()
    for (const t of list)
    {
      const was = before.get(t.id)
      if (was === undefined) continue
      if (t.status === 'done' && was !== 'done') log.recordCompletion(t.id)
      else if (t.status !== 'done' && was === 'done') log.forgetCompletion(t.id)
    }
  }, [tasks])
}
