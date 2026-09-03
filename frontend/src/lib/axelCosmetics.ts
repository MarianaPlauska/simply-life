// Catálogo de cosméticos e tons de IA - desbloqueio por nível/ofensiva/XP

import type { PrivilegeContext } from './axelPrivileges'
import type { AccentId } from './userWorkspacePrefs'

export type CosmeticCategory =
  | 'accent'
  | 'frame'
  | 'badge'
  | 'mascot_skin'
  | 'ai_tone'
  | 'profile_aura'

export type CosmeticUnlockType = 'default' | 'level' | 'streak' | 'xp'

export interface CosmeticItem
{
  id: string
  category: CosmeticCategory
  label: string
  description: string
  unlock: {
    type: CosmeticUnlockType
    minLevel?: number
    minStreak?: number
    costXp?: number
  }
  /** Classes Tailwind ou token CSS aplicável */
  style?: string
  preview?: string
}

export interface ActiveCosmetics
{
  frame: string | null
  badge: string | null
  mascot_skin: string | null
  ai_tone: string
  profile_aura: string | null
}

export const DEFAULT_ACTIVE_COSMETICS: ActiveCosmetics = {
  frame: null,
  badge: null,
  mascot_skin: 'mascot_default',
  ai_tone: 'ai_tone_friendly',
  profile_aura: null,
}

export const AXEL_COSMETICS_CATALOG: CosmeticItem[] = [
  // Acentos
  { id: 'accent_meridian', category: 'accent', label: 'Meridiano', description: 'Teal Simply-Life', unlock: { type: 'default' }, preview: '#38B2AC' },
  { id: 'accent_copper', category: 'accent', label: 'Cobre', description: 'Laranja vivo / terracotta', unlock: { type: 'level', minLevel: 2 }, preview: '#FF6A2B' },
  { id: 'accent_sky', category: 'accent', label: 'Céu', description: 'Azul claro', unlock: { type: 'level', minLevel: 3 }, preview: '#38A3E8' },
  { id: 'accent_forest', category: 'accent', label: 'Floresta', description: 'Verde calmo', unlock: { type: 'level', minLevel: 3 }, preview: '#4A7C59' },
  { id: 'accent_violet', category: 'accent', label: 'Violeta', description: 'Roxo suave', unlock: { type: 'level', minLevel: 6 }, preview: '#8B7CF6' },

  // Molduras episódio
  { id: 'frame_none', category: 'frame', label: 'Sem moldura', description: 'Visual limpo', unlock: { type: 'default' } },
  {
    id: 'frame_episode_7',
    category: 'frame',
    label: 'Moldura Ofensiva 7d',
    description: 'Borda âmbar no episódio semanal',
    unlock: { type: 'streak', minStreak: 7 },
    style: 'ring-2 ring-orange-400/50 shadow-[0_0_24px_-4px_rgba(251,146,60,0.35)]',
  },
  {
    id: 'frame_episode_30',
    category: 'frame',
    label: 'Moldura Ofensiva 30d',
    description: 'Aura dourada no recap',
    unlock: { type: 'streak', minStreak: 30 },
    style: 'ring-2 ring-amber-300/60 shadow-[0_0_28px_-2px_rgba(252,211,77,0.4)]',
  },
  {
    id: 'frame_level_15',
    category: 'frame',
    label: 'Moldura Veterano',
    description: 'Nível 15+',
    unlock: { type: 'level', minLevel: 15 },
    style: 'ring-2 ring-accent/60 border-l-4 border-l-accent',
  },

  // Badges perfil
  { id: 'badge_recruit', category: 'badge', label: 'Recruta', description: 'Conta nova', unlock: { type: 'default' }, preview: '🌱' },
  { id: 'badge_operator', category: 'badge', label: 'Operador', description: 'Nível 5', unlock: { type: 'level', minLevel: 5 }, preview: '⚡' },
  { id: 'badge_veteran', category: 'badge', label: 'Veterano', description: 'Nível 10', unlock: { type: 'level', minLevel: 10 }, preview: '🛡️' },
  { id: 'badge_master', category: 'badge', label: 'Mestre', description: 'Nível 20', unlock: { type: 'level', minLevel: 20 }, preview: '👑' },

  // Skins mascote
  { id: 'mascot_default', category: 'mascot_skin', label: 'AXEL clássico', description: 'Mascote padrão', unlock: { type: 'default' } },
  { id: 'mascot_aurora', category: 'mascot_skin', label: 'Aurora', description: 'Gradiente céu', unlock: { type: 'level', minLevel: 8 } },
  { id: 'mascot_midnight', category: 'mascot_skin', label: 'Meia-noite', description: 'Tom escuro', unlock: { type: 'streak', minStreak: 14 } },
  { id: 'mascot_coral', category: 'mascot_skin', label: 'Coral', description: 'Energia quente', unlock: { type: 'xp', costXp: 300 } },

  // Tons coach IA
  {
    id: 'ai_tone_friendly',
    category: 'ai_tone',
    label: 'Amigo próximo',
    description: 'Empático e leve',
    unlock: { type: 'default' },
  },
  {
    id: 'ai_tone_direct',
    category: 'ai_tone',
    label: 'Direto ao ponto',
    description: 'Sem rodeios',
    unlock: { type: 'level', minLevel: 7 },
  },
  {
    id: 'ai_tone_playful',
    category: 'ai_tone',
    label: 'Brincalhão',
    description: 'Humor sutil',
    unlock: { type: 'level', minLevel: 12 },
  },
  {
    id: 'ai_tone_zen',
    category: 'ai_tone',
    label: 'Zen',
    description: 'Calmo e mindful',
    unlock: { type: 'streak', minStreak: 21 },
  },
  {
    id: 'ai_tone_coach_plus',
    category: 'ai_tone',
    label: 'Coach personalizado',
    description: 'Tom adaptativo avançado',
    unlock: { type: 'level', minLevel: 10 },
  },

  // Aura perfil
  { id: 'aura_none', category: 'profile_aura', label: 'Sem aura', description: 'Padrão', unlock: { type: 'default' } },
  {
    id: 'aura_soft_glow',
    category: 'profile_aura',
    label: 'Brilho suave',
    description: 'Nível 3',
    unlock: { type: 'level', minLevel: 3 },
    style: 'shadow-[0_0_40px_-8px_var(--sl-accent)]',
  },
  {
    id: 'aura_streak_fire',
    category: 'profile_aura',
    label: 'Chama da ofensiva',
    description: '7 dias seguidos',
    unlock: { type: 'streak', minStreak: 7 },
    style: 'shadow-[0_0_36px_-6px_rgba(251,146,60,0.45)]',
  },
]

const CATALOG_BY_ID = new Map(AXEL_COSMETICS_CATALOG.map((c) => [c.id, c]))

export function getCosmeticById(id: string): CosmeticItem | undefined
{
  return CATALOG_BY_ID.get(id)
}

export function isCosmeticUnlocked(item: CosmeticItem, ctx: PrivilegeContext, unlockedIds: string[]): boolean
{
  if (unlockedIds.includes(item.id)) return true

  const { unlock } = item
  if (unlock.type === 'default') return true
  if (unlock.type === 'level' && (unlock.minLevel ?? 0) <= ctx.level) return true
  if (unlock.type === 'streak' && (unlock.minStreak ?? 0) <= ctx.streakCount) return true
  // XP comprado fica só em unlockedIds
  return false
}

/** IDs desbloqueados automaticamente pelo progresso */
export function computeUnlockedCosmeticIds(ctx: PrivilegeContext): string[]
{
  return AXEL_COSMETICS_CATALOG
    .filter((item) => isCosmeticUnlocked(item, ctx, []))
    .map((item) => item.id)
}

export function mergeUnlockedCosmetics(current: string[], ctx: PrivilegeContext): string[]
{
  const auto = computeUnlockedCosmeticIds(ctx)
  return [...new Set([...current, ...auto])]
}

export function cosmeticsByCategory(category: CosmeticCategory): CosmeticItem[]
{
  return AXEL_COSMETICS_CATALOG.filter((c) => c.category === category)
}

export function accentIdFromCosmetic(cosmeticId: string): AccentId | null
{
  const map: Record<string, AccentId> = {
    accent_meridian: 'meridian',
    accent_copper: 'copper',
    accent_sky: 'sky',
    accent_forest: 'forest',
    accent_violet: 'violet',
  }
  return map[cosmeticId] ?? null
}

export function resolveEpisodeFrameClass(
  activeFrame: string | null | undefined,
  ctx: PrivilegeContext,
  unlocked: string[],
): string
{
  const preferred = activeFrame || (ctx.streakCount >= 30 ? 'frame_episode_30' : ctx.streakCount >= 7 ? 'frame_episode_7' : null)
  if (!preferred || preferred === 'frame_none') return ''

  const item = getCosmeticById(preferred)
  if (!item || !isCosmeticUnlocked(item, ctx, unlocked)) return ''
  return item.style ?? ''
}

export function resolveProfileBadge(
  activeBadge: string | null | undefined,
  ctx: PrivilegeContext,
  unlocked: string[],
): { id: string; emoji: string } | null
{
  const auto = ctx.level >= 20
    ? 'badge_master'
    : ctx.level >= 10
      ? 'badge_veteran'
      : ctx.level >= 5
        ? 'badge_operator'
        : 'badge_recruit'

  const id = activeBadge || auto
  const item = getCosmeticById(id)
  if (!item || !isCosmeticUnlocked(item, ctx, unlocked)) return null
  return { id, emoji: item.preview ?? '🏅' }
}

export const AI_TONE_PROMPTS: Record<string, string> = {
  ai_tone_friendly: 'Tom de melhor amigo: empático, caloroso, celebra pequenas vitórias.',
  ai_tone_direct: 'Tom direto: frases curtas, números primeiro, sem floreios.',
  ai_tone_playful: 'Tom leve com humor sutil - nunca sarcástico com dinheiro sério.',
  ai_tone_zen: 'Tom zen: calmo, mindful, foco em equilíbrio e respiração financeira.',
  ai_tone_coach_plus: 'Tom de coach personalizado: mistura empatia com accountability gentil.',
}

export function resolveAiTonePrompt(toneId: string | undefined, ctx: PrivilegeContext, unlocked: string[]): string
{
  const id = toneId || 'ai_tone_friendly'
  const item = getCosmeticById(id)
  if (!item || item.category !== 'ai_tone')
  {
    return AI_TONE_PROMPTS.ai_tone_friendly
  }
  if (!isCosmeticUnlocked(item, ctx, unlocked))
  {
    return AI_TONE_PROMPTS.ai_tone_friendly
  }
  return AI_TONE_PROMPTS[id] ?? AI_TONE_PROMPTS.ai_tone_friendly
}
