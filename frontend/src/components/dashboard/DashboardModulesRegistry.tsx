import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  KanbanSquare, Wallet, HeartPulse, Inbox, PlugZap, BarChart3, ChevronRight,
} from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { mergeDashboardTasks } from '../../data/mockDashboardData'
import { AXEL_ROW_HOVER, AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

// Registro de módulos — mostra escopo completo do OS ao rolar

interface Modulo
{
  id: string
  label: string
  desc: string
  path: string
  Icon: typeof KanbanSquare
  metric: string
  status: 'ok' | 'warn' | 'idle'
}

interface DashboardModulesRegistryProps
{
  /** IDs a ocultar — evita repetir módulos já no dashboard */
  excludeIds?: string[]
}

export function DashboardModulesRegistry({ excludeIds = [] }: DashboardModulesRegistryProps)
{
  const navigate = useNavigate()
  const resumo = useTaskStore((s) => s.dashboardResumo)
  const storeTarefas = useTaskStore((s) => s.tarefas)
  const inboxEvents = useTaskStore((s) => s.inboxEvents)
  const googleConnected = useTaskStore((s) => s.googleCalendarConnected)

  const pendentes = useMemo(() =>
  {
    const t = mergeDashboardTasks(storeTarefas)
    return t.filter((x) => x.status !== 'concluida').length
  }, [storeTarefas])

  const inboxCount = inboxEvents?.length ?? 0

  const modulos: Modulo[] = [
    {
      id: 'exec',
      label: 'Execução',
      desc: 'Kanban temporal · urgência · dependências',
      path: '/kanban',
      Icon: KanbanSquare,
      metric: `${pendentes} abertas`,
      status: pendentes > 8 ? 'warn' : 'ok',
    },
    {
      id: 'fin',
      label: 'Finanças',
      desc: 'Fluxo · metas · regra 50-30-20',
      path: '/financeiro',
      Icon: Wallet,
      metric: resumo
        ? `saldo ${(resumo.saldo_mes ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}`
        : 'planejador',
      status: 'ok',
    },
    {
      id: 'saude',
      label: 'Saúde',
      desc: 'Medicamentos · hábitos · academia',
      path: '/saude',
      Icon: HeartPulse,
      metric: resumo ? `${resumo.habitos_progresso_pct ?? 0}% hábitos` : 'rastreamento',
      status: 'ok',
    },
    {
      id: 'ia',
      label: 'Inteligência',
      desc: 'Inbox IA · triagem · preferências',
      path: '/inteligencia',
      Icon: Inbox,
      metric: `${inboxCount} triados`,
      status: inboxCount > 0 ? 'warn' : 'idle',
    },
    {
      id: 'integ',
      label: 'Integrações',
      desc: 'Google · webhooks · vault',
      path: '/carreira',
      Icon: PlugZap,
      metric: googleConnected ? 'Google ativo' : 'configurar',
      status: googleConnected ? 'ok' : 'idle',
    },
    {
      id: 'rel',
      label: 'Relatórios',
      desc: 'Analytics · export · auditoria',
      path: '/relatorios',
      Icon: BarChart3,
      metric: 'visão consolidada',
      status: 'ok',
    },
  ]

  const visible = modulos.filter((m) => !excludeIds.includes(m.id))

  if (visible.length === 0)
  {
    return null
  }

  const statusDot = (s: Modulo['status']) =>
  {
    if (s === 'warn') return 'bg-atencao'
    if (s === 'ok') return 'bg-concluido'
    return 'bg-ink-muted/40'
  }

  return (
    <div>
      <p className="text-[13px] font-medium text-ink-muted">
        Escopo do sistema
      </p>
      <ul className="mt-1" role="list">
        {visible.map((m) =>
        {
          const Icon = m.Icon
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => navigate(m.path)}
                className={`w-full text-left min-h-12 py-2.5 flex items-center gap-3 ${AXEL_ROW_HOVER}`}
              >
                <Icon className="w-4 h-4 text-ink-muted shrink-0" strokeWidth={1.75} />
                <span className="min-w-0 flex-1">
                  <span className={`block text-[15px] font-medium ${AXEL_TEXT_PRIMARY}`}>{m.label}</span>
                  <span className={`block text-[12px] truncate ${AXEL_TEXT_SECONDARY}`}>
                    {m.desc}
                  </span>
                </span>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot(m.status)}`} />
                <span className="font-mono text-[11px] text-ink-muted shrink-0 hidden sm:inline">
                  {m.metric}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-ink-muted shrink-0" />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
