/**
 * Layout AXEL Premium — radius, elevação, espaçamento 8-pt.
 */

export const RADIUS = {
  card: 24,
  control: 14,
  pill: 999,
  sheet: 28,
  fab: 16,
  bar: 28,
} as const

/** Altura do conteúdo da tab bar (sem safe-area) — Screen usa para padding inferior */
export const TAB_BAR_CONTENT_HEIGHT = 72

export const SPACE = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const

export const TOUCH = {
  min: 44,
  icon: 24,
  fab: 56,
} as const

export type ElevationStyle = {
  shadowColor: string
  shadowOffset: { width: number; height: number }
  shadowOpacity: number
  shadowRadius: number
  elevation: number
}

export type ElevationSet = {
  card: ElevationStyle
  hero: ElevationStyle
  fab: ElevationStyle
  bar: ElevationStyle
}

/** Sombras — hero > card para hierarquia perceptível */
export const ELEVATION: { light: ElevationSet; dark: ElevationSet } = {
  light: {
    card: {
      shadowColor: '#2A2622',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 2,
    },
    hero: {
      shadowColor: '#2A2622',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.16,
      shadowRadius: 28,
      elevation: 8,
    },
    fab: {
      shadowColor: '#CA2851',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 8,
    },
    bar: {
      shadowColor: '#2A2622',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 10,
    },
  },
  dark: {
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 2,
    },
    hero: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.55,
      shadowRadius: 22,
      elevation: 10,
    },
    fab: {
      shadowColor: '#FF6766',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.45,
      shadowRadius: 14,
      elevation: 8,
    },
    bar: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.45,
      shadowRadius: 20,
      elevation: 10,
    },
  },
}

export const BREAKPOINT = {
  tablet: 768,
  desktop: 1024,
} as const
