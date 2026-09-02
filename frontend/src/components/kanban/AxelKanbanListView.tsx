import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, CheckCircle2 } from 'lucide-react'
import { axelCompleteTask } from '../../lib/axelTaskCompletion'
import { getProjectTag } from '../../lib/contextRationale'
import {
  AXEL_CARD_META,
  AXEL_PROGRESS,
  AXEL_PROGRESS_THICK,
  AXEL_ROW_HOVER,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
  AXEL_VIEW_SWITCHER_SHELL,
  AXEL_VIEW_TAB_ACTIVE,
  AXEL_VIEW_TAB_IDLE,
} from '../../constants/axelSurfaces'
import { useSubtaskProgress } from '../../lib/subtaskProgress'
import { formatDaysRemaining } from '../../lib/daysRemaining'
import {
  DUE_BUCKET_LABELS,
  resolveDueBucket,
  type DueBucket,
} from '../../lib/dueBucket'
import { urgencyScoreClass } from '../../lib/kanbanVisual'
import {
  kanbanOriginTone,
  KANBAN_ORIGIN_BAR,
  kanbanDueTextClass,
} from '../../lib/kanbanCardGrammar'
import { KanbanOriginMark } from './KanbanOriginMark'
import { DueDateChip } from './DueDateChip'
import { AXEL_KANBAN_TABLE } from '../../constants/axelKanbanTheme'
import type { TarefaUnificada } from '../../types'
import type { TemporalHorizon } from '../../lib/temporalHorizon'

// Tabela alta densidade — estilo Linear/Notion, colunas ordenáveis

type SortKey = 'title' | 'project' | 'bucket' | 'score' | 'due' | 'status'
type SortDir = 'asc' | 'desc'
type ListFilter = 'ativas' | 'concluidas' | 'urgente' | 'semana' | 'todas'

interface AxelKanbanListViewProps
{
  tarefas: TarefaUnificada[]
  horizonOverrides: Record<number, TemporalHorizon>
  onOpen: (t: TarefaUnificada) => void
}

const BUCKET_SORT: Record<DueBucket, number> = {
  vencido: 0,
  hoje: 1,
  esta_semana: 2,
  proxima_semana: 3,
  sem_prazo: 4,
  concluido: 5,
}

const STATUS_SORT: Record<string, number> = {
  em_execucao: 0,
  pendente: 1,
  bloqueada: 2,
  concluida: 3,
}

function cleanTitle(titulo: string): string
{
  return titulo.replace(/\[(AXEL|FRONTEND|CORE|HUB|API|UX|BACKEND|Urgente)\]\s*/gi, '').trim()
}

const BUCKET_SHORT: Record<DueBucket, string> = {
  vencido: 'Atrasada',
  hoje: 'Hoje',
  esta_semana: 'Esta semana',
  proxima_semana: 'Próx. semanas',
  sem_prazo: 'Sem prazo',
  concluido: 'Concluída',
}

function priorityHumanLabel(score: number): string
{
  if (score >= 90) return 'Crítica'
  if (score >= 75) return 'Alta'
  if (score >= 50) return 'Média'
  if (score > 0) return 'Baixa'
  return 'Normal'
}

function ListMobileCard({
  tarefa,
  onOpen,
}: {
  tarefa: TarefaUnificada
  onOpen: (t: TarefaUnificada) => void
})
{
  const score = tarefa.score_urgencia ?? 0
  const bucket = resolveDueBucket(tarefa)
  const tag = getProjectTag(tarefa)
  const { done, total } = useSubtaskProgress(tarefa.id, tarefa.subtarefas)
  const dueMeta = formatDaysRemaining(tarefa.data_vencimento)
  const prazoLabel = tarefa.data_vencimento ? dueMeta.label : BUCKET_SHORT[bucket]

  return (
    <article
      className={`rounded-lg border border-line bg-card shadow-sl p-2.5 pl-3 space-y-1.5 ${KANBAN_ORIGIN_BAR[kanbanOriginTone(tarefa.origem)]}`}
    >
      <button
        type="button"
        onClick={() => onOpen(tarefa)}
        className="w-full text-left min-w-0"
      >
        <p className="text-sm font-sans font-medium text-zinc-800 dark:text-ink truncate">
          {cleanTitle(tarefa.titulo)}
        </p>

        <div className={AXEL_CARD_META}>
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="text-zinc-500">Prazo</span>
            <span className={`font-medium tabular-nums ${kanbanDueTextClass(tarefa.data_vencimento)}`}>{prazoLabel}</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="text-zinc-500">Prioridade</span>
            <span className={`font-medium ${urgencyScoreClass(score)}`}>
              {priorityHumanLabel(score)}
              {score > 0 && (
                <span className="text-zinc-400 dark:text-zinc-500 font-normal ml-1">
                  ({score})
                </span>
              )}
            </span>
          </div>
          {total > 0 && (
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="text-zinc-500">Subtarefas</span>
              <span className="text-zinc-800 dark:text-ink font-medium tabular-nums">
                {done} de {total} feitas
              </span>
            </div>
          )}
        </div>

        <div className="mt-1.5 flex items-center gap-2 min-w-0">
          <KanbanOriginMark origem={tarefa.origem} />
          <span className="text-[11px] text-zinc-500 capitalize truncate">
            {tag} · {tarefa.status.replace('_', ' ')}
          </span>
        </div>
      </button>
      {tarefa.status !== 'concluida' && tarefa.id !== 0 && (
        <button
          type="button"
          onClick={() => void axelCompleteTask(tarefa)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-sl border border-line text-[11px] font-mono uppercase tracking-wide text-ink-muted hover:text-concluido hover:border-concluido/40 transition-colors"
        >
          <CheckCircle2 size={14} strokeWidth={1.75} />
          Concluir
        </button>
      )}
    </article>
  )
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

function SortHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
}: {
  label: string
  sortKey: SortKey
  activeKey: SortKey
  dir: SortDir
  onSort: (key: SortKey) => void
})
{
  const active = activeKey === sortKey
  const Icon = active ? (dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors ${
        active ? 'text-accent' : AXEL_TEXT_SECONDARY
      }`}
    >
      {label}
      <Icon className="w-3 h-3 opacity-70" strokeWidth={1.75} />
    </button>
  )
}

const LIST_FILTERS: { id: ListFilter; label: string }[] = [
  { id: 'ativas', label: 'Ativas' },
  { id: 'urgente', label: 'Urgentes' },
  { id: 'semana', label: 'Semana' },
  { id: 'concluidas', label: 'Concluídas' },
  { id: 'todas', label: 'Todas' },
]

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
})
{
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? AXEL_VIEW_TAB_ACTIVE : AXEL_VIEW_TAB_IDLE}
    >
      {label}
    </button>
  )
}

export function AxelKanbanListView({
  tarefas,
  horizonOverrides: _horizonOverrides,
  onOpen,
}: AxelKanbanListViewProps)
{
  const [sortKey, setSortKey] = useState<SortKey>('score')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [listFilter, setListFilter] = useState<ListFilter>('ativas')
  const [projectFilter, setProjectFilter] = useState<string>('all')

  const projectOptions = useMemo(() =>
  {
    const tags = new Set<string>()
    for (const t of tarefas)
    {
      tags.add(getProjectTag(t))
    }
    return Array.from(tags).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [tarefas])

  const filtered = useMemo(() =>
  {
    return tarefas.filter((t) =>
    {
      const bucket = resolveDueBucket(t)

      if (listFilter === 'ativas' && t.status === 'concluida') return false
      if (listFilter === 'concluidas' && t.status !== 'concluida') return false
      if (listFilter === 'urgente' && bucket !== 'vencido' && bucket !== 'hoje') return false
      if (listFilter === 'semana' && bucket !== 'esta_semana' && bucket !== 'proxima_semana') return false

      if (projectFilter !== 'all' && getProjectTag(t) !== projectFilter) return false

      return true
    })
  }, [tarefas, listFilter, projectFilter])

  const handleSort = (key: SortKey) =>
  {
    if (key === sortKey)
    {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDir(key === 'title' || key === 'project' ? 'asc' : 'desc')
  }

  const sorted = useMemo(() =>
  {
    const rows = [...filtered]
    const dirMul = sortDir === 'asc' ? 1 : -1

    rows.sort((a, b) =>
    {
      switch (sortKey)
      {
        case 'title':
          return cleanTitle(a.titulo).localeCompare(cleanTitle(b.titulo), 'pt-BR') * dirMul
        case 'project':
          return getProjectTag(a).localeCompare(getProjectTag(b), 'pt-BR') * dirMul
        case 'bucket':
          return (BUCKET_SORT[resolveDueBucket(a)] - BUCKET_SORT[resolveDueBucket(b)]) * dirMul
        case 'score':
          return ((a.score_urgencia ?? 0) - (b.score_urgencia ?? 0)) * dirMul
        case 'due':
        {
          const ad = a.data_vencimento ? new Date(a.data_vencimento).getTime() : Number.MAX_SAFE_INTEGER
          const bd = b.data_vencimento ? new Date(b.data_vencimento).getTime() : Number.MAX_SAFE_INTEGER
          return (ad - bd) * dirMul
        }
        case 'status':
          return ((STATUS_SORT[a.status] ?? 9) - (STATUS_SORT[b.status] ?? 9)) * dirMul
        default:
          return 0
      }
    })

    return rows
  }, [filtered, sortKey, sortDir])

  return (
    <div className={`flex-1 min-h-0 flex flex-col gap-2 ${AXEL_KANBAN_TABLE}`}>
      <div className="shrink-0 flex flex-col gap-2 px-1">
        <div className={`${AXEL_VIEW_SWITCHER_SHELL} w-full sm:w-auto overflow-x-auto scrollbar-none`} role="group" aria-label="Filtrar lista">
          {LIST_FILTERS.map((f) => (
            <FilterChip
              key={f.id}
              label={f.label}
              active={listFilter === f.id}
              onClick={() => setListFilter(f.id)}
            />
          ))}
        </div>
        <div className="flex items-center justify-between gap-2">
          {projectOptions.length > 1 && (
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              aria-label="Filtrar por pasta ou projeto"
              className="font-mono text-[10px] border border-white/[0.05] rounded-md bg-chrome px-2 py-1.5 text-zinc-500 max-w-[10rem] truncate"
            >
              <option value="all">Todas pastas</option>
              {projectOptions.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          )}
          <p className="font-mono text-[10px] text-zinc-500 ml-auto tabular-nums">
            {filtered.length} de {tarefas.length}
          </p>
        </div>
      </div>

      <div className="md:hidden overflow-y-auto max-h-[calc(100dvh-16rem)] flex-1 min-h-0 space-y-2 px-0.5">
        {sorted.length === 0 ? (
          <p className={`py-12 text-center text-sm ${AXEL_TEXT_SECONDARY}`}>
            Nenhuma tarefa no pipeline.
          </p>
        ) : (
          sorted.map((t) => (
            <ListMobileCard key={t.id} tarefa={t} onOpen={onOpen} />
          ))
        )}
      </div>

      <div className="hidden md:block overflow-y-auto max-h-[calc(100vh-340px)] flex-1 min-h-0">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-card border-b border-line">
            <tr>
              <th className="px-4 py-2.5">
                <SortHeader label="Tarefa" sortKey="title" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="hidden md:table-cell px-4 py-2.5">
                <SortHeader label="Projeto" sortKey="project" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-4 py-2.5">
                <SortHeader label="Faixa" sortKey="bucket" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="hidden lg:table-cell px-4 py-2.5">
                <SortHeader label="Prioridade" sortKey="score" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-4 py-2.5">
                <SortHeader label="Prazo" sortKey="due" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="hidden lg:table-cell px-4 py-2.5">
                <span className={`font-mono text-[9px] uppercase tracking-[0.14em] ${AXEL_TEXT_SECONDARY}`}>
                  Checklist
                </span>
              </th>
              <th className="px-4 py-2.5">
                <SortHeader label="Status" sortKey="status" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
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
              const score = t.score_urgencia ?? 0
              const tag = getProjectTag(t)
              const bucket = resolveDueBucket(t)

              return (
                <tr
                  key={t.id}
                  onClick={() => onOpen(t)}
                  className={`border-b border-line cursor-pointer ${AXEL_ROW_HOVER} ${KANBAN_ORIGIN_BAR[kanbanOriginTone(t.origem)]}`}
                >
                  <td className={`px-4 py-2 text-sm max-w-[280px] truncate ${AXEL_TEXT_PRIMARY}`}>
                    {cleanTitle(t.titulo)}
                  </td>
                  <td className="hidden md:table-cell px-4 py-2">
                    <span className={`font-mono text-[10px] uppercase tracking-wider ${AXEL_TEXT_SECONDARY}`}>
                      {tag}
                    </span>
                  </td>
                  <td className={`px-4 py-2 text-[11px] ${AXEL_TEXT_SECONDARY}`}>
                    {DUE_BUCKET_LABELS[bucket]}
                  </td>
                  <td className="hidden lg:table-cell px-4 py-2">
                    <span
                      className={`text-xs font-mono tabular-nums ${urgencyScoreClass(score)}`}
                      title="Prioridade AXEL — maior = mais urgente na fila"
                    >
                      {score}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <DueDateChip date={t.data_vencimento} compact />
                  </td>
                  <td className="hidden lg:table-cell px-4 py-2">
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
