export const AXEL_PREMIUM_VERSION = '2026.09-petroleo-coral'

/**
 * Identidade "Petróleo & Coral" (regra 60-30-10):
 * 60% neutro (fundo), 30% petróleo (barra, títulos, destaques), 10% coral (só ações).
 * Erro e alerta têm cores próprias, longe do coral.
 */
export const BRAND = {
  petroleo: '#1F3A3D',
  menta: '#B9CFCA',
  coral: '#E8734A',
  /** Coral legível como texto no modo claro (5:1 no fundo) */
  coralText: '#A84B27',
  carvao: '#1E1C1A',
} as const

/**
 * Paleta categórica (gráficos, hábitos, pilares de vida).
 * Derivada da identidade, sem o coral de ação nem o rosa de erro.
 * Cada cor tem 3:1 ou mais sobre o `canvas` do seu modo e a ordem evita
 * pares vizinhos confundíveis em protanopia/deuteranopia/tritanopia
 * (menor ΔE simulado entre quaisquer duas cores ≈ 13).
 * Guarde a chave (`ChartSeries`) ou o índice, nunca o hex: a cor final
 * depende do modo e é resolvida na renderização.
 */
export const CHART_SERIES = ['teal', 'amber', 'blue', 'clay', 'violet', 'green', 'plum', 'slate'] as const
export type ChartSeries = (typeof CHART_SERIES)[number]
export type ChartPalette = readonly string[]

/** Claro, contraste sobre #F4F2EE: 3,3 · 4,4 · 5,0 · 4,4 · 5,0 · 3,3 · 7,4 · 4,3 */
export const CHART_LIGHT: ChartPalette = [
  '#389387',
  '#96680F',
  '#4568A4',
  '#A95D37',
  '#7355BE',
  '#589354',
  '#832E65',
  '#5E748B',
]

/** Escuro, contraste sobre #151A1A: 7,3 · 9,0 · 8,2 · 6,7 · 6,9 · 10,8 · 6,5 · 10,1 */
export const CHART_DARK: ChartPalette = [
  '#63B5A3',
  '#DFB35C',
  '#90B2EC',
  '#D39069',
  '#B48FF9',
  '#9FDA90',
  '#C889BD',
  '#B7C6D2',
]

/** Resolve chave ou índice (qualquer inteiro, faz módulo) para a cor da paleta. */
export function chartColor(palette: ChartPalette, key: ChartSeries | number): string
{
  const n = palette.length
  const idx = typeof key === 'number' ? key : CHART_SERIES.indexOf(key)
  return palette[((Math.trunc(idx) % n) + n) % n]
}

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
  /** Contorno sutil de cartões (rim), visível no escuro sem sombra pesada */
  cardRim: string
  /** Petróleo: barra de abas, avatar, cartões de destaque (os 30%) */
  brand: string
  /** Texto e ícones sobre `brand` */
  brandInk: string
  /** Texto forte (títulos, nomes) sobre `brand`: creme */
  onBrand: string
  /** Petróleo profundo: fim de gradiente em superfícies de marca */
  brandDeep: string
  /** Fundo de destaque suave (cartão em evidência, chip) */
  brandMuted: string
  /** Coral para texto, ícone e borda */
  axel: string
  /** Coral para preenchimento (botão, aba ativa, FAB); texto por cima usa `axelOnFill` */
  axelFill: string
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
  /** Fundo suave de erro/atraso (chip, tile) */
  dangerMuted: string
  /** Fundo suave de alerta (prioridade média, aviso) */
  attentionMuted: string
  done: string
  overlay: string
  widget: string
  widgetInk: string
  widgetMuted: string
}

export const COLOR_DARK: ColorTokens = {
  canvas: '#151A1A',
  chrome: '#1C2322',
  surface: '#1C2322',
  elevated: '#232C2B',
  ink: '#EEF2F0',
  inkMuted: '#9FB0AC',
  inkFaint: '#7F8E8B',
  hairline: '#2C3836',
  hairlineStrong: 'rgba(238, 242, 240, 0.22)',
  cardRim: 'rgba(238, 242, 240, 0.06)',
  brand: BRAND.petroleo,
  brandInk: BRAND.menta,
  onBrand: '#EEF2F0',
  brandDeep: '#152B2D',
  brandMuted: BRAND.petroleo,
  axel: BRAND.coral,
  axelFill: BRAND.coral,
  axelHover: '#C45A32',
  axelMuted: 'rgba(232, 115, 74, 0.18)',
  /** Branco no coral dá 3:1 (reprova AA); carvão dá 5,7:1 */
  axelOnFill: BRAND.carvao,
  health: '#6CC79B',
  healthMuted: 'rgba(108, 199, 155, 0.16)',
  finance: '#D7B793',
  financeMuted: 'rgba(215, 183, 147, 0.16)',
  tasks: '#8DB2D6',
  tasksMuted: 'rgba(141, 178, 214, 0.16)',
  /** Rosa-vermelho: erro não pode parecer botão */
  danger: '#EC5B73',
  attention: '#E8B04B',
  dangerMuted: 'rgba(236, 91, 115, 0.16)',
  attentionMuted: 'rgba(232, 176, 75, 0.16)',
  done: '#6CC79B',
  overlay: 'rgba(0, 0, 0, 0.72)',
  widget: '#232C2B',
  widgetInk: '#EEF2F0',
  widgetMuted: '#9FB0AC',
}

export const COLOR_LIGHT: ColorTokens = {
  canvas: '#F4F2EE',
  chrome: '#FFFFFF',
  surface: '#FAF9F6',
  elevated: '#FFFFFF',
  ink: '#1F2A2A',
  inkMuted: '#5E6B69',
  inkFaint: '#7D8987',
  hairline: '#DCE2DF',
  hairlineStrong: 'rgba(31, 58, 61, 0.28)',
  cardRim: 'rgba(31, 58, 61, 0.08)',
  brand: BRAND.petroleo,
  brandInk: BRAND.menta,
  onBrand: '#EEF2F0',
  brandDeep: '#152B2D',
  brandMuted: '#E3ECE9',
  axel: BRAND.coralText,
  axelFill: BRAND.coral,
  axelHover: '#8E3E1F',
  axelMuted: 'rgba(232, 115, 74, 0.16)',
  axelOnFill: BRAND.carvao,
  health: '#2B7454',
  healthMuted: 'rgba(43, 116, 84, 0.12)',
  finance: '#7F6134',
  financeMuted: 'rgba(127, 97, 52, 0.12)',
  tasks: '#44617D',
  tasksMuted: 'rgba(68, 97, 125, 0.12)',
  danger: '#B3304A',
  attention: '#8A5E0E',
  dangerMuted: 'rgba(179, 48, 74, 0.10)',
  attentionMuted: 'rgba(138, 94, 14, 0.12)',
  done: '#2B7454',
  overlay: 'rgba(31, 42, 42, 0.40)',
  widget: BRAND.petroleo,
  widgetInk: '#EEF2F0',
  widgetMuted: BRAND.menta,
}

export type ThemeMode = 'light' | 'dark'

export function colorsFor(mode: ThemeMode): ColorTokens
{
  return mode === 'light' ? COLOR_LIGHT : COLOR_DARK
}

/** Paleta categórica do modo (exposta como `chart` em `useTheme()`) */
export function chartFor(mode: ThemeMode): ChartPalette
{
  return mode === 'light' ? CHART_LIGHT : CHART_DARK
}

export const MOOD_COLORS: Record<number, string> = {
  1: '#EC5B73',
  2: '#E8B04B',
  3: '#9FB0AC',
  4: '#6CC79B',
  5: '#2B7454',
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
