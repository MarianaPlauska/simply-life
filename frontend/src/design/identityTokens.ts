/**
 * Identidade visual Simply-Life / AXEL — fonte da verdade.
 *
 * Tokens ligados em index.css, tailwind.config.js e fontes.
 * Home (Centro de Comando) é a primeira tela com hierarquia voz vs dado.
 *
 * Princípio: o laranja é a voz do AXEL. Módulos de dados têm cor
 * própria. Números pesam mais que molduras. Emoji não é ícone.
 */

export const IDENTITY_VERSION = '2026.08-voice-v1'

/* ── Superfícies (tema escuro = identidade principal) ─────── */

export const COLOR = {
  /** Grafite quente — noite em papel, não OLED #000 */
  canvas: '#1E1C18',
  /** Entre o fundo e o card — nav, chrome, bottom bar */
  chrome: '#25221D',
  /** Card de dado — um tom acima do fundo, sem “placa flutuante” */
  surface: '#2C2923',
  /** Só o momento em que o AXEL fala — mais aberto, sem a mesma borda */
  voice: '#342F28',
  /** Hover / drawer / popover */
  elevated: '#3E3931',

  /** Branco quebrado — texto e números */
  ink: '#EDE7DD',
  /**
   * Secundário ainda AA (≥4.5:1 em surface).
   * Mais escuro que isso vira “cinza morto no preto”.
   */
  inkMuted: '#A39B90',
  /** Labels 11px+ — piso AA (~5:1 em canvas) */
  inkFaint: '#8F877C',

  hairline: 'rgba(237, 231, 221, 0.10)',
  hairlineStrong: 'rgba(237, 231, 221, 0.16)',

  /**
   * Voz do AXEL. Proibido em botão genérico, tab ativa, badge de
   * módulo, progresso de água, ícone de nav.
   */
  axel: '#E8734A',
  axelHover: '#F0845C',
  axelMuted: 'rgba(232, 115, 74, 0.14)',
  /** Texto em preenchimento laranja — cream no laranja falha AA (~2.4:1) */
  axelOnFill: '#1E1C18',

  /** Saúde / hidratação / proteína / treino */
  health: '#7FA37A',
  healthMuted: 'rgba(127, 163, 122, 0.14)',
  healthOnFill: '#1E1C18',

  /** Finanças */
  finance: '#C9A15C',
  financeMuted: 'rgba(201, 161, 92, 0.14)',
  financeOnFill: '#1E1C18',

  /**
   * Tarefas / Kanban / execução.
   * Sem este quarto tom, o Kanban volta a roubar o laranja do AXEL.
   * Ardósia fria: contrasta com laranja, sálvia e ouro (todos quentes).
   */
  tasks: '#8B9BA8',
  tasksMuted: 'rgba(139, 155, 168, 0.14)',
  tasksOnFill: '#1E1C18',

  /** Semântica de sistema — não competem com os módulos */
  danger: '#D47878',
  dangerMuted: 'rgba(212, 120, 120, 0.14)',
  /** Conclusão genérica (não é o verde de saúde) */
  done: '#B8A99A',
} as const

/* ── Claro (mesmo caráter, papel quente — não cinza-100) ──── */

export const COLOR_LIGHT = {
  canvas: '#F4EFE6',
  chrome: '#EBE4D8',
  surface: '#FFFBF5',
  voice: '#F7EDE4',
  elevated: '#FFFFFF',
  ink: '#1C1916',
  inkMuted: '#5C564E',
  inkFaint: '#6F6860',
  hairline: 'rgba(28, 25, 22, 0.10)',
  hairlineStrong: 'rgba(28, 25, 22, 0.16)',
  /** No papel claro o laranja/sálvia/ouro originais falham como texto */
  axel: '#C45A32',
  health: '#4F6F4C',
  finance: '#8A6A2E',
  tasks: '#4A5C68',
  danger: '#A33D3D',
  done: '#5C564E',
  axelOnFill: '#FFFBF5',
  healthOnFill: '#FFFBF5',
  financeOnFill: '#FFFBF5',
  tasksOnFill: '#FFFBF5',
} as const

/* ── WCAG 2.2 AA — pares que a UI pode usar ─────────────────
 *
 * Texto normal ≥ 4.5:1 · texto grande (≥18px ou 14px bold) ≥ 3:1
 * Controles / ícones ≥ 3:1
 *
 * Preenchimento de cor + cream (#EDE7DD) FALHA em axel/health/finance.
 * Por isso fills de módulo levam tinta grafite, não cream.
 */

export const CONTRAST = {
  inkOnCanvas: 15.0,
  inkOnSurface: 13.8,
  inkOnVoice: 12.8,
  mutedOnSurface: 6.4,
  faintOnCanvas: 5.4,
  axelOnCanvas: 6.3,
  axelOnSurface: 5.8,
  healthOnCanvas: 6.8,
  financeOnCanvas: 7.9,
  tasksOnCanvas: 6.1,
  dangerOnCanvas: 5.6,
  /** cream sobre #E8734A — não usar */
  creamOnAxelFail: 2.4,
  graphiteOnAxel: 6.3,
} as const

/* ── Tipografia ───────────────────────────────────────────── */

export const TYPE = {
  /**
   * Voz do AXEL (saudação, recomendação, copy falada).
   * Fraunces: serif com “optical size” e terminais macios —
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
  /** Fraunces 28–36 / 500 — “Bom dia, Mariana.” */
  axelGreeting: { family: 'voice', sizePx: 24, weight: 500, lineHeight: 1.2 },
  /** Fraunces 15 / 400. Frase de recomendação */
  axelSpeech: { family: 'voice', sizePx: 15, weight: 400, lineHeight: 1.4 },
  /** Manrope 11 / 600 uppercase tracking — nome do módulo, não o herói */
  moduleKicker: { family: 'ui', sizePx: 11, weight: 600, lineHeight: 1.2, trackingEm: 0.06 },
  /** Manrope 32–40 / 500 tabular — o número É o card */
  metric: { family: 'ui', sizePx: 28, weight: 500, lineHeight: 1.05, tabular: true },
  /** Manrope 15–16 / 400 — corpo */
  body: { family: 'ui', sizePx: 16, weight: 400, lineHeight: 1.5 },
  /** Manrope 14 / 600 — botão, ação */
  action: { family: 'ui', sizePx: 14, weight: 600, lineHeight: 1.2 },
  pageTitle: { family: 'ui', sizePx: 22, weight: 600, lineHeight: 1.25 },
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
  control: 12,
  /** Card de dado — discreto, não “app genérico 20px” */
  data: 16,
  /** Fala do AXEL — mais aberto, quase envelope */
  voice: 24,
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
    /** Cor só no número e no ícone SVG — nunca na moldura toda */
    accentOn: 'value+icon',
  },
  chrome: {
    bg: 'chrome',
    radius: 0,
    shadow: 'none',
    border: 'hairline',
  },
} as const

/* ── Ícones e humor (assinatura) ──────────────────────────── */

export const ICON = {
  library: 'lucide-react',
  stroke: 1.75,
  /** Toque ≥ 44px no alvo; o glifo fica 20–24 */
  sizeNav: 22,
  sizeModule: 20,
  sizeInline: 16,
} as const

/**
 * Humor do AXEL — não é Lucide Smile/Frown (genérico) nem emoji.
 *
 * Família própria, 5 estados, mesmo esqueleto:
 * - canvas 24×24, cantos 7px (rosto-retângulo, não carinha redonda)
 * - dois olhos (pontos), boca = uma curva que só muda tensão
 * - “brasa”: círculo 3px em `COLOR.axel` no canto inferior direito
 *   (marca registrada — presente em TODOS os estados)
 *
 * Presença na Home (calmo / atento / positivo):
 * mesmo esqueleto, boca 4 / 3 / 5, sempre `text-axel` — nunca cinza triste.
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
   * CTA do produto: invertido cream/grafite — alto contraste,
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
