import type { UserStats } from '../store/slices/gamificacaoSlice'
import { XP_PER_LEVEL, levelFromTotalXp, xpProgressInLevel } from './xpEconomy'

// Perfil RPG derivado do store — level, XP no nível e meta

export { XP_PER_LEVEL }

export interface GamificationProfile
{
  level: number
  xpInLevel: number
  xpToNextLevel: number
  xpPct: number
  totalXp: number
}

export function computeGamificationProfile(userStats: UserStats | null): GamificationProfile
{
  const totalXp =
    (userStats?.xp_foco ?? 0)
    + (userStats?.xp_vitalidade ?? 0)
    + (userStats?.xp_estabilidade ?? 0)

  const level = userStats?.level ?? levelFromTotalXp(totalXp)
  const { xpInLevel, xpToNext, pct: xpPct } = xpProgressInLevel(totalXp)

  return {
    level,
    xpInLevel,
    xpToNextLevel: xpToNext,
    xpPct,
    totalXp,
  }
}
