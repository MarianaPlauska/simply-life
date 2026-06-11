import type { DueBucket } from '../../lib/dueBucket'

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
  tone: 'urgent' | 'warn' | 'accent' | 'muted'
  onClick?: () => void
})
{
  const tones = {
    urgent: 'border-urgente/40 bg-urgente/10 text-urgente',
    warn: 'border-atencao/40 bg-atencao/10 text-atencao',
    accent: 'border-sky-500/35 bg-sky-500/10 text-sky-400',
    muted: count > 0 ? 'border-line bg-elevated text-ink' : 'border-line bg-chrome/20 text-ink-muted',
  }

  const Tag = onClick ? 'button' : 'span'

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-sl border font-mono text-[10px] uppercase tracking-wide tabular-nums transition-colors ${
        tones[tone]
      } ${onClick ? 'hover:opacity-90 cursor-pointer' : ''}`}
    >
      {label}
      <span className="text-sm font-display">{count}</span>
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
      className="flex flex-wrap items-center gap-2 py-1"
      role="status"
      aria-label="Resumo de prazos e execução"
    >
      <RibbonChip
        label="Executar"
        count={execCount}
        tone="accent"
        onClick={onExecJump}
      />
      <span className="w-px h-5 bg-line hidden sm:block" aria-hidden />
      <RibbonChip label="Atrasadas" count={overdue} tone="urgent" onClick={onJump ? jump('vencido') : undefined} />
      <RibbonChip label="Hoje" count={dueToday} tone="warn" onClick={onJump ? jump('hoje') : undefined} />
      <RibbonChip label="Semana" count={thisWeek} tone="accent" onClick={onJump ? jump('esta_semana') : undefined} />
      <RibbonChip label="Sem data" count={noDate} tone="muted" onClick={onJump ? jump('sem_prazo') : undefined} />
    </div>
  )
}
