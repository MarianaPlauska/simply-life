import { getProjectTag } from '../../lib/contextRationale'
import { useSubtaskProgress } from '../../lib/subtaskProgress'
import {
  HORIZON_LABELS,
  formatDueMeta,
  resolveTemporalHorizon,
  type TemporalHorizon,
} from '../../lib/temporalHorizon'
import { urgencyScoreClass, urgencyStripeClass } from '../../lib/kanbanVisual'
import { AXEL_KANBAN_TABLE } from '../../constants/axelKanbanTheme'
import {
  AXEL_PROGRESS,
  AXEL_PROGRESS_THICK,
  AXEL_ROW_HOVER,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'
import type { TarefaUnificada } from '../../types'

// Tabela alta densidade — estilo Linear/Notion, sem cores por linha

interface AxelKanbanListViewProps
{
  tarefas: TarefaUnificada[]
  horizonOverrides: Record<number, TemporalHorizon>
  onOpen: (t: TarefaUnificada) => void
}

function cleanTitle(titulo: string): string
{
  return titulo.replace(/\[(AXEL|FRONTEND|CORE|HUB|API|UX|BACKEND|Urgente)\]\s*/gi, '').trim()
}

function ListProgressCell({ tarefa }: { tarefa: TarefaUnificada })
{
  const { percent, done, total } = useSubtaskProgress(
    tarefa.id,
    tarefa.subtarefas,
  )

  return (
    <div className="flex items-center gap-2 min-w-[88px]">
      <div className={`flex-1 ${AXEL_PROGRESS_THICK} h-1`}>
        <div
          className={`h-full rounded-sl ${AXEL_PROGRESS}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className={`text-[10px] font-mono tabular-nums w-8 text-right ${AXEL_TEXT_SECONDARY}`}>
        {total > 0 ? `${done}/${total}` : '—'}
      </span>
    </div>
  )
}

export function AxelKanbanListView({
  tarefas,
  horizonOverrides,
  onOpen,
}: AxelKanbanListViewProps)
{
  const sorted = [...tarefas].sort(
    (a, b) => (b.score_urgencia ?? 0) - (a.score_urgencia ?? 0),
  )

  return (
    <div className={`flex-1 min-h-0 ${AXEL_KANBAN_TABLE}`}>
      <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)]">
        <table className="w-full min-w-[880px] text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-card border-b border-line">
            <tr>
              {['Tarefa', 'Tag', 'Horizonte', 'Score', 'Vencimento', 'Checklist', 'Status'].map(
                (h) => (
                  <th
                    key={h}
                    className={`px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.14em] ${AXEL_TEXT_SECONDARY}`}
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
                <td colSpan={7} className={`px-4 py-12 text-center text-sm ${AXEL_TEXT_SECONDARY}`}>
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
                  className={`border-b border-line cursor-pointer ${AXEL_ROW_HOVER} ${urgencyStripeClass(score)}`}
                >
                  <td className={`px-4 py-2 text-sm max-w-[280px] truncate ${AXEL_TEXT_PRIMARY}`}>
                    {cleanTitle(t.titulo)}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`font-mono text-[10px] uppercase tracking-wider ${AXEL_TEXT_SECONDARY}`}>
                      {tag}
                    </span>
                  </td>
                  <td className={`px-4 py-2 text-xs ${AXEL_TEXT_SECONDARY}`}>
                    {HORIZON_LABELS[horizon]}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`text-xs font-mono tabular-nums ${urgencyScoreClass(score)}`}>
                      {score}
                    </span>
                  </td>
                  <td className={`px-4 py-2 text-[11px] font-mono tabular-nums ${AXEL_TEXT_SECONDARY}`}>
                    {formatDueMeta(t.data_vencimento) || '—'}
                  </td>
                  <td className="px-4 py-2">
                    <ListProgressCell tarefa={t} />
                  </td>
                  <td className={`px-4 py-2 text-[11px] capitalize ${AXEL_TEXT_SECONDARY}`}>
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
