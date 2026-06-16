import { useEffect, useState } from 'react'
import { Flame, Users } from 'lucide-react'
import { fetchFriendCircle, type FriendPublicCard } from '../../lib/friendsCircle'
import { ACCENT_PALETTES, type AccentId } from '../../lib/userWorkspacePrefs'
import { useTaskStore } from '../../store/useTaskStore'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

function FriendMiniCard({ friend, myStreak }: { friend: FriendPublicCard; myStreak: number })
{
  const accent = ACCENT_PALETTES[(friend.accent as AccentId) ?? 'copper'] ?? ACCENT_PALETTES.copper
  const savedTogether = myStreak >= 7 && friend.streak_count >= 7

  return (
    <div
      className="rounded-sl border border-line p-3 min-w-[140px] shrink-0"
      style={{ borderLeftColor: accent.dark, borderLeftWidth: 3 }}
    >
      <p className="text-sm font-medium text-ink truncate">{friend.display_name || 'Amigo'}</p>
      <p className="text-[10px] text-ink-muted font-mono uppercase mt-0.5">
        Nv {friend.level} · {friend.streak_count}d ofensiva
      </p>
      {savedTogether && (
        <p className="text-[10px] text-accent mt-2 flex items-center gap-1">
          <Flame size={10} />
          Salvaram a ofensiva esta semana
        </p>
      )}
      {friend.episode_headline && (
        <p className="text-[11px] text-ink-muted mt-1 line-clamp-2">{friend.episode_headline}</p>
      )}
    </div>
  )
}

export function FriendCircleCard()
{
  const streakCount = useTaskStore((s) => s.streakCount)
  const [friends, setFriends] = useState<FriendPublicCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() =>
  {
    let cancelled = false
    void fetchFriendCircle().then((list) =>
    {
      if (!cancelled)
      {
        setFriends(list)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [])

  if (loading)
  {
    return (
      <section className={`${AXEL_BORDERLESS_PANEL} animate-pulse h-24`} aria-hidden />
    )
  }

  if (friends.length === 0)
  {
    return null
  }

  return (
    <section className={AXEL_BORDERLESS_PANEL}>
      <div className="flex items-center gap-2 mb-3">
        <Users size={16} className="text-accent" />
        <h3 className={`text-sm font-medium ${AXEL_TEXT_PRIMARY}`}>Seu Círculo</h3>
        <span className="text-[10px] font-mono text-ink-muted">{friends.length} pessoa(s)</span>
      </div>
      <p className={`text-[12px] mb-3 ${AXEL_TEXT_SECONDARY}`}>
        Cada um vê o &quot;quarto&quot; do outro — cor, mascote e ofensiva, nunca a planilha.
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {friends.map((f) => (
          <FriendMiniCard key={f.user_id} friend={f} myStreak={streakCount} />
        ))}
      </div>
    </section>
  )
}
