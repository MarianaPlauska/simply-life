/**
 * Simply-Life — paleta Marble (mobile + tokens compartilhados).
 * CA2851 · FF6766 · FF8173 · FFE3B3
 */

export const AXEL_PREMIUM_VERSION = '2026.09-marble-v1'

/** Swatches Marble — referência visual */
export const MARBLE = {
  rose: '#CA2851',
  coral: '#FF6766',
  salmon: '#FF8173',
  cream: '#FFE3B3',
} as const

export type ColorTokens = {
  canvas: string
  chrome: string
  surface: string
  elevated: string
  ink: string
  inkMuted: string
  inkFaint: string
  hairline: string
  hairlineStrong: string
  axel: string
  axelHover: string
  axelMuted: string
  axelOnFill: string
  health: string
  healthMuted: string
  finance: string
  financeMuted: string
  tasks: string
  tasksMuted: string
  danger: string
  attention: string
  done: string
  overlay: string
  widget: string
  widgetInk: string
  widgetMuted: string
}

/** Dark — base quente + coral Marble */
export const COLOR_DARK: ColorTokens = {
  canvas: '#1A1214',
  chrome: '#24181A',
  surface: '#2E1F22',
  elevated: '#3A282C',
  ink: '#FFF6EB',
  inkMuted: '#C9A89A',
  inkFaint: '#8F7368',
  hairline: 'rgba(255, 246, 235, 0.10)',
  hairlineStrong: 'rgba(255, 246, 235, 0.18)',
  axel: MARBLE.coral,
  axelHover: MARBLE.salmon,
  axelMuted: 'rgba(255, 103, 102, 0.18)',
  axelOnFill: '#1A1214',
  health: '#7FA37A',
  healthMuted: 'rgba(127, 163, 122, 0.16)',
  finance: MARBLE.cream,
  financeMuted: 'rgba(255, 227, 179, 0.16)',
  tasks: '#E8A0A0',
  tasksMuted: 'rgba(232, 160, 160, 0.16)',
  danger: MARBLE.rose,
  attention: MARBLE.salmon,
  done: '#9AAA95',
  overlay: 'rgba(0, 0, 0, 0.55)',
  widget: '#322024',
  widgetInk: '#FFF6EB',
  widgetMuted: '#C9A89A',
}

/** Light — cream + rose/coral Marble */
export const COLOR_LIGHT: ColorTokens = {
  canvas: '#FFF6EB',
  chrome: '#FFFFFF',
  surface: '#FFEFD9',
  elevated: '#FFFFFF',
  ink: '#2A1218',
  inkMuted: '#6B4550',
  inkFaint: '#A07880',
  hairline: 'rgba(42, 18, 24, 0.10)',
  hairlineStrong: 'rgba(42, 18, 24, 0.16)',
  axel: MARBLE.rose,
  axelHover: '#A81F42',
  axelMuted: 'rgba(255, 103, 102, 0.14)',
  axelOnFill: '#FFF8F0',
  health: '#4F6F4C',
  healthMuted: 'rgba(79, 111, 76, 0.12)',
  finance: '#B8862E',
  financeMuted: 'rgba(184, 134, 46, 0.12)',
  tasks: '#8A4A55',
  tasksMuted: 'rgba(138, 74, 85, 0.12)',
  danger: MARBLE.rose,
  attention: MARBLE.coral,
  done: '#5A6B52',
  overlay: 'rgba(42, 18, 24, 0.40)',
  widget: '#2A1218',
  widgetInk: '#FFF6EB',
  widgetMuted: '#C9A89A',
}

export type ThemeMode = 'light' | 'dark'

export function colorsFor(mode: ThemeMode): ColorTokens
{
  return mode === 'light' ? COLOR_LIGHT : COLOR_DARK
}

export const MOOD_COLORS: Record<number, string> = {
  1: MARBLE.rose,
  2: MARBLE.coral,
  3: '#C9A89A',
  4: MARBLE.salmon,
  5: '#7FA37A',
}

export const MOOD_LABELS: Record<number, string> = {
  1: 'Péssimo',
  2: 'Ruim',
  3: 'Neutro',
  4: 'Bom',
  5: 'Ótimo',
}

/** @deprecated UI mobile usa MoodFace Ionicons — mantido só por compat */
export const MOOD_EMOJI: Record<number, string> = {
  1: '😫',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😄',
}
