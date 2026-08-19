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
    <div className="sl-panel overflow-hidden">
      <div className="px-4 py-2 border-b border-line">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
          Escopo do sistema
        </p>
      </div>
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-line ${
        visible.length <= 3 ? 'xl:grid-cols-3' : 'xl:grid-cols-6'
      }`}>
        {visible.map((m) =>
        {
          const Icon = m.Icon
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => navigate(m.path)}
              className={`text-left px-4 py-3 flex flex-col gap-2 min-h-[108px] ${AXEL_ROW_HOVER}`}
            >
              <div className="flex items-center justify-between gap-2">
                <Icon className="w-4 h-4 text-accent shrink-0" strokeWidth={1.75} />
                <span className={`w-1.5 h-1.5 rounded-sl shrink-0 ${statusDot(m.status)}`} />
              </div>
              <div>
                <p className={`text-[13px] font-semibold ${AXEL_TEXT_PRIMARY}`}>{m.label}</p>
                <p className={`text-[11px] font-mono mt-0.5 line-clamp-2 ${AXEL_TEXT_SECONDARY}`}>
                  {m.desc}
                </p>
              </div>
              <div className="flex items-center justify-between mt-auto pt-1">
                <span className="font-mono text-[11px] text-accent">{m.metric}</span>
                <ChevronRight className="w-3 h-3 text-ink-muted" />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
