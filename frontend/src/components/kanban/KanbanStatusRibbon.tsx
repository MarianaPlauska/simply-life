import type { DueBucket } from '../../lib/dueBucket'
import { AXEL_STATUS_BADGE, AXEL_STATUS_BADGE_URGENT, AXEL_STATUS_BADGE_WARN } from '../../constants/axelSurfaces'

// Faixa de status — leitura rápida antes do board

interface KanbanStatusRibbonProps
{
  overdue: number
  dueToday: number
  thisWeek: number
  noDate: number
  execCount: number
  onJump?: (bucket: DueBucket) => void
  onExecJump?: () => void
}

function RibbonChip({
  label,
  count,
  tone,
  onClick,
}: {
  label: string
  count: number
  tone: 'urgent' | 'warn' | 'neutral' | 'muted'
  onClick?: () => void
})
{
  const badgeClass =
    tone === 'urgent'
      ? AXEL_STATUS_BADGE_URGENT
      : tone === 'warn'
        ? AXEL_STATUS_BADGE_WARN
        : AXEL_STATUS_BADGE

  const Tag = onClick ? 'button' : 'span'

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`inline-flex items-center gap-2 tabular-nums transition-opacity ${
        badgeClass
      } ${onClick ? 'hover:opacity-90 cursor-pointer' : ''} ${tone === 'muted' && count === 0 ? 'opacity-50' : ''}`}
    >
      {label}
      <span className="font-mono text-[11px]">{count}</span>
    </Tag>
  )
}

export function KanbanStatusRibbon({
  overdue,
  dueToday,
  thisWeek,
  noDate,
  execCount,
  onJump,
  onExecJump,
}: KanbanStatusRibbonProps)
{
  const jump = (b: DueBucket) => () => onJump?.(b)

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 py-0.5"
      role="status"
      aria-label="Resumo de prazos e execução"
    >
      <RibbonChip
        label="Executar"
        count={execCount}
        tone="neutral"
        onClick={onExecJump}
      />
      <span className="w-px h-4 bg-white/[0.06] hidden sm:block" aria-hidden />
      <RibbonChip label="Atrasadas" count={overdue} tone="urgent" onClick={onJump ? jump('vencido') : undefined} />
      <RibbonChip label="Hoje" count={dueToday} tone="warn" onClick={onJump ? jump('hoje') : undefined} />
      <RibbonChip label="Semana" count={thisWeek} tone="neutral" onClick={onJump ? jump('esta_semana') : undefined} />
      <RibbonChip label="Sem data" count={noDate} tone="muted" onClick={onJump ? jump('sem_prazo') : undefined} />
    </div>
  )
}
