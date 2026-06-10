import { getProjectTag } from '../../lib/contextRationale'
import { useSubtaskProgress } from '../../lib/subtaskProgress'
import {
  HORIZON_LABELS,
  formatDueMeta,
  resolveTemporalHorizon,
  type TemporalHorizon,
} from '../../lib/temporalHorizon'
import { urgencyScoreClass, urgencyStripeClass } from '../../lib/kanbanVisual'
import { ORION_KANBAN_TABLE } from '../../constants/orionKanbanTheme'
import {
  ORION_PROGRESS,
  ORION_PROGRESS_THICK,
  ORION_ROW_HOVER,
  ORION_TEXT_PRIMARY,
  ORION_TEXT_SECONDARY,
} from '../../constants/orionSurfaces'
import type { TarefaUnificada } from '../../types'

// Tabela alta densidade — estilo Linear/Notion, sem cores por linha

interface OrionKanbanListViewProps
{
  tarefas: TarefaUnificada[]
  horizonOverrides: Record<number, TemporalHorizon>
  onOpen: (t: TarefaUnificada) => void
}

function cleanTitle(titulo: string): string
{
  return titulo.replace(/\[(ORION|FRONTEND|CORE|HUB|API|UX|BACKEND|Urgente)\]\s*/gi, '').trim()
}

function ListProgressCell({ tarefa }: { tarefa: TarefaUnificada })
{
  const { percent, done, total } = useSubtaskProgress(
    tarefa.id,
    tarefa.subtarefas,
  )

  return (
    <div className="flex items-center gap-2 min-w-[88px]">
      <div className={`flex-1 ${ORION_PROGRESS_THICK} h-1`}>
        <div
          className={`h-full rounded-sl ${ORION_PROGRESS}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className={`text-[10px] font-mono tabular-nums w-8 text-right ${ORION_TEXT_SECONDARY}`}>
        {total > 0 ? `${done}/${total}` : '—'}
      </span>
    </div>
  )
}

export function OrionKanbanListView({
  tarefas,
  horizonOverrides,
  onOpen,
}: OrionKanbanListViewProps)
{
  const sorted = [...tarefas].sort(
    (a, b) => (b.score_urgencia ?? 0) - (a.score_urgencia ?? 0),
  )

  return (
    <div className={`flex-1 min-h-0 ${ORION_KANBAN_TABLE}`}>
      <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)]">
        <table className="w-full min-w-[880px] text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-card border-b border-line">
            <tr>
              {['Tarefa', 'Tag', 'Horizonte', 'Score', 'Vencimento', 'Checklist', 'Status'].map(
                (h) => (
                  <th
                    key={h}
                    className={`px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.14em] ${ORION_TEXT_SECONDARY}`}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className={`px-4 py-12 text-center text-sm ${ORION_TEXT_SECONDARY}`}>
                  Nenhuma tarefa no pipeline.
                </td>
              </tr>
            )}
            {sorted.map((t) =>
            {
              const horizon = resolveTemporalHorizon(t, horizonOverrides[t.id])
              const score = t.score_urgencia ?? 0
              const tag = getProjectTag(t)

              return (
                <tr
                  key={t.id}
                  onClick={() => onOpen(t)}
                  className={`border-b border-line cursor-pointer ${ORION_ROW_HOVER} ${urgencyStripeClass(score)}`}
                >
                  <td className={`px-4 py-2 text-sm max-w-[280px] truncate ${ORION_TEXT_PRIMARY}`}>
                    {cleanTitle(t.titulo)}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`font-mono text-[10px] uppercase tracking-wider ${ORION_TEXT_SECONDARY}`}>
                      {tag}
                    </span>
                  </td>
                  <td className={`px-4 py-2 text-xs ${ORION_TEXT_SECONDARY}`}>
                    {HORIZON_LABELS[horizon]}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`text-xs font-mono tabular-nums ${urgencyScoreClass(score)}`}>
                      {score}
                    </span>
                  </td>
                  <td className={`px-4 py-2 text-[11px] font-mono tabular-nums ${ORION_TEXT_SECONDARY}`}>
                    {formatDueMeta(t.data_vencimento) || '—'}
                  </td>
                  <td className="px-4 py-2">
                    <ListProgressCell tarefa={t} />
                  </td>
                  <td className={`px-4 py-2 text-[11px] capitalize ${ORION_TEXT_SECONDARY}`}>
                    {t.status.replace('_', ' ')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
