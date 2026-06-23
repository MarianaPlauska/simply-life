// Tokens Kanban — alta densidade, tokens globais light/dark

export const AXEL_KANBAN_PAGE = 'bg-fundo font-sans text-ink'
export const AXEL_KANBAN_GLOW = 'pointer-events-none absolute inset-0'

export const AXEL_KANBAN_WORKSPACE =
  'flex-1 min-h-[360px] max-h-[min(680px,calc(100vh-260px))] h-[min(680px,calc(100vh-260px))] border border-line rounded-lg bg-card shadow-sl overflow-hidden flex flex-col lg:flex-row'

export const AXEL_KANBAN_EXEC_COLUMN =
  'lg:w-[248px] lg:max-w-[260px] lg:shrink-0'

export const AXEL_KANBAN_DUE_SHELL =
  'flex-1 min-h-0 flex flex-col min-h-[280px]'

/** @deprecated Semana + Backlog — substituído por AXEL_KANBAN_DUE_SHELL */
export const AXEL_KANBAN_PLAN_SHELL =
  'flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] min-h-[280px]'

/** @deprecated use AXEL_KANBAN_WORKSPACE + AXEL_KANBAN_PLAN_SHELL */
export const AXEL_KANBAN_BOARD_SHELL = AXEL_KANBAN_PLAN_SHELL

export const AXEL_KANBAN_COLUMN_DIVIDER = 'border-r border-line last:border-r-0'

export const AXEL_KANBAN_COLUMN =
  'bg-chrome/40 border border-line rounded-lg flex flex-col min-h-0'

export const AXEL_KANBAN_COLUMN_EMBEDDED =
  'flex flex-col min-w-0 flex-1 min-h-0 bg-transparent'

export const AXEL_KANBAN_CARD =
  'bg-card border border-line rounded-lg shadow-sm transition-[border-color,box-shadow] duration-150'

export const AXEL_KANBAN_CARD_HOVER =
  'hover:border-zinc-300/60 dark:hover:border-white/12 hover:shadow-sl'

export const AXEL_KANBAN_CARD_FOCUS =
  'ring-1 ring-accent/40 border-accent/30 bg-accent-muted/20'

export const AXEL_KANBAN_CARD_INGEST =
  'ring-1 ring-accent/25 border-accent/25'

export const AXEL_KANBAN_TOOLBAR =
  'border-b border-line bg-chrome/30'

export const AXEL_KANBAN_COMMAND =
  'border border-line rounded-lg bg-card shadow-sl overflow-hidden'

export const AXEL_KANBAN_TABLE =
  'border border-line rounded-lg bg-card shadow-sl overflow-hidden'

export const AXEL_KANBAN_DROPZONE =
  'border border-dashed border-line rounded-lg bg-chrome/30 text-ink-muted'

export const AXEL_KANBAN_ACCENT = '#C17F3A'

/** @deprecated use AXEL_KANBAN_PAGE */
export const AXEL_KANBAN_CANVAS = AXEL_KANBAN_PAGE

/** @deprecated health bar fundida no command bar */
export const AXEL_KANBAN_HEALTH = AXEL_KANBAN_COMMAND
