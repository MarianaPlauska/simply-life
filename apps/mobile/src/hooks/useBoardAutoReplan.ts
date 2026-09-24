import { useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import { localTodayIso } from '@simply-life/shared'
import { useDataStore } from '../store/dataStore'
import { useBoardReplanStore } from '../store/boardReplanStore'
import { useOrchestratorPrefsStore } from '../store/orchestratorPrefsStore'

const COMPLETED_DEBOUNCE_MS = 1500

/**
 * Fase 2 - gatilhos do replanejamento automático do quadro:
 *  - primeira abertura do dia (inclui resgatar atrasadas) → 'morning'
 *  - voltar ao app num dia novo → 'morning'
 *  - concluir uma tarefa de hoje/atrasada → 'completed' (adianta o que couber)
 * Roda no aparelho, sem servidor: funciona no Expo Go, APK, web e offline.
 */
export function useBoardAutoReplan(): void
{
  const loading = useDataStore((s) => s.loading)
  const source = useDataStore((s) => s.source)
  const tasks = useDataStore((s) => s.tasks)
  const autoReplan = useOrchestratorPrefsStore((s) => s.autoReplan)
  const hydratePrefs = useOrchestratorPrefsStore((s) => s.hydrate)
  const hydrateReplan = useBoardReplanStore((s) => s.hydrate)
  const run = useBoardReplanStore((s) => s.run)
  const prevStatus = useRef<Map<string, string> | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const ready = !loading && source !== 'idle'

  useEffect(() =>
  {
    void hydratePrefs()
    void hydrateReplan()
  }, [hydratePrefs, hydrateReplan])

  // Rodada do dia: assim que os dados carregam e sempre que o app volta num dia novo
  useEffect(() =>
  {
    if (!ready || !autoReplan) return
    const maybeMorning = async () =>
    {
      await useBoardReplanStore.getState().hydrate()
      if (useBoardReplanStore.getState().lastMorning !== localTodayIso())
      {
        void run('morning')
      }
    }
    void maybeMorning()
    const sub = AppState.addEventListener('change', (state) =>
    {
      if (state === 'active') void maybeMorning()
    })
    return () => sub.remove()
  }, [ready, autoReplan, run])

  // Concluiu algo de hoje (ou atrasado): sobra tempo, o Axel tenta adiantar
  useEffect(() =>
  {
    const list = tasks ?? []
    const current = new Map(list.map((t) => [t.id, t.status]))
    const prev = prevStatus.current
    prevStatus.current = current
    if (!prev || !ready || !autoReplan) return

    const today = localTodayIso()
    const justDone = list.some((t) =>
      t.status === 'done'
      && prev.has(t.id)
      && prev.get(t.id) !== 'done'
      && (!t.dataVencimento || t.dataVencimento <= today))
    if (!justDone) return

    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() =>
    {
      void run('completed')
    }, COMPLETED_DEBOUNCE_MS)
  }, [tasks, ready, autoReplan, run])

  useEffect(() => () =>
  {
    if (timer.current) clearTimeout(timer.current)
  }, [])
}
