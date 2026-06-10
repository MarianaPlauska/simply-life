import type { UserStats } from '../store/slices/gamificacaoSlice'

// Perfil RPG derivado do store — level, XP no nível e meta

export const XP_PER_LEVEL = 100

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

  const level = userStats?.level ?? Math.floor(totalXp / XP_PER_LEVEL) + 1
  const xpInLevel = totalXp % XP_PER_LEVEL
  const xpPct = Math.min(100, xpInLevel)

  return {
    level,
    xpInLevel,
    xpToNextLevel: XP_PER_LEVEL,
    xpPct,
    totalXp,
  }
}
