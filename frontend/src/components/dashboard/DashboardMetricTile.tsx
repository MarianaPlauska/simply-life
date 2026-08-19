import type { LucideIcon } from 'lucide-react'
import { AXEL_TOUCH_PRESS } from '../../constants/axelSurfaces'

export type MetricTone = 'tasks' | 'health' | 'finance' | 'ink' | 'urgent'

const TONE_VALUE: Record<MetricTone, string> = {
  tasks: 'text-tasks',
  health: 'text-health',
  finance: 'text-finance',
  ink: 'text-ink',
  urgent: 'text-urgente',
}

interface DashboardMetricTileProps
{
  label: string
  value: string
  hint?: string
  tone: MetricTone
  icon: LucideIcon
  onClick?: () => void
}

export function DashboardMetricTile({
  label,
  value,
  hint,
  tone,
  icon: Icon,
  onClick,
}: DashboardMetricTileProps)
{
  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`text-left py-1.5 min-h-[44px] ${
        onClick ? `${AXEL_TOUCH_PRESS}` : ''
      }`}
    >
      <p className="sl-eyebrow flex items-center gap-1.5">
        <Icon size={13} strokeWidth={1.75} className={TONE_VALUE[tone]} aria-hidden />
        {label}
      </p>
      <p className={`sl-metric mt-1 ${TONE_VALUE[tone]}`}>
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-[11px] text-ink-muted truncate">{hint}</p>
      )}
    </Tag>
  )
}
