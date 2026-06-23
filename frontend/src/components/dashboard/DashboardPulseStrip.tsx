import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Droplets, Flame, Target } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { mergeDashboardTasks } from '../../data/mockDashboardData'
import { bucketByDueDate } from '../../lib/dueBucket'
import { aguaDisplaySnapshot } from '../../lib/healthRitual'
import { AXEL_ROW_HOVER, AXEL_TEXT_PRIMARY } from '../../constants/axelSurfaces'

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
      className={`text-left border border-line rounded-sl bg-card p-3 sm:p-4 min-h-[88px] sm:min-h-[96px] flex flex-col ${AXEL_ROW_HOVER}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${iconClass}`} strokeWidth={1.75} />
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
          {label}
        </span>
      </div>
      <p className={`text-xl sm:text-2xl font-sans font-semibold tracking-tight tabular-nums leading-none ${valueTone}`}>
        {value}
      </p>
      <p className="text-[11px] mt-2 text-zinc-500 dark:text-zinc-400">{hint}</p>
    </button>
  )
}

export function DashboardPulseStrip()
{
  const navigate = useNavigate()
  const storeTarefas = useTaskStore((s) => s.tarefas)
  const habitos = useTaskStore((s) => s.habitos)
  const streakCount = useTaskStore((s) => s.streakCount)
  const isStreakSafeToday = useTaskStore((s) => s.isStreakSafeToday)

  const stats = useMemo(() =>
  {
    const tarefas = mergeDashboardTasks(storeTarefas).filter((t) => t.status !== 'concluida')
    const buckets = bucketByDueDate(tarefas)
    const agua = habitos.find((h) => h.tipo === 'agua')
    const aguaSnap = agua && agua.meta_diaria > 0
      ? aguaDisplaySnapshot(agua.progresso_atual, agua.meta_diaria)
      : null
    return {
      hoje: buckets.hoje.length,
      atrasadas: buckets.vencido.length,
      aguaPct: aguaSnap?.ritualPct ?? 0,
      aguaLabel: aguaSnap ? `${aguaSnap.copos}/${aguaSnap.ritualCopos}` : '—',
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
        hint={isStreakSafeToday() ? 'Segura hoje' : 'Tarefa ou humor'}
        Icon={Flame}
        iconClass={isStreakSafeToday() ? 'text-orange-500' : 'text-ink-muted'}
        variant={isStreakSafeToday() ? 'ok' : 'default'}
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
