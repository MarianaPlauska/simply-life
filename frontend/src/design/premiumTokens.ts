/**
 * Escala premium SaaS — tipografia, espaçamento, controles.
 * Dashboard aplica primeiro; Kanban mantém tokens legados (ver PREMIUM_SCOPE_NOTE).
 */

export const PREMIUM_SCOPE_NOTE = {
  kanbanBorderRadius:
    'Kanban aprovado usa rounded-sl (16px). Não migrar até revisão explícita — usar --sl-radius-control só fora do Kanban.',
  kanbanButtons:
    'AXEL_BTN_* legado (min-h-11, rounded-sl) permanece no Kanban; PREMIUM_BTN_* no Dashboard.',
} as const

/** Tipografia — tiers por plataforma */
export const PREMIUM_TYPE = {
  screenHeroMobilePx: 24,
  screenHeroDesktopPx: 28,
  moduleHighlightMobilePx: 22,
  moduleHighlightDesktopPx: 24,
  moduleMetricPx: 16,
  titleMobilePx: 20,
  titleDesktopPx: 24,
  titleWeight: 600,
  sectionLabelPx: 13,
  sectionLabelTracking: '0.03em',
  bodyPx: 14,
  bodyLineHeight: 1.5,
  iconInlinePx: 18,
  iconButtonPx: 18,
  iconEmptyPx: 36,
  iconEmptyOpacity: 0.4,
} as const

/** Espaçamento — px */
export const PREMIUM_SPACE_PX = {
  sectionPadMin: 20,
  sectionPadMax: 24,
  stackGapMin: 24,
  stackGapMax: 32,
  gridColGapMin: 32,
} as const

/** Classes Tailwind derivadas — preferir estas em componentes */
export const PREMIUM_CLASS = {
  screenHero: 'sl-screen-hero',
  moduleHighlight: 'sl-module-highlight',
  moduleMetric: 'sl-module-metric',
  pageTitle: 'sl-page-title',
  sectionLabel: 'sl-section-label',
  body: 'sl-body',
  sectionPad: 'sl-section-pad',
  stackGap: 'sl-stack-gap',
  hairline: 'sl-hairline',
  btn: 'sl-btn',
  btnIcon: 'sl-btn-icon',
} as const

/** MODULE_HERO = tier 2 highlight */
export const PREMIUM_MODULE_HERO = {
  finance: `${PREMIUM_CLASS.moduleHighlight} text-finance`,
  health: `${PREMIUM_CLASS.moduleHighlight} text-health`,
  tasks: `${PREMIUM_CLASS.moduleHighlight} text-tasks`,
} as const

/** Métrica secundária — cor do módulo, menor que hero */
export const PREMIUM_MODULE_METRIC = {
  finance: 'sl-module-metric text-finance',
  health: 'sl-module-metric text-health',
  tasks: 'sl-module-metric text-tasks',
} as const
