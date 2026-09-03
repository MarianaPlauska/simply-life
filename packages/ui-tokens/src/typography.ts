export const FONT_FAMILY = {
  ui: 'Manrope',
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
}

export type TypeBreakpoint = 'mobile' | 'tablet' | 'desktop'

export const TYPE_SCALE_RESPONSIVE: Record<
  TypeBreakpoint,
  Record<TypeRole, TypeSpec>
> = {
  mobile: {
    title: { size: 28, lineHeight: 34, weight: '700' },
    section: { size: 16, lineHeight: 22, weight: '600' },
    hero: { size: 22, lineHeight: 28, weight: '700' },
    body: { size: 13, lineHeight: 20, weight: '400' },
    bodyStrong: { size: 13, lineHeight: 20, weight: '600' },
    caption: { size: 13, lineHeight: 18, weight: '500' },
    label: { size: 13, lineHeight: 18, weight: '600' },
    micro: { size: 12, lineHeight: 16, weight: '500' },
    voice: { size: 16, lineHeight: 24, weight: '500', family: 'voice' },
  },
  tablet: {
    title: { size: 32, lineHeight: 38, weight: '700' },
    section: { size: 17, lineHeight: 24, weight: '600' },
    hero: { size: 26, lineHeight: 32, weight: '700' },
    body: { size: 13, lineHeight: 20, weight: '400' },
    bodyStrong: { size: 13, lineHeight: 20, weight: '600' },
    caption: { size: 13, lineHeight: 18, weight: '500' },
    label: { size: 13, lineHeight: 18, weight: '600' },
    micro: { size: 12, lineHeight: 16, weight: '500' },
    voice: { size: 17, lineHeight: 26, weight: '500', family: 'voice' },
  },
  desktop: {
    title: { size: 36, lineHeight: 42, weight: '700' },
    section: { size: 18, lineHeight: 26, weight: '600' },
    hero: { size: 30, lineHeight: 36, weight: '700' },
    body: { size: 14, lineHeight: 22, weight: '400' },
    bodyStrong: { size: 14, lineHeight: 22, weight: '600' },
    caption: { size: 13, lineHeight: 18, weight: '500' },
    label: { size: 14, lineHeight: 18, weight: '600' },
    micro: { size: 12, lineHeight: 16, weight: '500' },
    voice: { size: 17, lineHeight: 26, weight: '500', family: 'voice' },
  },
}

export const TYPE_SCALE = TYPE_SCALE_RESPONSIVE.mobile

export function typeScaleForWidth(width: number): Record<TypeRole, TypeSpec>
{
  if (width >= 1024) return TYPE_SCALE_RESPONSIVE.desktop
  if (width >= 768) return TYPE_SCALE_RESPONSIVE.tablet
  return TYPE_SCALE_RESPONSIVE.mobile
}
