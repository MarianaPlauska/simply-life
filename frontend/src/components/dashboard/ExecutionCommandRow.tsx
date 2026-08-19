import { Database, GitBranch, Mail, Container, Zap } from 'lucide-react'
import type { TarefaUnificada } from '../../types'
import { getExecutionRowMeta } from '../../data/mockDashboardData'
import { urgencyBadgeClass } from '../../lib/urgencyEngine'

// Linha densa estilo Linear — checkbox, contexto, score e tags de projeto

type ContextKind = 'database' | 'git' | 'mail' | 'docker'

interface ExecutionCommandRowProps
{
  tarefa: TarefaUnificada
  onOpen?: () => void
  onToggleComplete?: () => void
}

function resolveContext(origem: string, override?: ContextKind): ContextKind
{
  if (override) return override

  if (origem.includes('github')) return 'git'
  if (origem.includes('gmail') || origem === 'email') return 'mail'
  if (origem.includes('docker')) return 'docker'
  return 'database'
}

function ContextIcon({ kind }: { kind: ContextKind })
{
  const cls = 'w-3.5 h-3.5 text-zinc-500 shrink-0'
  switch (kind)
  {
    case 'git':
      return <GitBranch className={cls} strokeWidth={1.75} />
    case 'mail':
      return <Mail className={cls} strokeWidth={1.75} />
    case 'docker':
      return <Container className={cls} strokeWidth={1.75} />
    default:
      return <Database className={cls} strokeWidth={1.75} />
  }
}

function urgencyScoreClass(score: number): string
{
  return urgencyBadgeClass(score)
}

function projectTag(tarefa: TarefaUnificada): string | null
{
  const fromLabel = tarefa.labels?.[0]?.nome
  if (fromLabel) return fromLabel.toUpperCase()

  const match = tarefa.titulo.match(/\[(FINALLY|SST|HUB|CORE)\]/i)
  return match ? match[1].toUpperCase() : null
}

export function ExecutionCommandRow({ tarefa, onOpen, onToggleComplete }: ExecutionCommandRowProps)
{
  const score = tarefa.score_urgencia ?? 0
  const meta = getExecutionRowMeta(tarefa.id)
  const context = resolveContext(tarefa.origem || 'manual', meta.context)
  const tag = projectTag(tarefa)

  const handleKey = (e: React.KeyboardEvent) =>
  {
    if (e.key === 'Enter' || e.key === ' ')
    {
      e.preventDefault()
      onOpen?.()
    }
  }

  return (
    <article
      role="listitem"
      aria-label={`Tarefa: ${tarefa.titulo}`}
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={handleKey}
      className="group flex items-center gap-3 min-h-[40px] py-2 px-1 -mx-1 rounded-md cursor-pointer transition-colors duration-150 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/30"
    >
      <button
        type="button"
        onClick={(e) =>
        {
          e.stopPropagation()
          onToggleComplete?.()
        }}
        className="w-4 h-4 shrink-0 rounded-full border border-zinc-300 dark:border-zinc-600 hover:border-zinc-500 dark:hover:border-zinc-400 transition-colors"
        aria-label={`Marcar "${tarefa.titulo}" como concluída`}
      />

      <ContextIcon kind={context} />

      <span
        className="min-w-0 flex-1 text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate"
        title={tarefa.titulo}
      >
        {tarefa.titulo}
      </span>

      <span
        className={`inline-flex items-center gap-0.5 text-[12px] font-mono font-medium tabular-nums shrink-0 ${urgencyScoreClass(score)}`}
      >
        <Zap className="w-3 h-3 opacity-80" strokeWidth={2} />
        {score}
      </span>

      {tag && (
        <span className="hidden sm:inline text-[11px] text-zinc-500 border border-zinc-200 dark:border-zinc-800 rounded px-1.5 shrink-0 tracking-wide">
          {tag}
        </span>
      )}

      <div
        className="w-5 h-5 shrink-0 rounded-full flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 border border-zinc-300/60 dark:border-zinc-700/60"
        title="Responsável"
      >
        <span className="text-[9px] font-semibold text-zinc-600 dark:text-zinc-400 select-none">
          {meta.iniciais}
        </span>
      </div>
    </article>
  )
}
