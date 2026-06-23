import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTaskStore } from '../../store/useTaskStore'
import { mergeDashboardTasks } from '../../data/mockDashboardData'
import { bucketByDueDate } from '../../lib/dueBucket'
import { aguaDisplaySnapshot } from '../../lib/healthRitual'
import { countAlertasHeader } from '../../lib/notificacaoUtils'
import {
  AXEL_CHROME_PLANE,
  AXEL_ROW_HOVER,
  AXEL_TEXT_PRIMARY,
} from '../../constants/axelSurfaces'

// Barra de comando — KPIs densos + pulso do dia em uma faixa

const fmtBRL = (v: number | null | undefined) =>
  (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

interface KpiCellProps
{
  label: string
  value: string
  hint?: string
  variant?: 'default' | 'urgent' | 'warn' | 'ok'
  onClick?: () => void
}

function KpiCell({ label, value, hint, variant = 'default', onClick }: KpiCellProps)
{
  const valueClass = variant === 'urgent'
    ? 'text-urgente'
    : variant === 'warn'
      ? 'text-atencao'
      : variant === 'ok'
        ? 'text-concluido'
        : AXEL_TEXT_PRIMARY

  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`p-3 sm:px-4 sm:py-3 border-r border-line last:border-r-0 min-w-0 text-left ${
        onClick ? `${AXEL_ROW_HOVER} w-full` : ''
      }`}
    >
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className={`text-base sm:text-lg font-sans font-semibold tracking-tight tabular-nums mt-1 leading-none ${valueClass}`}>
        {value}
      </p>
      {hint && (
        <p className="font-mono text-[10px] mt-1 truncate text-zinc-500 dark:text-zinc-400">{hint}</p>
      )}
    </Tag>
  )
}

interface DashboardCommandBarProps
{
  greeting: string
  firstName: string
}

export function DashboardCommandBar({ greeting, firstName }: DashboardCommandBarProps)
{
  const navigate = useNavigate()
  const notificacoes = useTaskStore((s) => s.notificacoes)
  const resumo = useTaskStore((s) => s.dashboardResumo)
  const storeTarefas = useTaskStore((s) => s.tarefas)
  const habitos = useTaskStore((s) => s.habitos)
  const streakCount = useTaskStore((s) => s.streakCount)
  const isStreakSafeToday = useTaskStore((s) => s.isStreakSafeToday)
  const fetchHabitos = useTaskStore((s) => s.fetchHabitos)

  useEffect(() =>
  {
    void fetchHabitos()
  }, [fetchHabitos])

  const tarefas = useMemo(() => mergeDashboardTasks(storeTarefas), [storeTarefas])
  const dueBuckets = useMemo(
    () => bucketByDueDate(tarefas.filter((t) => t.status !== 'concluida')),
    [tarefas],
  )

  const agua = habitos.find((h) => h.tipo === 'agua')
  const aguaCopos = agua?.progresso_atual ?? 0
  const aguaMeta = agua?.meta_diaria ?? 8
  const aguaSnap = aguaDisplaySnapshot(aguaCopos, aguaMeta)

  const pendentes = resumo?.tarefas_pendentes
    ?? tarefas.filter((t) => t.status !== 'concluida').length
  const criticas = resumo?.tarefas_criticas
    ?? tarefas.filter((t) => t.status !== 'concluida' && (t.score_urgencia ?? 0) >= 90).length
  const concluidas = resumo?.tarefas_concluidas
    ?? tarefas.filter((t) => t.status === 'concluida').length
  const saldo = resumo?.saldo_mes ?? 0
  const alertasTotal = countAlertasHeader(notificacoes, tarefas)
  const atrasadas = dueBuckets.vencido.length

  const now = new Date()
  const dateLine = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className={`border-b border-line ${AXEL_CHROME_PLANE}`}>
      <div className="px-3 sm:px-4 lg:px-8 py-3 sm:py-4 max-w-[1600px] mx-auto w-full">
        <div className="mb-3 sm:mb-4">
          <p className="sl-eyebrow">Centro de comando</p>
          <h1 className="font-sans font-semibold tracking-tight text-xl md:text-3xl text-zinc-900 dark:text-zinc-100 mt-1">
            {greeting}, {firstName}
          </h1>
          <p className="text-xs sm:text-sm capitalize mt-1 text-zinc-500 dark:text-zinc-400">
            {dateLine}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 border border-line rounded-sl bg-card overflow-hidden">
          <KpiCell
            label="Execução"
            value={String(pendentes)}
            hint={atrasadas > 0 ? `${atrasadas} atrasada${atrasadas !== 1 ? 's' : ''}` : `${criticas} crítica${criticas !== 1 ? 's' : ''}`}
            variant={atrasadas > 0 || criticas > 0 ? 'urgent' : 'default'}
            onClick={() => navigate(atrasadas > 0 ? '/kanban?bucket=vencido' : '/kanban')}
          />
          <KpiCell
            label="Ofensiva"
            value={String(streakCount)}
            hint={isStreakSafeToday() ? 'Segura hoje' : 'Tarefa ou humor'}
            variant={isStreakSafeToday() ? 'ok' : 'default'}
            onClick={() => navigate('/kanban?panel=executar')}
          />
          <KpiCell
            label="Hidratação"
            value={`${aguaSnap.ritualPct}%`}
            hint={`${aguaSnap.copos}/${aguaSnap.ritualCopos} copos`}
            variant={aguaSnap.ritualOk ? 'ok' : 'default'}
            onClick={() => navigate('/saude#hidratacao')}
          />
          <KpiCell
            label="Saldo"
            value={fmtBRL(saldo)}
            hint="mensal"
            onClick={() => navigate('/financeiro')}
          />
        </div>
        <div className="hidden lg:grid grid-cols-4 border border-line rounded-sl bg-card overflow-hidden mt-2">
          <KpiCell
            label="Prazo hoje"
            value={String(dueBuckets.hoje.length)}
            hint="Vencem hoje"
            variant={dueBuckets.hoje.length > 0 ? 'warn' : 'default'}
            onClick={() => navigate('/kanban?bucket=hoje')}
          />
          <KpiCell
            label="Atrasadas"
            value={String(dueBuckets.vencido.length)}
            hint="Precisam de ação"
            variant={dueBuckets.vencido.length > 0 ? 'urgent' : 'default'}
            onClick={() => navigate('/kanban?bucket=vencido')}
          />
          <KpiCell
            label="Concluídas"
            value={String(concluidas)}
            hint="ciclo atual"
            variant="ok"
          />
          <KpiCell
            label="Alertas"
            value={String(alertasTotal)}
            hint="não lidos + prazos"
            variant={alertasTotal > 0 ? 'urgent' : 'default'}
          />
        </div>
      </div>
    </div>
  )
}
