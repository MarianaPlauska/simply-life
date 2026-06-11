import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Droplets, Flame, Target } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { mergeDashboardTasks } from '../../data/mockDashboardData'
import { bucketByDueDate } from '../../lib/dueBucket'
import { AXEL_ROW_HOVER, AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

// Pulso do dia — 4 KPIs grandes, padrão Z (leitura em 5s)

interface PulseCardProps
{
  label: string
  value: string
  hint: string
  Icon: typeof Target
  iconClass: string
  variant?: 'default' | 'urgent' | 'warn' | 'ok'
  onClick: () => void
}

function PulseCard({
  label, value, hint, Icon, iconClass, variant = 'default', onClick,
}: PulseCardProps)
{
  const valueTone = variant === 'urgent'
    ? 'text-urgente'
    : variant === 'warn'
      ? 'text-atencao'
      : variant === 'ok'
        ? 'text-concluido'
        : AXEL_TEXT_PRIMARY

  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left border border-line rounded-sl bg-card p-4 min-h-[96px] flex flex-col ${AXEL_ROW_HOVER}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${iconClass}`} strokeWidth={1.75} />
        <span className={`font-mono text-[9px] uppercase tracking-[0.14em] ${AXEL_TEXT_SECONDARY}`}>
          {label}
        </span>
      </div>
      <p className={`text-2xl font-display tabular-nums leading-none ${valueTone}`}>
        {value}
      </p>
      <p className={`text-[11px] mt-2 ${AXEL_TEXT_SECONDARY}`}>{hint}</p>
    </button>
  )
}

export function DashboardPulseStrip()
{
  const navigate = useNavigate()
  const storeTarefas = useTaskStore((s) => s.tarefas)
  const habitos = useTaskStore((s) => s.habitos)
  const streakCount = useTaskStore((s) => s.streakCount)
  const hasCompletedTaskToday = useTaskStore((s) => s.hasCompletedTaskToday)

  const stats = useMemo(() =>
  {
    const tarefas = mergeDashboardTasks(storeTarefas).filter((t) => t.status !== 'concluida')
    const buckets = bucketByDueDate(tarefas)
    const agua = habitos.find((h) => h.tipo === 'agua')
    const aguaPct = agua && agua.meta_diaria > 0
      ? Math.round((agua.progresso_atual / agua.meta_diaria) * 100)
      : 0
    return {
      hoje: buckets.hoje.length,
      atrasadas: buckets.vencido.length,
      aguaPct,
      aguaLabel: agua ? `${agua.progresso_atual}/${agua.meta_diaria}` : '—',
    }
  }, [storeTarefas, habitos])

  return (
    <section aria-label="Pulso do dia" className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      <PulseCard
        label="Prazo hoje"
        value={String(stats.hoje)}
        hint="Tarefas que vencem hoje"
        Icon={Target}
        iconClass="text-accent"
        variant={stats.hoje > 0 ? 'warn' : 'default'}
        onClick={() => navigate('/kanban?bucket=hoje')}
      />
      <PulseCard
        label="Atrasadas"
        value={String(stats.atrasadas)}
        hint="Precisam de data ou ação"
        Icon={AlertTriangle}
        iconClass="text-urgente"
        variant={stats.atrasadas > 0 ? 'urgent' : 'default'}
        onClick={() => navigate('/kanban?bucket=vencido')}
      />
      <PulseCard
        label="Ofensiva"
        value={String(streakCount)}
        hint={hasCompletedTaskToday ? 'Segura hoje' : 'Complete 1 tarefa'}
        Icon={Flame}
        iconClass={hasCompletedTaskToday ? 'text-orange-500' : 'text-ink-muted'}
        variant={hasCompletedTaskToday ? 'ok' : 'default'}
        onClick={() => navigate('/kanban?panel=executar')}
      />
      <PulseCard
        label="Hidratação"
        value={`${stats.aguaPct}%`}
        hint={stats.aguaLabel !== '—' ? `${stats.aguaLabel} copos` : 'Ative em Saúde'}
        Icon={Droplets}
        iconClass="text-sky-400"
        variant={stats.aguaPct >= 100 ? 'ok' : 'default'}
        onClick={() =>
        {
          document.getElementById('dashboard-water')?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          })
        }}
      />
    </section>
  )
}
