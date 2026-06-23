import { useEffect, useRef } from 'react'
import type { ActivityEventKind } from './useTaskActivityLog'
import type { ManualPriority } from '../components/kanban/AxelDrawerOrganizationSection'

const PRIORITY_LABELS: Record<ManualPriority, string> = {
  alta: 'Alta',
  normal: 'Normal',
  quando_der: 'Quando der',
}

interface PersistedLogState
{
  deadline: string | null
  semPrazo: boolean
  plannedStart: string | null
  manualPriority: ManualPriority
}

interface UsePersistedTaskActivityLogOptions
{
  enabled: boolean
  state: PersistedLogState
  onLog: (text: string, kind?: ActivityEventKind) => void
}

function formatDateShort(iso: string | null): string
{
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Registra no log alterações em demandas já salvas (drawer) */
export function usePersistedTaskActivityLog({
  enabled,
  state,
  onLog,
}: UsePersistedTaskActivityLogOptions): void
{
  const hydratedRef = useRef(false)
  const prevRef = useRef<PersistedLogState | null>(null)

  useEffect(() =>
  {
    if (!enabled)
    {
      hydratedRef.current = false
      prevRef.current = null
      return
    }

    if (!hydratedRef.current)
    {
      hydratedRef.current = true
      prevRef.current = { ...state }
      return
    }

    const prev = prevRef.current
    if (!prev) return

    if (state.semPrazo !== prev.semPrazo)
    {
      onLog(
        state.semPrazo ? 'Prazo removido — sem data definida' : 'Prazo reativado',
        'progress',
      )
    }
    else if (state.deadline !== prev.deadline)
    {
      if (!state.deadline && !state.semPrazo)
      {
        onLog('Prazo limpo', 'progress')
      }
      else if (state.deadline && !state.semPrazo)
      {
        onLog(`Prazo alterado: ${formatDateShort(state.deadline)}`, 'progress')
      }
    }

    if (state.plannedStart !== prev.plannedStart)
    {
      if (!state.plannedStart)
      {
        onLog('Início previsto removido', 'progress')
      }
      else
      {
        onLog(`Início previsto: ${formatDateShort(state.plannedStart)}`, 'progress')
      }
    }

    if (state.manualPriority !== prev.manualPriority)
    {
      onLog(`Prioridade: ${PRIORITY_LABELS[state.manualPriority]}`, 'progress')
    }

    prevRef.current = { ...state }
  }, [enabled, state, onLog])
}
