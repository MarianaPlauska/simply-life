import { useMemo } from 'react'
import { Shield, Lock, Cloud, Activity } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { mergeDashboardTasks } from '../../data/mockDashboardData'
import {
  ORION_CHROME_PLANE,
  ORION_DISPLAY_STAT,
  ORION_TEXT_PRIMARY,
  ORION_TEXT_SECONDARY,
} from '../../constants/orionSurfaces'

// Barra de comando — KPIs densos + indicadores de confiança (enterprise)

const fmtBRL = (v: number | null | undefined) =>
  (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

interface KpiCellProps
{
  label: string
  value: string
  hint?: string
  variant?: 'default' | 'urgent' | 'ok'
}

function KpiCell({ label, value, hint, variant = 'default' }: KpiCellProps)
{
  const valueClass = variant === 'urgent'
    ? 'text-urgente'
    : variant === 'ok'
      ? 'text-concluido'
      : ORION_TEXT_PRIMARY

  return (
    <div className="px-4 py-3 border-r border-line last:border-r-0 min-w-0">
      <p className={`font-mono text-[9px] uppercase tracking-[0.12em] ${ORION_TEXT_SECONDARY}`}>
        {label}
      </p>
      <p className={`text-xl font-display tabular-nums mt-1 leading-none ${valueClass}`}>
        {value}
      </p>
      {hint && (
        <p className={`font-mono text-[10px] mt-1 truncate ${ORION_TEXT_SECONDARY}`}>{hint}</p>
      )}
    </div>
  )
}

function StatusPill({
  ok,
  label,
  Icon,
}: {
  ok: boolean
  label: string
  Icon: typeof Shield
})
{
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider px-2 py-1 border rounded-sl ${
        ok
          ? 'border-concluido/30 text-concluido bg-concluido/5'
          : 'border-line text-ink-muted bg-chrome'
      }`}
    >
      <Icon className="w-3 h-3" strokeWidth={1.75} />
      {label}
    </span>
  )
}

interface DashboardCommandBarProps
{
  greeting: string
  firstName: string
}

export function DashboardCommandBar({ greeting, firstName }: DashboardCommandBarProps)
{
  const resumo = useTaskStore((s) => s.dashboardResumo)
  const storeTarefas = useTaskStore((s) => s.tarefas)
  const realtimeStatus = useTaskStore((s) => s.realtimeStatus)
  const googleConnected = useTaskStore((s) => s.googleCalendarConnected)
  const isLoggedIn = useTaskStore((s) => s.isLoggedIn)

  const tarefas = useMemo(() => mergeDashboardTasks(storeTarefas), [storeTarefas])

  const pendentes = resumo?.tarefas_pendentes
    ?? tarefas.filter((t) => t.status !== 'concluida').length
  const criticas = resumo?.tarefas_criticas
    ?? tarefas.filter((t) => t.status !== 'concluida' && (t.score_urgencia ?? 0) >= 90).length
  const concluidas = resumo?.tarefas_concluidas
    ?? tarefas.filter((t) => t.status === 'concluida').length
  const saldo = resumo?.saldo_mes ?? 0
  const receitaMes = resumo?.receita_mes ?? 0
  const medsTotal = resumo?.medicamentos_total ?? 0
  const medsTomados = resumo?.medicamentos_tomados ?? 0
  const medsPct = medsTotal > 0
    ? Math.round((medsTomados / medsTotal) * 100)
    : null
  const notifs = resumo?.notificacoes_nao_lidas ?? 0
  const habitosPct = resumo?.habitos_progresso_pct ?? 0

  const syncOk = realtimeStatus === 'live' || realtimeStatus === 'connecting'
  const now = new Date()
  const dateLine = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className={`border-b border-line ${ORION_CHROME_PLANE}`}>
      <div className="px-4 lg:px-8 py-4 max-w-[1600px] mx-auto w-full">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-4">
          <div>
            <p className="sl-eyebrow">Centro de comando</p>
            <h1 className={`${ORION_DISPLAY_STAT} text-2xl md:text-3xl mt-1`}>
              {greeting}, {firstName}
            </h1>
            <p className={`font-mono text-[11px] capitalize mt-1 ${ORION_TEXT_SECONDARY}`}>
              {dateLine}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill ok={isLoggedIn} label="Sessão" Icon={Lock} />
            <StatusPill ok={syncOk} label={syncOk ? 'Sync ativo' : 'Offline'} Icon={Cloud} />
            <StatusPill ok label="TLS 1.3" Icon={Shield} />
            <StatusPill
              ok={googleConnected}
              label={googleConnected ? 'Google' : 'Google pend.'}
              Icon={Activity}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border border-line rounded-sl bg-card overflow-hidden">
          <KpiCell
            label="Execução"
            value={String(pendentes)}
            hint={`${criticas} crítica${criticas !== 1 ? 's' : ''}`}
            variant={criticas > 0 ? 'urgent' : 'default'}
          />
          <KpiCell
            label="Concluídas"
            value={String(concluidas)}
            hint="ciclo atual"
            variant="ok"
          />
          <KpiCell
            label="Saldo mensal"
            value={fmtBRL(saldo)}
            hint={resumo ? `rec. ${fmtBRL(receitaMes)}` : 'finanças'}
          />
          <KpiCell
            label="Saúde"
            value={medsPct != null ? `${medsPct}%` : `${habitosPct}%`}
            hint={medsPct != null ? 'medicamentos' : 'hábitos'}
          />
          <KpiCell
            label="Alertas"
            value={String(notifs)}
            hint="não lidos"
            variant={notifs > 0 ? 'urgent' : 'default'}
          />
          <KpiCell
            label="Módulos"
            value="6"
            hint="pilares ativos"
          />
        </div>
      </div>
    </div>
  )
}
