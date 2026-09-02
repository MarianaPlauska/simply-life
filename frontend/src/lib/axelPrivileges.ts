// Desbloqueios por nível e ofensiva — cosmético, sem paywall

import {
  AXEL_COSMETICS_CATALOG,
  computeUnlockedCosmeticIds,
  type CosmeticItem,
} from './axelCosmetics'

export interface PrivilegeContext
{
  level: number
  streakCount: number
}

export interface PrivilegeStatus
{
  id: string
  label: string
  unlocked: boolean
  hint: string
  category?: string
}

/** Privilégios derivados do catálogo (visão resumida no perfil) */
export function listPrivileges(ctx: PrivilegeContext): PrivilegeStatus[]
{
  const highlights: { id: string; hint: string }[] = [
    { id: 'accent_meridian', hint: 'Conta criada' },
    { id: 'accent_sky', hint: 'Nível 3' },
    { id: 'badge_operator', hint: 'Nível 5' },
    { id: 'ai_tone_direct', hint: 'Nível 7' },
    { id: 'frame_episode_7', hint: 'Ofensiva 7 dias' },
    { id: 'ai_tone_coach_plus', hint: 'Nível 10' },
    { id: 'frame_episode_30', hint: 'Ofensiva 30 dias' },
    { id: 'badge_master', hint: 'Nível 20' },
  ]

  const unlocked = new Set(computeUnlockedCosmeticIds(ctx))

  return highlights.map(({ id, hint }) =>
  {
    const item = AXEL_COSMETICS_CATALOG.find((c) => c.id === id)
    return {
      id,
      label: item?.label ?? id,
      unlocked: unlocked.has(id),
      hint,
      category: item?.category,
    }
  })
}

export function canUseAccent(accent: string, _ctx: PrivilegeContext): boolean
{
  // Cores do sistema liberadas no onboarding/preferências (não gatear escolha)
  return ['meridian', 'copper', 'sky', 'forest', 'violet'].includes(accent)
}

export function canInviteFriends(ctx: PrivilegeContext): boolean
{
  return ctx.level >= 5
}

export function canReorderDashboard(ctx: PrivilegeContext): boolean
{
  return ctx.level >= 7
}

export function canUseAiCoachPlus(ctx: PrivilegeContext, unlocked: string[]): boolean
{
  return ctx.level >= 10 || unlocked.includes('ai_tone_coach_plus')
}

export function listXpShopCosmetics(): CosmeticItem[]
{
  return AXEL_COSMETICS_CATALOG.filter((item) => item.unlock.type === 'xp')
}
