// Tokens Kanban Instrumento — densidade Linear, superfície unificada

export const ORION_KANBAN_PAGE = 'bg-fundo font-sans text-ink'
export const ORION_KANBAN_GLOW = 'pointer-events-none absolute inset-0'

/** Shell externo — painel Hoje + planejamento */
export const ORION_KANBAN_WORKSPACE =
  'flex-1 min-h-[440px] border border-line rounded-sl bg-card overflow-hidden flex flex-col lg:flex-row'

/** Colunas de planejamento (Semana + Backlog) */
export const ORION_KANBAN_PLAN_SHELL =
  'flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] min-h-[280px]'

/** @deprecated use ORION_KANBAN_WORKSPACE + ORION_KANBAN_PLAN_SHELL */
export const ORION_KANBAN_BOARD_SHELL = ORION_KANBAN_PLAN_SHELL

export const ORION_KANBAN_COLUMN_DIVIDER = 'border-r border-line last:border-r-0'

export const ORION_KANBAN_COLUMN =
  'bg-chrome/40 border border-line rounded-sl flex flex-col min-h-0'

export const ORION_KANBAN_COLUMN_EMBEDDED =
  'flex flex-col min-w-0 flex-1 min-h-0 bg-transparent'

export const ORION_KANBAN_CARD =
  'bg-elevated border border-line rounded-sl transition-[border-color,background-color] duration-150'

export const ORION_KANBAN_CARD_HOVER =
  'hover:border-ink-muted/60 hover:bg-card'

export const ORION_KANBAN_CARD_FOCUS =
  'ring-1 ring-accent/50 border-accent/60 bg-accent-muted/30'

export const ORION_KANBAN_CARD_INGEST =
  'ring-1 ring-accent/35 border-accent/40'

export const ORION_KANBAN_TOOLBAR =
  'border-b border-line bg-chrome/30'

export const ORION_KANBAN_COMMAND =
  'border border-line rounded-sl bg-card overflow-hidden'

export const ORION_KANBAN_TABLE =
  'border border-line rounded-sl bg-card overflow-hidden'

export const ORION_KANBAN_DROPZONE =
  'border border-dashed border-line rounded-sl bg-chrome/20 text-ink-muted'

export const ORION_KANBAN_ACCENT = '#C17F3A'

/** @deprecated use ORION_KANBAN_PAGE */
export const ORION_KANBAN_CANVAS = ORION_KANBAN_PAGE

/** @deprecated health bar fundida no command bar */
export const ORION_KANBAN_HEALTH = ORION_KANBAN_COMMAND
