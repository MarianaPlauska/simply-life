// Tokens Instrumento — editorial, cantos retos, acento cobre único

/** Fundo do conteúdo central */
export const ORION_CANVAS = 'bg-fundo text-ink'

/** Tipografia base */
export const ORION_TEXT_PRIMARY = 'text-ink'
export const ORION_TEXT_SECONDARY = 'text-ink-muted'

/** Menu lateral, footer e superfícies chrome */
export const ORION_CHROME_PLANE = 'bg-chrome'

/** Plano de navegação lateral */
export const ORION_NAV_PLANE =
  `${ORION_CHROME_PLANE} border-r border-line`

/** Rodapé de sistema */
export const ORION_FOOTER_PLANE =
  `${ORION_CHROME_PLANE} border-t border-line`

/** Botão de ação rápida no header */
export const ORION_HEADER_ACTION =
  'p-2.5 rounded-sl bg-chrome hover:bg-elevated border border-line transition-colors text-ink-muted hover:text-ink'

/** Padding inferior do main — barra mobile + safe area iOS */
export const ORION_MAIN_PB_MOBILE =
  'pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] md:pb-8'

/** Painel com borda fina — sem glassmorphism */
export const ORION_BORDERLESS_PANEL =
  'rounded-sl bg-card border border-line p-4'

/** Card analytics */
export const ORION_ANALYTICS_CARD = ORION_BORDERLESS_PANEL

/** Card premium Kanban */
export const ORION_KANBAN_CARD =
  'rounded-sl bg-card border border-line p-3 transition-colors hover:border-ink-muted/40 cursor-pointer'

/** Ilha visual suave @deprecated prefer ORION_BORDERLESS_PANEL */
export const ORION_SOFT_CARD = ORION_BORDERLESS_PANEL

/** Bloco da rail lateral */
export const ORION_RAIL_BLOCK = 'py-4 last:pb-0'

/** Título de seção — mono editorial */
export const ORION_SECTION_TITLE =
  'font-mono text-[10px] uppercase tracking-[0.14em] font-medium text-ink-muted'

/** Divisor interno de listas */
export const ORION_LINE = 'border-b border-line'

/** Barra de progresso — acento sólido, sem gradiente */
export const ORION_PROGRESS = 'bg-accent'

/** Barra de progresso grossa — métricas de saúde */
export const ORION_PROGRESS_THICK = 'h-2 rounded-sl overflow-hidden bg-chrome'

/** Pílula de filtro temporal — retangular */
export const ORION_FILTER_PILL =
  'px-3 py-1.5 rounded-sl text-[12px] font-medium transition-colors border font-mono'

export const ORION_FILTER_PILL_ACTIVE =
  `${ORION_FILTER_PILL} bg-accent-muted border-accent/40 text-accent`

export const ORION_FILTER_PILL_IDLE =
  `${ORION_FILTER_PILL} bg-transparent border-transparent text-ink-muted hover:bg-chrome`

/** Avatar tipográfico — sem glow nem gradiente */
export const ORION_AVATAR =
  'w-14 h-14 shrink-0 rounded-sl flex items-center justify-center bg-chrome border border-line'

export const ORION_AVATAR_INITIALS =
  'text-xl font-mono font-semibold text-accent select-none'

/** @deprecated use ORION_AVATAR */
export const ORION_AVATAR_RING = ORION_AVATAR

/** Item de nav ativo */
export const ORION_NAV_ACTIVE =
  'text-ink bg-accent-muted border-l-2 border-accent'

/** Item de nav inativo */
export const ORION_NAV_IDLE =
  'text-ink-muted border-l-2 border-transparent hover:bg-chrome hover:text-ink'

/** Alvo de toque mínimo (iOS HIG) */
export const ORION_TOUCH_ROW = 'min-h-[44px] py-3'

/** Gap vertical mobile */
export const ORION_STACK_GAP = 'gap-6'

/** Botão primário */
export const ORION_BTN_PRIMARY =
  'bg-accent hover:bg-accent-hover text-white font-medium rounded-sl transition-colors'

/** Link discreto */
export const ORION_LINK =
  'text-ink-muted hover:text-accent transition-colors'

/** Linha interativa (listas, tabelas) */
export const ORION_ROW_HOVER =
  'hover:bg-chrome transition-colors'

/** Menu suspenso */
export const ORION_DROPDOWN =
  'bg-card border border-line rounded-sl shadow-sm overflow-hidden'

/** Número KPI grande */
export const ORION_DISPLAY_STAT =
  'text-2xl font-display tabular-nums text-ink'

/** Separador de seção no dashboard */
export const ORION_SECTION_DIVIDER = 'border-t border-line pt-8'

/** @deprecated use ORION_SOFT_CARD */
export const ORION_SURFACE = ORION_SOFT_CARD
export const ORION_FINANCE_SURFACE = ORION_SOFT_CARD
export const ORION_SECTION_PAD = ''
