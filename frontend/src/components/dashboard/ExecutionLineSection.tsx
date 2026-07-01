import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronDown, ChevronRight, Zap, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import { mergeDashboardTasks } from '../../data/mockDashboardData'
import { ExecutionCommandRow } from './ExecutionCommandRow'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'
import {
  applyUrgencyScores,
  calculateUrgencyScores,
} from '../../lib/urgencyEngine'
import type { TarefaUnificada } from '../../types'

// Contexto Ativo — filas guiadas pelo motor de urgência (estilo Linear)

type Bucket = 'foco_imediato' | 'fila_orquestracao'

interface BucketCfg
{
  id: Bucket
  label: string
  hint: string
  accent: string
  emptyHint: string
}

const BUCKETS: BucketCfg[] = [
  {
    id: 'foco_imediato',
    label: 'Foco Imediato',
    hint: 'Score 90+',
    accent: 'text-red-400/90',
    emptyHint: 'Nenhuma demanda crítica no radar.',
  },
  {
    id: 'fila_orquestracao',
    label: 'Fila de Orquestração',
    hint: 'ordenado pelo motor',
    accent: 'text-zinc-500 dark:text-zinc-400',
    emptyHint: 'Backlog vazio — motor aguardando novas entradas.',
  },
]

function bucketizeExecution(tarefas: TarefaUnificada[]): Record<Bucket, TarefaUnificada[]>
{
  const sorted = [...tarefas]
    .filter((t) => t.status !== 'concluida')
    .sort((a, b) => (b.score_urgencia ?? 0) - (a.score_urgencia ?? 0))

  return {
    foco_imediato: sorted.filter((t) => (t.score_urgencia ?? 0) >= 90),
    fila_orquestracao: sorted.filter((t) => (t.score_urgencia ?? 0) < 90),
  }
}

export function ExecutionLineSection({ prominent = false }: { prominent?: boolean })
{
  const navigate = useNavigate()
  const storeTarefas = useTaskStore((s) => s.tarefas)
  const updateTarefa = useTaskStore((s) => s.updateTarefa)
  const setQuickCaptureOpen = useTaskStore((s) => s.setQuickCaptureOpen)

  const [scoreOverrides, setScoreOverrides] = useState<Record<number, number>>({})
  const [orchestrating, setOrchestrating] = useState(false)
  const [lastOrchestration, setLastOrchestration] = useState<'mock' | 'ai' | null>(null)

  const tarefas = useMemo(() =>
  {
    const merged = mergeDashboardTasks(storeTarefas)
    if (Object.keys(scoreOverrides).length === 0) return merged

    return merged.map((t) =>
    {
      const override = scoreOverrides[t.id]
      if (override === undefined) return t
      return { ...t, score_urgencia: override }
    })
  }, [storeTarefas, scoreOverrides])

  const grouped = useMemo(
    () => bucketizeExecution(tarefas),
    [tarefas],
  )

  const [collapsed, setCollapsed] = useState<Record<Bucket, boolean>>({
    foco_imediato: false,
    fila_orquestracao: false,
  })

  const handleOpen = (t: TarefaUnificada) =>
  {
    navigate(`/kanban?task=${t.id}`)
  }

  const handleOrchestrate = useCallback(async () =>
  {
    setOrchestrating(true)
    try
    {
      const scores = await calculateUrgencyScores(tarefas)
      const rescored = applyUrgencyScores(tarefas, scores)

      const overrides: Record<number, number> = {}
      for (const entry of scores)
      {
        overrides[entry.taskId] = entry.score
        if (entry.taskId > 0)
        {
          await updateTarefa(entry.taskId, { score_urgencia: entry.score })
        }
      }

      setScoreOverrides(overrides)
      setLastOrchestration(scores[0]?.source ?? 'mock')

      const foco = rescored.filter((t) => (t.score_urgencia ?? 0) >= 90).length
      toast.success(`Contexto orquestrado · ${foco} em foco imediato`, {
        description: scores.every((s) => s.source === 'mock')
          ? 'Motor mock (configure VITE_GROQ_API_KEY para IA real)'
          : 'Scores atualizados pela IA',
      })
    }
    catch (err)
    {
      console.error('[ExecutionLineSection] orquestração falhou:', err)
      toast.error('Falha ao orquestrar contexto')
    }
    finally
    {
      setOrchestrating(false)
    }
  }, [tarefas, updateTarefa])

  const total = grouped.foco_imediato.length + grouped.fila_orquestracao.length
  const isEmpty = total === 0

  return (
    <section aria-labelledby="execution-line-title">
      <header className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 id="execution-line-title" className={`text-[13px] font-semibold tracking-tight ${AXEL_TEXT_PRIMARY}`}>
            Contexto ativo
            {!isEmpty && (
              <span className={`ml-1.5 font-normal tabular-nums ${AXEL_TEXT_SECONDARY}`}>{total}</span>
            )}
          </h2>
          <p className={`text-[11px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
            Motor de urgência · filas dinâmicas
            {lastOrchestration && (
              <span className="ml-1 opacity-70">
                · última run: {lastOrchestration === 'ai' ? 'IA' : 'mock'}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 text-[12px]">
          <button
            type="button"
            onClick={handleOrchestrate}
            disabled={orchestrating || isEmpty}
            className={
              prominent
                ? 'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-amber-500/40 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 text-amber-700 dark:text-yellow-300 font-semibold text-[13px] transition-all disabled:opacity-50 hover:border-amber-500/60 hover:from-amber-500/15 hover:to-yellow-500/15 shadow-sm'
                : `inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-900/40 transition-colors disabled:opacity-50 ${AXEL_TEXT_SECONDARY} hover:text-amber-500 hover:border-amber-500/30 dark:hover:text-yellow-400`
            }
            aria-busy={orchestrating}
          >
            {orchestrating ? (
              <Loader2 className={`animate-spin ${prominent ? 'w-4 h-4' : 'w-3.5 h-3.5'}`} />
            ) : (
              <Zap className={prominent ? 'w-4 h-4' : 'w-3.5 h-3.5'} strokeWidth={2} />
            )}
            Orquestrar Contexto
          </button>
          {!prominent && (
            <button
              type="button"
              onClick={() => navigate('/kanban')}
              className={`inline-flex items-center gap-0.5 transition-colors ${AXEL_TEXT_SECONDARY} hover:text-zinc-800 dark:hover:text-zinc-300`}
            >
              Kanban
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setQuickCaptureOpen(true)}
            className={`inline-flex items-center gap-1 transition-colors ${AXEL_TEXT_SECONDARY} hover:text-zinc-800 dark:hover:text-zinc-300`}
          >
            <Plus className="w-3.5 h-3.5" />
            Nova entrada
          </button>
        </div>
      </header>

      {isEmpty ? (
        <p className={`py-4 text-[13px] ${AXEL_TEXT_SECONDARY}`}>
          Nenhuma tarefa ativa.{' '}
          <button
            type="button"
            onClick={() => setQuickCaptureOpen(true)}
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 underline-offset-2 hover:underline"
          >
            Adicionar tarefa
          </button>
        </p>
      ) : (
        <div className="space-y-5">
          {BUCKETS.map((cfg) =>
          {
            const items = grouped[cfg.id]
            if (items.length === 0 && collapsed[cfg.id]) return null

            return (
              <BucketSection
                key={cfg.id}
                cfg={cfg}
                items={items}
                collapsed={collapsed[cfg.id]}
                onToggle={() => setCollapsed((s) => ({ ...s, [cfg.id]: !s[cfg.id] }))}
                onOpen={handleOpen}
                onAdd={() => setQuickCaptureOpen(true)}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}

interface BucketSectionProps
{
  cfg: BucketCfg
  items: TarefaUnificada[]
  collapsed: boolean
  onToggle: () => void
  onOpen: (t: TarefaUnificada) => void
  onAdd: () => void
}

function BucketSection({ cfg, items, collapsed, onToggle, onOpen, onAdd }: BucketSectionProps)
{
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2 py-1.5 group text-left"
      >
        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-150 ${collapsed ? '-rotate-90' : ''}`}
        />
        <h3 className={`text-[12px] font-semibold tracking-tight ${cfg.accent}`}>
          {cfg.label}
        </h3>
        <span className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>({cfg.hint})</span>
        <span className={`text-[11px] font-mono tabular-nums ml-auto ${AXEL_TEXT_SECONDARY}`}>
          {items.length}
        </span>
        <span
          onClick={(e) => { e.stopPropagation(); onAdd() }}
          className="ml-1 p-0.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors opacity-0 group-hover:opacity-100"
          role="button"
          aria-label="Adicionar tarefa"
        >
          <Plus className="w-3 h-3" />
        </span>
      </button>

      {!collapsed && (
        <div role="list" className="min-w-0 w-full pl-1">
          {items.length === 0 && (
            <p className={`py-2 pl-5 text-[12px] ${AXEL_TEXT_SECONDARY}`}>{cfg.emptyHint}</p>
          )}
          {items.map((t) => (
            <ExecutionCommandRow
              key={t.id}
              tarefa={t}
              onOpen={() => onOpen(t)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
