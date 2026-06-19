// Tokens Instrumento — editorial, cantos retos, acento cobre único

/** Fundo do conteúdo central */
export const AXEL_CANVAS = 'bg-fundo text-ink'

/** Tipografia base */
export const AXEL_TEXT_PRIMARY = 'text-ink'
export const AXEL_TEXT_SECONDARY = 'text-ink-muted'

/** Menu lateral, footer e superfícies chrome */
export const AXEL_CHROME_PLANE = 'bg-chrome'

/** Plano de navegação lateral */
export const AXEL_NAV_PLANE =
  `${AXEL_CHROME_PLANE} border-r border-line`

/** Rodapé de sistema */
export const AXEL_FOOTER_PLANE =
  `${AXEL_CHROME_PLANE} border-t border-line`

/** Botão de ação rápida no header */
export const AXEL_HEADER_ACTION =
  'p-2.5 rounded-sl bg-chrome hover:bg-elevated border border-line transition-colors text-ink-muted hover:text-ink'

/** Padding inferior do main — barra mobile + safe area iOS */
export const AXEL_MAIN_PB_MOBILE =
  'pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] md:pb-8'

/** Rodapé de drawer/modal acima da bottom nav no mobile */
export const AXEL_DRAWER_FOOTER_PB_MOBILE =
  'pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-3'

/** Respiro superior abaixo do header global */
export const AXEL_MAIN_PT =
  'pt-4 sm:pt-5 md:pt-6'

/** Painel com borda fina — sem glassmorphism */
export const AXEL_BORDERLESS_PANEL =
  'rounded-sl bg-card border border-line p-4'

/** Card analytics */
export const AXEL_ANALYTICS_CARD = AXEL_BORDERLESS_PANEL

/** Card premium Kanban */
export const AXEL_KANBAN_CARD =
  'rounded-sl bg-card border border-line p-3 transition-colors hover:border-ink-muted/40 cursor-pointer'

/** Ilha visual suave @deprecated prefer AXEL_BORDERLESS_PANEL */
export const AXEL_SOFT_CARD = AXEL_BORDERLESS_PANEL

/** Bloco da rail lateral */
export const AXEL_RAIL_BLOCK = 'py-4 last:pb-0'

/** Título de seção — mono editorial */
export const AXEL_SECTION_TITLE =
  'font-mono text-[11px] uppercase tracking-[0.1em] font-semibold text-ink'

/** Divisor interno de listas */
export const AXEL_LINE = 'border-b border-line'

/** Barra de progresso — acento sólido, sem gradiente */
export const AXEL_PROGRESS = 'bg-accent'

/** Barra de progresso grossa — métricas de saúde */
export const AXEL_PROGRESS_THICK = 'h-2 rounded-sl overflow-hidden bg-chrome'

/** Pílula de filtro temporal — retangular */
export const AXEL_FILTER_PILL =
  'px-3 py-1.5 rounded-sl text-[12px] font-medium transition-colors border font-mono'

export const AXEL_FILTER_PILL_ACTIVE =
  `${AXEL_FILTER_PILL} bg-accent-muted border-accent/40 text-accent`

export const AXEL_FILTER_PILL_IDLE =
  `${AXEL_FILTER_PILL} bg-transparent border-transparent text-ink-muted hover:bg-chrome`

/** Avatar tipográfico — sem glow nem gradiente */
export const AXEL_AVATAR =
  'w-14 h-14 shrink-0 rounded-sl flex items-center justify-center bg-chrome border border-line'

export const AXEL_AVATAR_INITIALS =
  'text-xl font-mono font-semibold text-ink select-none'

/** @deprecated use AXEL_AVATAR */
export const AXEL_AVATAR_RING = AXEL_AVATAR

/** Item de nav ativo */
export const AXEL_NAV_ACTIVE =
  'text-ink bg-accent-muted border-l-2 border-accent'

/** Item de nav inativo */
export const AXEL_NAV_IDLE =
  'text-ink-muted border-l-2 border-transparent hover:bg-chrome hover:text-ink'

/** Alvo de toque mínimo (iOS HIG) */
export const AXEL_TOUCH_ROW = 'min-h-[44px] py-3'

/** Gap vertical mobile */
export const AXEL_STACK_GAP = 'gap-6'

/** Botão primário */
export const AXEL_BTN_PRIMARY =
  'bg-accent hover:bg-accent-hover text-white font-medium rounded-sl transition-colors'

/** Link discreto */
export const AXEL_LINK =
  'text-ink-muted hover:text-accent transition-colors'

/** Linha interativa (listas, tabelas) */
export const AXEL_ROW_HOVER =
  'hover:bg-chrome transition-colors'

/** Menu suspenso */
export const AXEL_DROPDOWN =
  'bg-card border border-line rounded-sl shadow-sm overflow-hidden'

/** Número KPI grande */
export const AXEL_DISPLAY_STAT =
  'text-2xl font-display tabular-nums text-ink'

/** Separador de seção no dashboard */
export const AXEL_SECTION_DIVIDER = 'border-t border-line pt-8'

/** @deprecated use AXEL_SOFT_CARD */
export const AXEL_SURFACE = AXEL_SOFT_CARD
export const AXEL_FINANCE_SURFACE = AXEL_SOFT_CARD
export const AXEL_SECTION_PAD = ''
