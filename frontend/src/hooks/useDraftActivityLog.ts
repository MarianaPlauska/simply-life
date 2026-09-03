import { useEffect, useRef } from 'react'
import type { ActivityEventKind } from '../hooks/useTaskActivityLog'
import type { ManualPriority } from '../components/kanban/AxelDrawerOrganizationSection'

const PRIORITY_LABELS: Record<ManualPriority, string> = {
  alta: 'Alta',
  normal: 'Normal',
  quando_der: 'Quando der',
}

interface DraftLogState
{
  title: string
  desc: string
  deadline: string | null
  semPrazo: boolean
  plannedStart: string | null
  manualPriority: ManualPriority
  draftSubsCount: number
}

interface UseDraftActivityLogOptions
{
  enabled: boolean
  state: DraftLogState
  draftRestored: boolean
  onLog: (text: string, kind?: ActivityEventKind) => void
}

function formatDateShort(iso: string | null): string
{
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Registra no log mudanças enquanto a demanda ainda é rascunho */
export function useDraftActivityLog({
  enabled,
  state,
  draftRestored,
  onLog,
}: UseDraftActivityLogOptions): void
{
  const hydratedRef = useRef(false)
  const prevRef = useRef<DraftLogState | null>(null)

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
      if (draftRestored)
      {
        onLog('Rascunho anterior restaurado', 'rascunho')
      }
      return
    }

    const prev = prevRef.current
    if (!prev) return

    if (state.title.trim() && state.title !== prev.title)
    {
      onLog(`Título: «${state.title.trim().slice(0, 80)}»`, 'rascunho')
    }

    if (state.desc.trim() && state.desc !== prev.desc)
    {
      onLog('Descrição atualizada', 'rascunho')
    }

    if (state.semPrazo !== prev.semPrazo)
    {
      onLog(
        state.semPrazo ? 'Marcado: sem prazo definido' : 'Prazo obrigatório reativado',
        'rascunho',
      )
    }
    else if (state.deadline !== prev.deadline && state.deadline && !state.semPrazo)
    {
      onLog(`Prazo definido: ${formatDateShort(state.deadline)}`, 'rascunho')
    }

    if (state.plannedStart !== prev.plannedStart && state.plannedStart)
    {
      onLog(`Início previsto: ${formatDateShort(state.plannedStart)}`, 'rascunho')
    }

    if (state.manualPriority !== prev.manualPriority)
    {
      onLog(`Prioridade manual: ${PRIORITY_LABELS[state.manualPriority]}`, 'rascunho')
    }

    if (state.draftSubsCount > prev.draftSubsCount)
    {
      onLog(`Checklist: ${state.draftSubsCount} item(ns)`, 'rascunho')
    }

    prevRef.current = { ...state }
  }, [enabled, state, draftRestored, onLog])
}
