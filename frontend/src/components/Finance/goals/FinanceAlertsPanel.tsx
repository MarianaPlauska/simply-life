import { AlertCircle, AlertTriangle, Bell, Info } from 'lucide-react'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_ROW_HOVER,
  AXEL_SECTION_TITLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../../constants/axelSurfaces'
import type { FinanceAlert, FinanceAlertTab } from '../../../lib/financeAlerts'

const SEVERITY_STYLE = {
  urgent: {
    icon: AlertCircle,
    border: 'border-urgente/35',
    bg: 'bg-urgente/8',
    text: 'text-urgente',
  },
  caution: {
    icon: AlertTriangle,
    border: 'border-atencao/35',
    bg: 'bg-atencao/8',
    text: 'text-atencao',
  },
  info: {
    icon: Info,
    border: 'border-line',
    bg: 'bg-chrome/40',
    text: 'text-accent',
  },
} as const

interface FinanceAlertsPanelProps
{
  alerts: FinanceAlert[]
  onNavigate?: (tab: FinanceAlertTab) => void
  compact?: boolean
}

export function FinanceAlertsPanel({
  alerts,
  onNavigate,
  compact = false,
}: FinanceAlertsPanelProps)
{
  const urgentCount = alerts.filter((a) => a.severity === 'urgent').length

  if (alerts.length === 0)
  {
    return (
      <section className={`${AXEL_BORDERLESS_PANEL} ${compact ? 'py-3' : ''}`}>
        <div className="flex items-center gap-2">
          <Bell className={`w-4 h-4 ${AXEL_TEXT_SECONDARY}`} />
          <p className={`text-[12px] ${AXEL_TEXT_SECONDARY}`}>
            Nenhum alerta financeiro no momento.
          </p>
        </div>
      </section>
    )
  }

  const visible = compact ? alerts.slice(0, 3) : alerts

  return (
    <section className={AXEL_BORDERLESS_PANEL}>
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-line">
        <div className="flex items-center gap-2">
          <Bell className={`w-4 h-4 ${urgentCount > 0 ? 'text-urgente' : 'text-atencao'}`} />
          <h2 className={AXEL_SECTION_TITLE}>Alertas</h2>
        </div>
        <span className={`font-mono text-[10px] tabular-nums ${AXEL_TEXT_SECONDARY}`}>
          {alerts.length} ativo(s)
          {urgentCount > 0 && (
            <span className="text-urgente ml-1">· {urgentCount} urgente</span>
          )}
        </span>
      </div>

      <ul className={`mt-2 divide-y divide-line ${compact ? 'space-y-0' : ''}`}>
        {visible.map((alert) =>
        {
          const style = SEVERITY_STYLE[alert.severity]
          const Icon = style.icon

          return (
            <li key={alert.id}>
              <button
                type="button"
                disabled={!onNavigate || !alert.actionTab}
                onClick={() =>
                {
                  if (alert.actionTab && onNavigate) onNavigate(alert.actionTab)
                }}
                className={`w-full text-left flex items-start gap-3 py-3 px-1 rounded-sl border border-transparent ${AXEL_ROW_HOVER} ${
                  alert.actionTab ? 'hover:border-line cursor-pointer' : 'cursor-default'
                }`}
              >
                <div className={`shrink-0 w-8 h-8 rounded-sl border flex items-center justify-center ${style.border} ${style.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${style.text}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-[12px] font-medium ${AXEL_TEXT_PRIMARY}`}>{alert.title}</p>
                  <p className={`text-[11px] mt-0.5 leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
                    {alert.message}
                  </p>
                </div>
              </button>
            </li>
          )
        })}
      </ul>

      {compact && alerts.length > 3 && (
        <p className={`text-[10px] font-mono text-center mt-2 ${AXEL_TEXT_SECONDARY}`}>
          +{alerts.length - 3} alertas na aba Metas
        </p>
      )}
    </section>
  )
}
