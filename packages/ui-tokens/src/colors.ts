export const AXEL_PREMIUM_VERSION = '2026.09-bloco-h-cream-onyx'

export const TAN_PALETTE = {
  naturalTan: '#DED2C4',
  hickoryChips: '#68452B',
  crushedNutmeg: '#D7B793',
  bakedCookie: '#866549',
  riverRoad: '#AD8D6C',
  blackSlug: '#392112',
  kanafeh: '#D08735',
} as const

export const DARK_ONYX = {
  canvas: '#373539',
  surface: '#403C40',
  elevated: '#4A454A',
  hairline: '#504B4F',
  textPrimary: '#F5F1EC',
  textMuted: '#B0A9A6',
  accent: '#E8734A',
  accentPressed: '#C45A32',
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

export const COLOR_DARK: ColorTokens = {
  canvas: DARK_ONYX.canvas,
  chrome: DARK_ONYX.surface,
  surface: DARK_ONYX.surface,
  elevated: DARK_ONYX.elevated,
  ink: DARK_ONYX.textPrimary,
  inkMuted: DARK_ONYX.textMuted,
  inkFaint: 'rgba(176, 169, 166, 0.72)',
  hairline: DARK_ONYX.hairline,
  hairlineStrong: 'rgba(232, 115, 74, 0.55)',
  axel: DARK_ONYX.accent,
  axelHover: DARK_ONYX.accentPressed,
  axelMuted: 'rgba(232, 115, 74, 0.22)',
  axelOnFill: DARK_ONYX.canvas,
  health: '#7BC9A0',
  healthMuted: 'rgba(123, 201, 160, 0.16)',
  finance: '#D4B896',
  financeMuted: 'rgba(212, 184, 150, 0.16)',
  tasks: '#9AA8B5',
  tasksMuted: 'rgba(154, 168, 181, 0.14)',
  danger: '#E07A6A',
  attention: DARK_ONYX.accent,
  done: '#7BC9A0',
  overlay: 'rgba(55, 53, 57, 0.84)',
  widget: DARK_ONYX.elevated,
  widgetInk: DARK_ONYX.textPrimary,
  widgetMuted: DARK_ONYX.textMuted,
}

export const COLOR_LIGHT: ColorTokens = {
  canvas: '#F6EEE3',
  chrome: '#FDF9F3',
  surface: '#FDF9F3',
  elevated: '#FFFFFF',
  ink: '#2A2622',
  inkMuted: '#8C8275',
  inkFaint: 'rgba(140, 130, 117, 0.72)',
  hairline: '#E8DDC9',
  hairlineStrong: 'rgba(232, 115, 74, 0.45)',
  axel: DARK_ONYX.accent,
  axelHover: DARK_ONYX.accentPressed,
  axelMuted: 'rgba(232, 115, 74, 0.14)',
  axelOnFill: '#FFFFFF',
  health: '#3D8F6A',
  healthMuted: 'rgba(61, 143, 106, 0.12)',
  finance: '#B8956B',
  financeMuted: 'rgba(184, 149, 107, 0.14)',
  tasks: '#4A5560',
  tasksMuted: 'rgba(74, 85, 96, 0.12)',
  danger: '#C44B4B',
  attention: DARK_ONYX.accent,
  done: '#3D8F6A',
  overlay: 'rgba(42, 38, 34, 0.40)',
  widget: '#2A2622',
  widgetInk: '#F5F1EC',
  widgetMuted: '#8C8275',
}

export type ThemeMode = 'light' | 'dark'

export function colorsFor(mode: ThemeMode): ColorTokens
{
  return mode === 'light' ? COLOR_LIGHT : COLOR_DARK
}

export const MOOD_COLORS: Record<number, string> = {
  1: '#E07A6A',
  2: DARK_ONYX.accent,
  3: DARK_ONYX.textMuted,
  4: '#7BC9A0',
  5: '#3D8F6A',
}

export const MOOD_LABELS: Record<number, string> = {
  1: 'Péssimo',
  2: 'Ruim',
  3: 'Neutro',
  4: 'Bom',
  5: 'Ótimo',
}

export const MOOD_EMOJI: Record<number, string> = {
  1: '😫',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😄',
}
