import { useNavigate } from 'react-router-dom'
import { Droplets, HeartPulse, ListTodo, Wallet } from 'lucide-react'
import { useCapture } from '../capture/CaptureProvider'
import type { DashboardGlanceChip } from '../../lib/dashboardMobilePriority'
import { MODULE_METRIC, MODULE_WASH } from '../../constants/axelSurfaces'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

interface DashboardGlanceStripProps
{
  chips: DashboardGlanceChip[]
  saldoDisponivel: number
  aguaLabel: string | null
  careDone: number
  careTotal: number
  dueTotal: number
  overdueCount: number
}

export function DashboardGlanceStrip({
  chips,
  saldoDisponivel,
  aguaLabel,
  careDone,
  careTotal,
  dueTotal,
  overdueCount,
}: DashboardGlanceStripProps)
{
  const navigate = useNavigate()
  const { openFinance, addWater } = useCapture()

  if (chips.length === 0)
  {
    return null
  }

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-0.5 snap-x -mx-1 px-1 scrollbar-none"
      role="group"
      aria-label="Resumo rápido"
    >
      {chips.includes('finance') && (
        <GlanceChip
          tone="finance"
          icon={Wallet}
          label="Finanças"
          value={fmt(saldoDisponivel)}
          sub="Disponível"
          onClick={() => navigate('/financeiro')}
        />
      )}
      {chips.includes('water') && aguaLabel && (
        <GlanceChip
          tone="health"
          icon={Droplets}
          label="Água"
          value={aguaLabel}
          sub="Hoje"
          onClick={() => void addWater()}
        />
      )}
      {chips.includes('care') && (
        <GlanceChip
          tone="health"
          icon={HeartPulse}
          label="Cuidado"
          value={`${careDone}/${careTotal}`}
          sub="Hoje"
          onClick={() => navigate('/saude')}
        />
      )}
      {chips.includes('due') && (
        <GlanceChip
          tone="tasks"
          icon={ListTodo}
          label="Prazos"
          value={String(overdueCount > 0 ? overdueCount : dueTotal)}
          sub={overdueCount > 0 ? 'Vencido' : 'Em aberto'}
          onClick={() => navigate(overdueCount > 0 ? '/kanban?bucket=vencido' : '/kanban')}
        />
      )}
      <button
        type="button"
        className="shrink-0 snap-start min-w-[5.5rem] rounded-sl border border-dashed border-line/80 px-2.5 py-2 text-left min-h-[72px] hover:bg-chrome/40 transition-colors"
        onClick={() => openFinance()}
        aria-label="Lançar gasto"
      >
        <span className="text-[11px] font-medium text-ink-muted">+ Lançar</span>
      </button>
    </div>
  )
}

interface GlanceChipProps
{
  tone: 'finance' | 'health' | 'tasks'
  icon: typeof Wallet
  label: string
  value: string
  sub: string
  onClick: () => void
}

function GlanceChip({ tone, icon: Icon, label, value, sub, onClick }: GlanceChipProps)
{
  const toneText = tone === 'finance' ? 'text-finance' : tone === 'health' ? 'text-health' : 'text-tasks'
  const wash = MODULE_WASH[tone]

  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 snap-start min-w-[7.25rem] max-w-[9rem] rounded-sl border border-line/80 px-2.5 py-2 text-left min-h-[72px] hover:bg-chrome/40 active:scale-[0.98] transition-all"
    >
      <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-ink-muted">
        <Icon className={`w-3 h-3 ${toneText}`} strokeWidth={1.75} aria-hidden />
        {label}
      </span>
      <span className={`block mt-1.5 ${wash} px-1.5 py-0.5 -mx-0.5`}>
        <span className={`${MODULE_METRIC[tone]} block truncate`}>
          {value}
        </span>
      </span>
      <span className="block mt-1 text-[11px] text-ink-muted truncate">
        {sub}
      </span>
    </button>
  )
}
