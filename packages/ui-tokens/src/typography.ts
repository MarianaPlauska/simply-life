export const FONT_FAMILY = {
  ui: 'Lexend',
  voice: 'Fraunces',
  system: 'System',
} as const

export type TypeRole =
  | 'hero'
  | 'title'
  | 'section'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'label'
  | 'micro'
  | 'voice'

export type TypeSpec = {
  size: number
  lineHeight: number
  weight: '400' | '500' | '600' | '700'
  family?: 'voice'
  /** Em px; títulos Fraunces levemente fechados, micro/label levemente abertos */
  letterSpacing?: number
}

export type TypeBreakpoint = 'mobile' | 'tablet' | 'desktop'

export const TYPE_SCALE_RESPONSIVE: Record<
  TypeBreakpoint,
  Record<TypeRole, TypeSpec>
> = {
  mobile: {
    title: { size: 28, lineHeight: 36, weight: '600', family: 'voice', letterSpacing: -0.25 },
    section: { size: 19, lineHeight: 26, weight: '600' },
    hero: { size: 24, lineHeight: 32, weight: '600', family: 'voice', letterSpacing: -0.25 },
    body: { size: 16, lineHeight: 24, weight: '400' },
    bodyStrong: { size: 16, lineHeight: 24, weight: '600' },
    caption: { size: 14, lineHeight: 20, weight: '500' },
    label: { size: 13, lineHeight: 18, weight: '500', letterSpacing: 0.1 },
    micro: { size: 12, lineHeight: 16, weight: '500', letterSpacing: 0.2 },
    voice: { size: 17, lineHeight: 26, weight: '500', family: 'voice' },
  },
  tablet: {
    title: { size: 32, lineHeight: 40, weight: '600', family: 'voice', letterSpacing: -0.25 },
    section: { size: 20, lineHeight: 28, weight: '600' },
    hero: { size: 28, lineHeight: 36, weight: '600', family: 'voice', letterSpacing: -0.25 },
    body: { size: 16, lineHeight: 24, weight: '400' },
    bodyStrong: { size: 16, lineHeight: 24, weight: '600' },
    caption: { size: 14, lineHeight: 20, weight: '500' },
    label: { size: 13, lineHeight: 18, weight: '500', letterSpacing: 0.1 },
    micro: { size: 12, lineHeight: 16, weight: '500', letterSpacing: 0.2 },
    voice: { size: 18, lineHeight: 28, weight: '500', family: 'voice' },
  },
  desktop: {
    title: { size: 36, lineHeight: 44, weight: '600', family: 'voice', letterSpacing: -0.25 },
    section: { size: 21, lineHeight: 28, weight: '600' },
    hero: { size: 32, lineHeight: 40, weight: '600', family: 'voice', letterSpacing: -0.25 },
    body: { size: 16, lineHeight: 24, weight: '400' },
    bodyStrong: { size: 16, lineHeight: 24, weight: '600' },
    caption: { size: 14, lineHeight: 20, weight: '500' },
    label: { size: 13, lineHeight: 18, weight: '500', letterSpacing: 0.1 },
    micro: { size: 12, lineHeight: 16, weight: '500', letterSpacing: 0.2 },
    voice: { size: 18, lineHeight: 28, weight: '500', family: 'voice' },
  },
}

export const TYPE_SCALE = TYPE_SCALE_RESPONSIVE.mobile

export function typeScaleForWidth(width: number): Record<TypeRole, TypeSpec>
{
  // App-first: no desktop a escala mobile evita “content dispersion” (NN/G).
  // Tipo maior no widescreen só estica cards e força scroll.
  void width
  return TYPE_SCALE_RESPONSIVE.mobile
}
