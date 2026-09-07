/**
 * Identidade visual Simply-Life / AXEL - legado web (PWA).
 *
 * Fonte da verdade do redesign mobile: packages/ui-tokens (AXEL Premium).
 * Ver docs/AXEL_PREMIUM.md e docs/PWA_DESTINO.md.
 *
 * Tokens ligados em index.css, tailwind.config.js e fontes.
 * Princípio: o laranja é a voz do AXEL. Módulos de dados têm cor própria.
 */

export const IDENTITY_VERSION = '2026.09-bloco-i-true-black'
export const PREMIUM_TOKENS_PATH = '@simply-life/ui-tokens'

/* ── Superfícies escuro (preto profundo tipo Cryptora) ─ */

export const COLOR = {
  canvas: '#000000',
  chrome: '#141414',
  surface: '#141414',
  voice: '#1C1C1E',
  elevated: '#1C1C1E',

  ink: '#F5F1EC',
  inkMuted: '#A8A29E',
  inkFaint: 'rgba(168, 162, 158, 0.72)',

  hairline: '#2A2A2C',
  hairlineStrong: 'rgba(232, 115, 74, 0.55)',

  /** Voz do AXEL */
  axel: '#E8734A',
  axelHover: '#C45A32',
  axelMuted: 'rgba(232, 115, 74, 0.22)',
  axelOnFill: '#FFFFFF',

  health: '#7BC9A0',
  healthMuted: 'rgba(123, 201, 160, 0.16)',
  healthOnFill: '#0B0B0B',

  finance: '#F5F1EC',
  financeMuted: 'rgba(245, 241, 236, 0.12)',
  financeOnFill: '#0B0B0B',

  tasks: '#F5F1EC',
  tasksMuted: 'rgba(245, 241, 236, 0.10)',
  tasksOnFill: '#0B0B0B',

  danger: '#E07A6A',
  dangerMuted: 'rgba(224, 122, 106, 0.14)',
  done: '#7BC9A0',
  attention: '#E8734A',
} as const

/* ── Claro (creme quente Bloco H) ──────── */

export const COLOR_LIGHT = {
  canvas: '#F6EEE3',
  chrome: '#FDF9F3',
  surface: '#FDF9F3',
  voice: '#E8DDC9',
  elevated: '#FFFFFF',
  ink: '#2A2622',
  inkMuted: '#8C8275',
  inkFaint: 'rgba(140, 130, 117, 0.72)',
  hairline: '#E8DDC9',
  hairlineStrong: 'rgba(232, 115, 74, 0.45)',
  axel: '#E8734A',
  health: '#3D8F6A',
  finance: '#B8956B',
  tasks: '#4A5560',
  danger: '#C44B4B',
  attention: '#E8734A',
  done: '#3D8F6A',
  axelOnFill: '#FFFFFF',
  healthOnFill: '#FFFFFF',
  financeOnFill: '#FFFFFF',
  tasksOnFill: '#FFFFFF',
  sand: '#B8956B',
  tortilla: '#F6EEE3',
  terracotta: '#E8734A',
  semanticWarm: '#F6EEE3',
  semanticRose: '#E5B8B8',
  semanticMint: '#B8D4C8',
  semanticSky: '#B8C8D4',
  semanticButter: '#FDF9F3',
} as const

/* ── WCAG 2.2 AA - pares que a UI pode usar ─────────────────
 *
 * Texto normal ≥ 4.5:1 · texto grande (≥18px ou 14px bold) ≥ 3:1
 * Controles / ícones ≥ 3:1
 *
 * Preenchimento de cor + cream falha AA. Fills de módulo levam o canvas escuro.
 */

export const CONTRAST = {
  inkOnCanvas: 12.2,
  inkOnSurface: 9.6,
  inkOnVoice: 8.5,
  mutedOnSurface: 5.3,
  faintOnCanvas: 5.2,
  axelOnCanvas: 5.2,
  axelOnSurface: 4.1,
  healthOnCanvas: 5.5,
  financeOnCanvas: 6.5,
  tasksOnCanvas: 5.5,
  dangerOnCanvas: 5.0,
  /** cream sobre #E8734A - não usar */
  creamOnAxelFail: 2.3,
  graphiteOnAxel: 5.2,
} as const

/* ── Tipografia ───────────────────────────────────────────── */

export const TYPE = {
  /**
   * Voz do AXEL (saudação, recomendação, copy falada).
   * Fraunces: serif com “optical size” e terminais macios -
   * parece falada, não editorial (Lora) nem display de poster.
   */
  voice: '"Fraunces", "Iowan Old Style", Georgia, serif',
  /**
   * UI, números, botões.
   * Manrope: humanista e redonda o suficiente para não parecer
   * dashboard SaaS (Inter/DM Sans). Tabular nums no CSS, sem mono.
   */
  ui: '"Manrope", system-ui, sans-serif',
  /**
   * Mono só para códigos (TOTP, IDs). Nunca em título de página
   * (“Centro de comando”) nem label de card.
   */
  code: 'ui-monospace, "SF Mono", Menlo, monospace',
} as const

export const TYPE_ROLE = {
  /** Fraunces 28-36 / 500 - “Bom dia, Mariana.” */
  axelGreeting: { family: 'voice', sizePx: 24, weight: 500, lineHeight: 1.2 },
  /** Fraunces 15 / 400. Frase de recomendação */
  axelSpeech: { family: 'voice', sizePx: 15, weight: 400, lineHeight: 1.4 },
  /** Manrope 11 / 600 uppercase tracking - nome do módulo, não o herói */
  moduleKicker: { family: 'ui', sizePx: 11, weight: 600, lineHeight: 1.2, trackingEm: 0.06 },
  /** Manrope 32-40 / 500 tabular - o número É o card */
  metric: { family: 'ui', sizePx: 28, weight: 500, lineHeight: 1.05, tabular: true },
  /** Manrope 15-16 / 400 - corpo */
  body: { family: 'ui', sizePx: 16, weight: 400, lineHeight: 1.5 },
  /** Manrope 14 / 600 - botão, ação */
  action: { family: 'ui', sizePx: 14, weight: 600, lineHeight: 1.2 },
  pageTitle: { family: 'voice', sizePx: 24, weight: 500, lineHeight: 1.2 },
} as const

/* ── Espaço, raio, elevação ───────────────────────────────── */

export const SPACE = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 24,
  6: 32,
  7: 48,
} as const

export const RADIUS = {
  /** Botões, chips, inputs */
  control: 16,
  /** Card de dado */
  data: 24,
  /** Fala do AXEL */
  voice: 28,
  pill: 9999,
} as const

export const ELEVATION = {
  /** Dado: sem sombra. O número carrega a hierarquia. */
  data: 'none',
  /** Fala: brasa suave, não drop-shadow preta de template */
  voice: '0 0 0 1px rgba(232, 115, 74, 0.22), 0 12px 40px rgba(232, 115, 74, 0.08)',
  overlay: '0 16px 48px rgba(0, 0, 0, 0.45)',
} as const

/* ── Hierarquia de superfície ─────────────────────────────── */

export const SURFACE_ROLE = {
  axelVoice: {
    bg: 'voice',
    radius: 'voice',
    shadow: 'voice',
    border: 'none',
    type: 'axelSpeech',
    accent: 'axel',
  },
  dataMetric: {
    bg: 'surface',
    radius: 'data',
    shadow: 'data',
    border: 'hairline',
    type: 'metric',
    /** Cor só no número e no ícone SVG - nunca na moldura toda */
    accentOn: 'value+icon',
  },
  chrome: {
    bg: 'chrome',
    radius: 0,
    shadow: 'none',
    border: 'hairline',
  },
} as const

/* ─ Ícones e humor (assinatura) ──────────────────────────── */

export const ICON = {
  library: 'lucide-react',
  stroke: 1.75,
  /** Toque ≥ 44px no alvo; o glifo fica 20-24 */
  sizeNav: 22,
  sizeModule: 20,
  sizeInline: 16,
} as const

/**
 * Humor do AXEL - não é Lucide Smile/Frown (genérico) nem emoji.
 *
 * Família própria, 5 estados, mesmo esqueleto:
 * - canvas 24×24, cantos 7px (rosto-retângulo, não carinha redonda)
 * - dois olhos (pontos), boca = uma curva que só muda tensão
 * - “brasa”: círculo 3px em `COLOR.axel` no canto inferior direito
 *   (marca registrada - presente em TODOS os estados)
 *
 * Presença na Home (calmo / atento / positivo):
 * mesmo esqueleto, boca 4 / 3 / 5, sempre `text-axel` - nunca cinza triste.
 * Os SVG entram na etapa 2 (Home), neste arquivo só a regra.
 */
export const AXEL_MOOD = {
  stroke: 1.75,
  viewBox: 24,
  faceRadius: 7,
  ember: true,
  states: {
    drained: { value: 1, label: 'Apagado' },
    uneasy: { value: 2, label: 'Tenso' },
    steady: { value: 3, label: 'Sereno' },
    bright: { value: 4, label: 'Animado' },
    lit: { value: 5, label: 'Aceso' },
  },
  sizeInVoice: 40,
  sizeInNav: 22,
} as const

/* ── Ações (botões) ───────────────────────────────────────── */

export const ACTION = {
  /**
   * CTA do produto: invertido cream/grafite - alto contraste,
   * zero laranja. O laranja não “pede clique”; ele “é o AXEL”.
   */
  primaryBg: 'ink',
  primaryFg: 'canvas',
  /** Ghost para o resto */
  quietBg: 'transparent',
  quietFg: 'ink',
  quietBorder: 'hairlineStrong',
  /** Só em “perguntar ao AXEL” / avatar */
  axelBorder: 'axel',
  axelFg: 'axel',
  axelBg: 'axelMuted',
} as const

/* ── Mapa de migração (quando aplicar telas) ──────────────── */

export const MIGRATION = {
  /**
   * Não redefinir `--sl-accent` global na primeira leva: hoje ele
   * pinta botão, tab, água, badge. Introduzir `--sl-axel`,
   * `--sl-health`, `--sl-finance`, `--sl-tasks` e ir trocando tela
   * a tela. Home primeiro.
   */
  keepLegacyAccentUntilPerScreen: true,
  firstScreen: 'home-centro-de-comando',
  loadFonts: [
    'Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600',
    'Manrope:wght@400;500;600;700',
  ],
  dropFromUiTitles: ['DM Mono', 'JetBrains Mono', 'font-mono em h1/h2'],
} as const
