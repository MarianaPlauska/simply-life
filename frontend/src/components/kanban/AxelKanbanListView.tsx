import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { getProjectTag } from '../../lib/contextRationale'
import {
  AXEL_FILTER_PILL_ACTIVE,
  AXEL_FILTER_PILL_IDLE,
} from '../../constants/axelSurfaces'
import { useSubtaskProgress } from '../../lib/subtaskProgress'
import {
  DUE_BUCKET_LABELS,
  resolveDueBucket,
  type DueBucket,
} from '../../lib/dueBucket'
import { urgencyScoreClass, urgencyStripeClass } from '../../lib/kanbanVisual'
import { DueDateChip } from './DueDateChip'
import { AXEL_KANBAN_TABLE } from '../../constants/axelKanbanTheme'
import {
  AXEL_PROGRESS,
  AXEL_PROGRESS_THICK,
  AXEL_ROW_HOVER,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'
import type { TarefaUnificada } from '../../types'
import type { TemporalHorizon } from '../../lib/temporalHorizon'

// Tabela alta densidade — estilo Linear/Notion, colunas ordenáveis

type SortKey = 'title' | 'project' | 'bucket' | 'score' | 'due' | 'status'
type SortDir = 'asc' | 'desc'
type BucketFilter = 'all' | DueBucket
type StatusFilter = 'ativas' | 'concluidas' | 'todas'

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

const BUCKET_FILTERS: { id: BucketFilter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'vencido', label: 'Atrasadas' },
  { id: 'hoje', label: 'Hoje' },
  { id: 'esta_semana', label: 'Semana' },
  { id: 'sem_prazo', label: 'Sem data' },
]

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'ativas', label: 'Ativas' },
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
      className={`px-2.5 py-1 rounded-sl font-mono text-[10px] uppercase tracking-wide transition-colors ${
        active ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE
      }`}
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
  const [bucketFilter, setBucketFilter] = useState<BucketFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ativas')
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
      if (statusFilter === 'ativas' && t.status === 'concluida') return false
      if (statusFilter === 'concluidas' && t.status !== 'concluida') return false

      if (bucketFilter !== 'all' && resolveDueBucket(t) !== bucketFilter) return false

      if (projectFilter !== 'all' && getProjectTag(t) !== projectFilter) return false

      return true
    })
  }, [tarefas, bucketFilter, statusFilter, projectFilter])

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
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrar por faixa">
          {BUCKET_FILTERS.map((f) => (
            <FilterChip
              key={f.id}
              label={f.label}
              active={bucketFilter === f.id}
              onClick={() => setBucketFilter(f.id)}
            />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrar por status">
          {STATUS_FILTERS.map((f) => (
            <FilterChip
              key={f.id}
              label={f.label}
              active={statusFilter === f.id}
              onClick={() => setStatusFilter(f.id)}
            />
          ))}
          {projectOptions.length > 1 && (
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              aria-label="Filtrar por projeto"
              className="ml-auto font-mono text-[10px] uppercase tracking-wide border border-line rounded-sl bg-card px-2 py-1 text-ink-muted"
            >
              <option value="all">Todos projetos</option>
              {projectOptions.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          )}
        </div>
        <p className={`font-mono text-[10px] ${AXEL_TEXT_SECONDARY}`}>
          {filtered.length} de {tarefas.length} tarefas
        </p>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-340px)] flex-1 min-h-0">
        <table className="w-full min-w-[960px] text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-card border-b border-line">
            <tr>
              <th className="px-4 py-2.5">
                <SortHeader label="Tarefa" sortKey="title" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-4 py-2.5">
                <SortHeader label="Projeto" sortKey="project" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-4 py-2.5">
                <SortHeader label="Faixa" sortKey="bucket" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-4 py-2.5">
                <SortHeader label="Score" sortKey="score" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-4 py-2.5">
                <SortHeader label="Prazo" sortKey="due" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-4 py-2.5">
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
                  <td className={`px-4 py-2 text-[11px] ${AXEL_TEXT_SECONDARY}`}>
                    {DUE_BUCKET_LABELS[bucket]}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`text-xs font-mono tabular-nums ${urgencyScoreClass(score)}`}>
                      {score}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <DueDateChip date={t.data_vencimento} compact />
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
