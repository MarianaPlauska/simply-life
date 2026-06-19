import { AlertCircle, CheckCircle, Link2, type LucideIcon } from 'lucide-react'
import type { ActivityEventKind } from '../../hooks/useTaskActivityLog'

export const ACTIVITY_EVENT_META: Record<
  ActivityEventKind,
  { label: string; Icon: LucideIcon; color: string }
> = {
  // rascunho — eventos automáticos na criação da demanda
  blocker: { label: 'Registrar bloqueio', Icon: AlertCircle, color: 'text-amber-400' },
  progress: { label: 'Atualizar andamento', Icon: CheckCircle, color: 'text-emerald-400' },
  dependency: { label: 'Vincular dependência', Icon: Link2, color: 'text-sky-400' },
  rascunho: { label: 'Rascunho', Icon: CheckCircle, color: 'text-ink-muted' },
}

export function ActivityEventIcon({
  kind,
  size = 16,
}: {
  kind: ActivityEventKind
  size?: number
})
{
  const { Icon, color } = ACTIVITY_EVENT_META[kind]
  return <Icon size={size} strokeWidth={1.5} className={`shrink-0 ${color}`} aria-hidden />
}
