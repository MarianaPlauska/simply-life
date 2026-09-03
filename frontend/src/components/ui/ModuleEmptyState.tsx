import type { LucideIcon } from 'lucide-react'

type ModuleTone = 'finance' | 'health' | 'tasks'

interface ModuleEmptyStateProps
{
  icon: LucideIcon
  tone: ModuleTone
  message: string
}

const TONE_ICON: Record<ModuleTone, string> = {
  finance: 'text-finance',
  health: 'text-health',
  tasks: 'text-tasks',
}

/** Vazio calmo - ícone ~40px a 40% + uma linha */
export function ModuleEmptyState({ icon: Icon, tone, message }: ModuleEmptyStateProps)
{
  return (
    <div className="flex flex-col items-start gap-2 py-2">
      <Icon
        size={36}
        strokeWidth={1.5}
        className={`${TONE_ICON[tone]} opacity-40`}
        aria-hidden
      />
      <p className="sl-body-muted">{message}</p>
    </div>
  )
}
