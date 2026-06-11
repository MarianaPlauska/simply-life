import { Zap } from 'lucide-react'
import { toast } from 'sonner'
import { buildFlowSuggestion } from '../../lib/energyOrchestration'
import type { TarefaUnificada } from '../../types'
import type { TemporalHorizon } from '../../lib/temporalHorizon'

interface AxelFlowSuggestionButtonProps
{
  hojeTasks: TarefaUnificada[]
  dailyScoreCap: number
  onMoveTasks: (taskIds: number[], target: TemporalHorizon) => Promise<void>
}

export function AxelFlowSuggestionButton({
  hojeTasks,
  dailyScoreCap,
  onMoveTasks,
}: AxelFlowSuggestionButtonProps)
{
  function handleSuggest()
  {
    const suggestion = buildFlowSuggestion(hojeTasks, dailyScoreCap)

    if (!suggestion)
    {
      toast.info('Fluxo equilibrado', {
        description: 'Sua carga de hoje está saudável. Continue no ritmo atual.',
        className: 'text-sm',
      })
      return
    }

    toast(suggestion.message, {
      duration: 12_000,
      className: 'font-mono text-sm max-w-md',
      action: {
        label: 'Aceitar sugestão',
        onClick: () =>
        {
          void onMoveTasks(suggestion.taskIds, 'semana')
          toast.success('Tarefas movidas para Esta Semana', {
            className: 'text-sm',
          })
        },
      },
      cancel: {
        label: 'Ignorar',
        onClick: () => undefined,
      },
    })
  }

  return (
    <button
      type="button"
      onClick={handleSuggest}
      className="inline-flex items-center gap-1.5 border border-line text-ink-muted hover:text-accent hover:border-accent/40 font-mono text-[11px] uppercase tracking-wide px-3 py-2 rounded-sl transition-colors"
      title="Sugestão de fluxo baseada em carga e horário"
    >
      <Zap size={16} strokeWidth={1.75} aria-hidden />
      Sugestão de Fluxo
    </button>
  )
}
