import { useTaskStore } from '../../store/useTaskStore'
import { computeGamificationProfile } from '../../lib/gamificationProfile'

// Barra de XP global — fica logo abaixo da topbar no Dashboard

export function XPHeaderBar()
{
  const userStats = useTaskStore((s) => s.userStats)
  const profile = computeGamificationProfile(userStats)

  return (
    <div className="flex items-center gap-3 px-1 py-1">
      <span className="text-[12px] font-bold tracking-wider text-ink-muted uppercase">
        Nível {profile.level}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-chrome overflow-hidden border border-line">
        <div
          className="h-full bg-accent transition-all duration-700"
          style={{ width: `${profile.xpPct}%` }}
        />
      </div>
      <span className="text-[12px] font-mono tabular-nums text-ink-muted">
        {profile.xpInLevel}/{profile.xpToNextLevel} XP
      </span>
    </div>
  )
}
