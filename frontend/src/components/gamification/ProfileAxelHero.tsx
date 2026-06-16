import { useMemo } from 'react'
import { useTaskStore } from '../../store/useTaskStore'
import { resolveAxelReaction } from '../../lib/axelMascotReaction'
import { resolveProfileBadge } from '../../lib/axelCosmetics'
import { FinanceMoodMascot } from '../Finance/spreadsheet/FinanceMoodMascot'
import { computeGamificationProfile } from '../../lib/gamificationProfile'
import {
  AXEL_AVATAR,
  AXEL_AVATAR_INITIALS,
  AXEL_BORDERLESS_PANEL,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

function iniciaisDe(nome: string): string
{
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length >= 2)
  {
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
  }
  if (partes.length === 1 && partes[0].length >= 2)
  {
    return partes[0].slice(0, 2).toUpperCase()
  }
  return 'SL'
}

function arquetipo(level: number): string
{
  if (level >= 20) return 'Mestre'
  if (level >= 10) return 'Veterano'
  if (level >= 5) return 'Operador'
  return 'Recruta'
}

// Hero do perfil — mascote reage a humor + ofensiva

export function ProfileAxelHero()
{
  const userProfile = useTaskStore((s) => s.userProfile)
  const userStats = useTaskStore((s) => s.userStats)
  const streakCount = useTaskStore((s) => s.streakCount)
  const isStreakSafeToday = useTaskStore((s) => s.isStreakSafeToday)
  const humorHojeLista = useTaskStore((s) => s.humorHojeLista)
  const humorSemana = useTaskStore((s) => s.humorSemana)
  const workspacePrefs = useTaskStore((s) => s.workspacePrefs)

  const profile = computeGamificationProfile(userStats)
  const humorMedio = humorSemana.length > 0
    ? humorSemana.reduce((s, h) => s + h.humor, 0) / humorSemana.length
    : undefined

  const reaction = useMemo(
    () => resolveAxelReaction({
      streakCount,
      isStreakSafeToday: isStreakSafeToday(),
      humorMedio,
      hasMoodToday: humorHojeLista.length > 0,
    }),
    [streakCount, isStreakSafeToday, humorMedio, humorHojeLista.length],
  )

  const iniciais = iniciaisDe(userProfile?.nome || 'Convidado')
  const firstName = userProfile?.nome?.split(' ')[0] || 'Convidado'
  const badge = resolveProfileBadge(
    workspacePrefs.active_cosmetics.badge,
    { level: profile.level, streakCount },
    workspacePrefs.unlocked_cosmetics,
  )
  const auraClass = workspacePrefs.active_cosmetics.profile_aura
    ? (workspacePrefs.unlocked_cosmetics.includes(workspacePrefs.active_cosmetics.profile_aura)
      ? 'shadow-[0_0_40px_-8px_var(--sl-accent)]'
      : '')
    : ''

  return (
    <section
      className={`${AXEL_BORDERLESS_PANEL} overflow-hidden bg-gradient-to-br from-accent/8 via-card to-card border-l-[3px] border-l-accent ${auraClass}`}
      aria-label="Perfil e mascote AXEL"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className={`relative w-16 h-16 shrink-0 ${AXEL_AVATAR}`}>
            <span className={AXEL_AVATAR_INITIALS}>{iniciais}</span>
            <span className="absolute -bottom-1 -right-1 font-mono text-[9px] px-1.5 py-0.5 rounded-sl bg-accent text-white border border-line">
              {profile.level}
            </span>
          </div>
          <div className="min-w-0">
            <h2 className={`text-xl font-display truncate ${AXEL_TEXT_PRIMARY}`}>
              {firstName}
              {badge && (
                <span className="ml-2 text-base" title="Badge" aria-hidden>{badge.emoji}</span>
              )}
            </h2>
            <p className={`text-[12px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
              {arquetipo(profile.level)} · {profile.xpInLevel}/{profile.xpToNextLevel} XP
            </p>
            <p className={`text-[11px] mt-2 leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
              {reaction.message}
            </p>
          </div>
        </div>

        <FinanceMoodMascot
          mood={reaction.mood}
          headline={reaction.headline}
          size="lg"
          className="sm:mr-2"
        />
      </div>
    </section>
  )
}
