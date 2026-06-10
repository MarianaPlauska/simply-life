import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Pill, Mail, MessageSquare, ListTodo, Wallet } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import type { TarefaUnificada } from '../../types'

// PrimaryActionBlock — bloco "FOCO AGORA" da Camada 1
// Mostra a UNICA proxima acao com score mais alto, gigantesca, com CTA "Resolver agora"

function originIcon(origem: string | null | undefined): typeof Pill
{
  if (origem === 'saude') return Pill
  if (origem === 'financeiro') return Wallet
  if (origem === 'gmail_triage' || origem === 'gmail_api' || origem === 'gmail_mock') return Mail
  if (origem === 'teams') return MessageSquare
  return ListTodo
}

function originLabel(origem: string | null | undefined): string
{
  if (origem === 'saude') return 'Saúde'
  if (origem === 'financeiro') return 'Financeiro'
  if (origem === 'gmail_triage' || origem === 'gmail_api' || origem === 'gmail_mock') return 'E-mail'
  if (origem === 'teams') return 'Teams'
  return 'Tarefa'
}

// calcula "atrasado ha XhYY" para data_vencimento
function timeStatus(t: TarefaUnificada): string
{
  if (!t.data_vencimento) return 'Sem prazo definido'
  const venc = new Date(t.data_vencimento)
  const diff = Date.now() - venc.getTime()
  const absMin = Math.abs(Math.round(diff / 60000))
  const h = Math.floor(absMin / 60)
  const m = absMin % 60

  if (diff > 0)
  {
    if (h === 0) return `Atrasado há ${m}min`
    return `Atrasado há ${h}h${String(m).padStart(2, '0')}`
  }
  if (h === 0) return `Vence em ${m}min`
  return `Vence em ${h}h${String(m).padStart(2, '0')}`
}

export function PrimaryActionBlock()
{
  const tarefas = useTaskStore((s) => s.tarefas)
  const updateTarefa = useTaskStore((s) => s.updateTarefa)
  const navigate = useNavigate()

  // proxima acao = maior score entre tarefas nao concluidas
  const next = useMemo(() =>
  {
    const ativas = tarefas.filter((t) => t.status !== 'concluida')
    if (ativas.length === 0) return null
    return [...ativas].sort((a, b) => (b.score_urgencia ?? 0) - (a.score_urgencia ?? 0))[0]
  }, [tarefas])

  if (!next)
  {
    return (
      <section className="border border-zinc-900 rounded-md px-5 py-6">
        <p className="text-[13px] text-zinc-500">
          Inbox zero. Nenhuma ação crítica agora — respira.
        </p>
      </section>
    )
  }

  const Icon = originIcon(next.origem)
  const status = timeStatus(next)
  const overdue = next.data_vencimento && new Date(next.data_vencimento).getTime() < Date.now()
  const accent = overdue ? 'border-l-red-500' : 'border-l-violet-500'
  const accentRing = overdue ? 'ring-red-500/20' : 'ring-violet-500/20'

  return (
    <section className={`bg-card border border-zinc-900 border-l-2 ${accent} rounded-md`}>
      <header className="px-3 pt-2 flex items-center justify-between">
        <span className="text-[10px] font-bold text-violet-300 uppercase tracking-widest">
          Próxima Ação
        </span>
        <span className="text-[10px] font-mono text-zinc-500">score {next.score_urgencia ?? 0}</span>
      </header>

      <div className="px-3 pt-2 pb-4 flex items-center gap-4">
        {/* icone grande */}
        <div className={`shrink-0 w-14 h-14 rounded-full bg-black ring-1 ${accentRing} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${overdue ? 'text-red-400' : 'text-violet-300'}`} />
        </div>

        {/* titulo gigantesco */}
        <div className="flex-1 min-w-0">
          <h2 className="text-[26px] sm:text-[30px] font-semibold text-white tracking-tight leading-tight truncate">
            {next.titulo}
          </h2>
          <p className={`text-[14px] mt-1 ${overdue ? 'text-red-400' : 'text-amber-400'}`}>
            {status}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-zinc-400 border border-zinc-900">
              {originLabel(next.origem)}
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-zinc-400 border border-zinc-900">
              {next.prioridade}
            </span>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={async () =>
          {
            await updateTarefa(next.id, { status: 'em_progresso' })
            navigate('/kanban')
          }}
          className={`shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded text-[13px] font-medium transition-colors ${
            overdue
              ? 'bg-red-600 text-white hover:bg-red-500'
              : 'bg-violet-600 text-white hover:bg-violet-500'
          }`}
        >
          Resolver agora <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  )
}
