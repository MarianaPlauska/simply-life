/**
 * AXEL Premium — tons quentes de referência:
 * Claro: Pantone Gold Leaf / 2429 terracotta / Tortilla
 * Escuro: P2P / Task — preto profundo + laranja vivo
 *
 * O acento é a voz do AXEL: no máx. 1–2 usos por tela.
 */

export const AXEL_PREMIUM_VERSION = '2026.09-drive-p2p-v1'

/**
 * Escuro — preto-azulado / charcoal / laranja (refs P2P + Task)
 */
export const GUIDE_DARK = {
  /** Canvas quase preto */
  inkBlack: '#0A0A0C',
  /** Sidebar Drive — navy black */
  navyBlack: '#0D1020',
  charcoal: '#141418',
  elevated: '#1C1C24',
  /** Laranja vivo (CTAs das refs) */
  ember: '#FF6A2B',
  emberSoft: '#FF8A4C',
  ash: '#9A9AA6',
  /** aliases legados */
  chineseBlack: '#0A0A0C',
  jungle: '#141418',
  jet: '#1C1C24',
  coffee: '#0D1020',
  antiqueBrass: '#FF6A2B',
  canvas: '#0A0A0C',
  umber: '#0D1020',
  rust: '#E85A24',
  copper: '#FF6A2B',
} as const

/**
 * Claro — amostrado das fichas Pantone:
 * Gold Leaf #C6A17E · Terracotta #B87252 · Tortilla #CABAAA
 */
export const GUIDE_LIGHT = {
  goldLeaf: '#C6A17E',
  terracotta: '#B87252',
  tortilla: '#CABAAA',
  cream: '#F5F1EC',
  sand: '#C6A17E',
  slate: '#5C534C',
  ink: '#0C1519',
  semanticWarm: '#E8D5C8',
  semanticRose: '#E5B8B8',
  semanticMint: '#B8D4C8',
  semanticSky: '#B8C8D4',
  semanticButter: '#F0E4D0',
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

/** Dark — P2P: preto profundo, cards charcoal, acento laranja */
export const COLOR_DARK: ColorTokens = {
  canvas: GUIDE_DARK.inkBlack,
  chrome: GUIDE_DARK.charcoal,
  surface: GUIDE_DARK.charcoal,
  elevated: GUIDE_DARK.elevated,
  ink: '#F5F5F7',
  inkMuted: GUIDE_DARK.ash,
  inkFaint: '#6E6E78',
  hairline: 'rgba(245, 245, 247, 0.10)',
  hairlineStrong: 'rgba(255, 106, 43, 0.35)',
  axel: GUIDE_DARK.ember,
  axelHover: GUIDE_DARK.emberSoft,
  axelMuted: 'rgba(255, 106, 43, 0.18)',
  axelOnFill: '#0A0A0C',
  health: '#5FD39A',
  healthMuted: 'rgba(95, 211, 154, 0.16)',
  finance: '#F0B45A',
  financeMuted: 'rgba(240, 180, 90, 0.16)',
  tasks: '#8BA4C7',
  tasksMuted: 'rgba(139, 164, 199, 0.16)',
  danger: '#FF6B7A',
  attention: '#F0B45A',
  done: '#5FD39A',
  overlay: 'rgba(0, 0, 0, 0.72)',
  widget: GUIDE_DARK.elevated,
  widgetInk: '#F5F5F7',
  widgetMuted: GUIDE_DARK.ash,
}

/**
 * Light — Tortilla / Gold Leaf / Terracotta.
 * Acento AXEL: terracotta escurecido para AA no cream.
 */
export const COLOR_LIGHT: ColorTokens = {
  canvas: GUIDE_LIGHT.cream,
  chrome: '#FFFCFA',
  surface: '#FFFCFA',
  elevated: '#EDE4D8',
  ink: GUIDE_LIGHT.ink,
  inkMuted: GUIDE_LIGHT.slate,
  inkFaint: '#8A7E74',
  hairline: 'rgba(12, 21, 25, 0.10)',
  hairlineStrong: 'rgba(198, 161, 126, 0.55)',
  axel: '#A05C3D',
  axelHover: '#8B4E34',
  axelMuted: 'rgba(184, 114, 82, 0.16)',
  axelOnFill: GUIDE_LIGHT.cream,
  health: '#3F6B5A',
  healthMuted: 'rgba(184, 212, 200, 0.45)',
  finance: '#7A6540',
  financeMuted: 'rgba(198, 161, 126, 0.35)',
  tasks: '#4A5560',
  tasksMuted: 'rgba(184, 200, 212, 0.45)',
  danger: '#9A4545',
  attention: '#9A7A3A',
  done: '#4A6B58',
  overlay: 'rgba(12, 21, 25, 0.40)',
  widget: GUIDE_LIGHT.ink,
  widgetInk: GUIDE_LIGHT.cream,
  widgetMuted: GUIDE_LIGHT.goldLeaf,
}

export type ThemeMode = 'light' | 'dark'

export function colorsFor(mode: ThemeMode): ColorTokens
{
  return mode === 'light' ? COLOR_LIGHT : COLOR_DARK
}

export const MOOD_COLORS: Record<number, string> = {
  1: '#FF6B7A',
  2: '#F0B45A',
  3: '#9A9AA6',
  4: '#5FD39A',
  5: '#3DB87A',
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
