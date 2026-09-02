/**
 * Tipografia AXEL Premium — Manrope UI + Fraunces só para voz AXEL.
 * Mínimo 13px em mobile; sem mono uppercase como padrão.
 */

export const FONT_FAMILY = {
  ui: 'Manrope',
  voice: 'Fraunces',
  system: 'System',
} as const

export const TYPE_SCALE = {
  hero: { size: 32, lineHeight: 38, weight: '700' as const },
  title: { size: 24, lineHeight: 30, weight: '600' as const },
  section: { size: 17, lineHeight: 24, weight: '600' as const },
  body: { size: 16, lineHeight: 24, weight: '400' as const },
  bodyStrong: { size: 16, lineHeight: 24, weight: '600' as const },
  caption: { size: 13, lineHeight: 18, weight: '500' as const },
  label: { size: 13, lineHeight: 18, weight: '600' as const },
  micro: { size: 13, lineHeight: 16, weight: '500' as const },
  voice: { size: 17, lineHeight: 26, weight: '500' as const, family: 'voice' as const },
} as const

export type TypeRole = keyof typeof TYPE_SCALE
