export const RADIUS = {
  card: 20,
  control: 14,
  pill: 999,
  sheet: 28,
  fab: 16,
  bar: 24,
} as const

/** Altura da barra de abas encaixada na base, acima da área segura (4 de respiro + 58 da barra) */
export const TAB_BAR_CONTENT_HEIGHT = 62

/**
 * Grade de 4pt, não linear (Material 3, Refactoring UI).
 * Gutter de tela 20, padding de card 20, gap entre cards 16, entre seções 32 a 40,
 * título do card ao corpo 8, rótulo ao valor 4 a 8, entre campos 16.
 */
export const SPACE = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  x3l: 40,
  x4l: 48,
} as const

/** Desktop/web: mesma hierarquia, menos ar (também na grade de 4pt). */
export const SPACE_COMPACT = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  x3l: 32,
  x4l: 40,
} as const

export const TOUCH = {
  min: 44,
  icon: 18,
  fab: 50,
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

/** Sombras - hero > card para hierarquia perceptível */
export const ELEVATION: { light: ElevationSet; dark: ElevationSet } = {
  light: {
    card: {
      shadowColor: '#2A2622',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.06,
      shadowRadius: 20,
      elevation: 2,
    },
    hero: {
      shadowColor: '#2A2622',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 3,
    },
    fab: {
      shadowColor: '#A05C3D',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 5,
    },
    bar: {
      shadowColor: '#2A2622',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 5,
    },
  },
  dark: {
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.28,
      shadowRadius: 18,
      elevation: 3,
    },
    hero: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 4,
    },
    fab: {
      shadowColor: '#B76021',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 5,
    },
    bar: {
      shadowColor: '#1F1712',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 5,
    },
  },
}

export const BREAKPOINT = {
  tablet: 768,
  desktop: 1024,
  mobileMax: 767,
  tabletMax: 1023,
} as const
