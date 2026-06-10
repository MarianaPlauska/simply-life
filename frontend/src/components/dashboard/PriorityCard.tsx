import { useNavigate } from 'react-router-dom'
import { ArrowRight, Pill, Mail, MessageSquare, ListTodo, Wallet, Users } from 'lucide-react'
import type { TarefaUnificada } from '../../types'
import { useTaskStore } from '../../store/useTaskStore'

// PriorityCard — card grande de proxima acao
// variantes: "primary" (PRIORIDADE MAXIMA, com gradient red/pink) e "next" (PROXIMA PRIORIDADE, neutro)

type Variant = 'primary' | 'next'

interface PriorityCardProps
{
  tarefa: TarefaUnificada
  variant: Variant
  label: string  // ex "PRIORIDADE MAXIMA"
}

function originIcon(origem: string | null | undefined): typeof Pill
{
  if (origem === 'saude') return Pill
  if (origem === 'financeiro') return Wallet
  if (origem === 'gmail_triage' || origem === 'gmail_api' || origem === 'gmail_mock') return Mail
  if (origem === 'teams') return MessageSquare
  if (origem === 'manual') return Users
  return ListTodo
}

function originChip(origem: string | null | undefined): string
{
  if (origem === 'saude') return 'Saúde'
  if (origem === 'financeiro') return 'Financeiro'
  if (origem === 'gmail_triage' || origem === 'gmail_api' || origem === 'gmail_mock') return 'E-mail'
  if (origem === 'teams') return 'Teams'
  return 'Trabalho'
}

// calcula "Atrasado ha XhYY" ou "Prazo hoje as HH:MM"
function timeStatus(t: TarefaUnificada): { text: string; overdue: boolean }
{
  if (!t.data_vencimento) return { text: 'Sem prazo definido', overdue: false }
  const venc = new Date(t.data_vencimento)
  const diff = Date.now() - venc.getTime()
  const overdue = diff > 0
  const absMin = Math.abs(Math.round(diff / 60000))
  const h = Math.floor(absMin / 60)
  const m = absMin % 60

  if (overdue)
  {
    if (h === 0) return { text: `Atrasado há ${m}min`, overdue }
    return { text: `Atrasado há ${h}h${String(m).padStart(2, '0')}`, overdue }
  }

  const hh = String(venc.getHours()).padStart(2, '0')
  const mm = String(venc.getMinutes()).padStart(2, '0')
  return { text: `Prazo hoje às ${hh}:${mm}`, overdue }
}

export function PriorityCard({ tarefa, variant, label }: PriorityCardProps)
{
  const navigate = useNavigate()
  const updateTarefa = useTaskStore((s) => s.updateTarefa)

  const Icon = originIcon(tarefa.origem)
  const status = timeStatus(tarefa)
  const isPrimary = variant === 'primary'

  // tokens visuais por variante (Allman)
  const tokens = isPrimary
    ? {
        labelText: 'text-rose-400',
        cardBorder: 'border-rose-500/30',
        cardGlow:   'shadow-[0_0_60px_rgba(244,63,94,0.08)]',
        iconRing:   'ring-rose-500/30',
        iconBg:     'bg-gradient-to-br from-rose-500/20 to-rose-900/5',
        iconColor:  'text-rose-300',
        statusText: 'text-rose-400',
        btn:        'bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)]',
        btnLabel:   'Resolver agora',
      }
    : {
        labelText: 'text-zinc-500',
        cardBorder: 'border-zinc-800',
        cardGlow:   '',
        iconRing:   'ring-amber-500/20',
        iconBg:     'bg-gradient-to-br from-amber-500/10 to-amber-900/0',
        iconColor:  'text-amber-300',
        statusText: 'text-amber-300',
        btn:        'bg-card border border-zinc-800 hover:border-violet-500/40 hover:text-white text-zinc-300',
        btnLabel:   'Iniciar tarefa',
      }

  const handleClick = async () =>
  {
    await updateTarefa(tarefa.id, { status: 'em_progresso' })
    navigate('/kanban')
  }

  return (
    <section className="space-y-2">
      <div className={`text-[10px] font-bold uppercase tracking-[0.2em] ${tokens.labelText}`}>
        {label}
      </div>

      <article
        className={`relative bg-card border ${tokens.cardBorder} ${tokens.cardGlow} rounded-xl px-6 py-5 flex items-center gap-5`}
      >
        {/* icone redondo grande */}
        <div className={`shrink-0 w-20 h-20 rounded-full ${tokens.iconBg} ring-1 ${tokens.iconRing} flex items-center justify-center`}>
          <Icon className={`w-9 h-9 ${tokens.iconColor}`} strokeWidth={1.5} />
        </div>

        {/* texto principal */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-white tracking-tight leading-tight ${isPrimary ? 'text-[26px] sm:text-[28px]' : 'text-[20px] sm:text-[22px]'}`}>
            {tarefa.titulo}
          </h3>
          <p className={`text-[13px] mt-1 ${tokens.statusText}`}>
            {status.text}
          </p>
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium text-zinc-300 bg-zinc-900/80 border border-zinc-800">
              {originChip(tarefa.origem)}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium text-zinc-300 bg-zinc-900/80 border border-zinc-800">
              Score {tarefa.score_urgencia ?? 0}
            </span>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleClick}
          className={`shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all ${tokens.btn}`}
        >
          {tokens.btnLabel} <ArrowRight className="w-4 h-4" />
        </button>
      </article>
    </section>
  )
}
