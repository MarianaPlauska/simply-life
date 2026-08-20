// Tokens — grafite neutro, densidade alta no Kanban

/** Fundo do conteúdo central */
export const AXEL_CANVAS = 'bg-fundo text-ink'

/** Tipografia base */
export const AXEL_TEXT_PRIMARY = 'text-ink'
export const AXEL_TEXT_SECONDARY = 'text-ink-muted'

/** Menu lateral, footer e superfícies chrome */
export const AXEL_CHROME_PLANE = 'bg-chrome'

/** Estúdio de vidro — header e bottom nav (conteúdo rola por baixo) */
export const AXEL_GLASS_CHROME =
  'bg-chrome border-line'

/** Resposta física ao toque — botões, chips e itens de menu */
export const AXEL_TOUCH_PRESS =
  'active:scale-95 transition-all duration-150 ease-out'

/** Plano de navegação lateral */
export const AXEL_NAV_PLANE =
  `${AXEL_CHROME_PLANE} border-r border-line`

/** Rodapé de sistema */
export const AXEL_FOOTER_PLANE =
  `${AXEL_CHROME_PLANE} border-t border-line`

/** Botão de ícone no header — só o glifo, sem caixa */
export const AXEL_HEADER_ACTION =
  `inline-flex items-center justify-center w-10 h-10 rounded-sl text-ink-muted hover:text-ink hover:bg-elevated ${AXEL_TOUCH_PRESS}`

/** Padding inferior do main — barra mobile + safe area iOS */
export const AXEL_MAIN_PB_MOBILE =
  'pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] md:pb-8'

/** Rodapé de drawer/modal acima da bottom nav no mobile */
export const AXEL_DRAWER_FOOTER_PB_MOBILE =
  'pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-3'

/** Respiro superior abaixo do header global */
export const AXEL_MAIN_PT =
  'pt-4 sm:pt-5 md:pt-6'

/** Painel Bento — branco puro sobre fundo cinza */
export const AXEL_BENTO_PANEL = 'sl-panel'

/** Chip / micro-botão em painel — branco no claro, superfície no escuro */
export const AXEL_BENTO_CHIP =
  'bg-white border border-zinc-200/80 rounded-sl shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors hover:bg-zinc-50 dark:bg-card dark:border-line dark:shadow-none dark:hover:bg-chrome/80'

/** Shell de segmentos (Gasto/Receita, etc.) */
export const AXEL_SEG_SHELL =
  'p-0.5 rounded-sl bg-chrome/70 dark:bg-chrome'

/** Input compacto em formulários financeiros */
export const AXEL_FIELD_INPUT =
  'border border-line rounded-sl bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-muted outline-none focus:border-accent/40'

/** Card analytics */
export const AXEL_ANALYTICS_CARD = `${AXEL_BENTO_PANEL} p-3 sm:p-4`

/** @deprecated use AXEL_BENTO_PANEL */
export const AXEL_BORDERLESS_PANEL = AXEL_ANALYTICS_CARD

/** Card premium Kanban — compacto no mobile */
export const AXEL_KANBAN_CARD =
  'rounded-lg bg-card border border-line shadow-sl p-2.5 sm:p-3 transition-all duration-200 hover:shadow-sl-lg cursor-pointer'

/** @deprecated prefer AXEL_BORDERLESS_PANEL */
export const AXEL_SOFT_CARD = AXEL_BORDERLESS_PANEL

/** Bloco da rail lateral */
export const AXEL_RAIL_BLOCK = 'py-4 last:pb-0'

/** Título de seção */
export const AXEL_SECTION_TITLE =
  'font-sans text-sm font-semibold tracking-tight text-ink'

/** Divisor interno de listas */
export const AXEL_LINE = 'border-b border-line/80'

/** Barra de progresso */
export const AXEL_PROGRESS = 'bg-health rounded-pill'

/** Barra de progresso grossa */
export const AXEL_PROGRESS_THICK = 'h-2 rounded-pill overflow-hidden bg-chrome'

/** Badge de status — legível em claro e escuro */
export const AXEL_STATUS_BADGE =
  'inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded border ' +
  'bg-chrome text-ink-muted border-line'

export const AXEL_STATUS_BADGE_WARN =
  'inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded border ' +
  'bg-amber-50 text-amber-800 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-500/20'

export const AXEL_STATUS_BADGE_URGENT =
  'inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded border ' +
  'bg-red-50 text-red-700 border-red-200/60 dark:bg-red-950/40 dark:text-red-300 dark:border-red-500/20'

/** Bloco de metadados em cards mobile */
export const AXEL_CARD_META =
  'mt-2 rounded-md bg-chrome/80 dark:bg-chrome/40 px-2.5 py-2 space-y-1 border border-line'

/** Alternador de vista — tátil no claro */
export const AXEL_VIEW_SWITCHER_SHELL =
  'inline-flex items-center gap-0.5 p-0.5 rounded-lg border border-line bg-chrome/80 ' +
  'dark:border-white/[0.08] dark:bg-chrome'

export const AXEL_VIEW_TAB_ACTIVE =
  'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-sans font-semibold transition-colors ' +
  'bg-elevated text-ink shadow-sm border border-line'

export const AXEL_VIEW_TAB_IDLE =
  'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-sans font-medium transition-colors ' +
  'text-ink-muted hover:text-ink hover:bg-chrome/60 border border-transparent'

/** Pílula de filtro — formato cápsula */
export const AXEL_FILTER_PILL =
  'px-3.5 py-1.5 rounded-pill text-[13px] font-medium transition-colors border font-sans'

export const AXEL_FILTER_PILL_ACTIVE =
  `${AXEL_FILTER_PILL} bg-accent-muted border-accent/30 text-accent shadow-sm`

export const AXEL_FILTER_PILL_IDLE =
  `${AXEL_FILTER_PILL} bg-transparent border-transparent text-ink-muted hover:bg-chrome/70 hover:text-ink hover:border-line ` +
  'dark:text-ink-muted dark:hover:bg-chrome dark:hover:text-ink dark:hover:border-line'

/** Segmento compacto — modais e formulários densos */
export const AXEL_SEG =
  'inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-sl font-mono text-[10px] uppercase tracking-wide transition-colors'

export const AXEL_SEG_ACTIVE =
  `${AXEL_SEG} bg-accent-muted text-accent border border-accent/30 min-h-[30px]`

export const AXEL_SEG_IDLE =
  `${AXEL_SEG} text-ink-muted border border-transparent ` +
  'hover:bg-chrome/70 hover:text-ink dark:hover:bg-chrome dark:hover:text-ink min-h-[30px]'

/** Nav principal (Início / Movimentos / Contas) — único nível com caixa accent */
export const AXEL_NAV_MAIN_ACTIVE =
  `bg-accent-muted text-accent border border-accent/30 ${AXEL_TOUCH_PRESS}`

export const AXEL_NAV_MAIN_IDLE =
  `text-ink-muted border border-transparent hover:bg-chrome hover:text-ink ${AXEL_TOUCH_PRESS}`

/** Sub-nav (Diário / Lista / Cartões) — texto + sublinhado, sem caixa */
export const AXEL_NAV_SUB =
  'shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 text-[13px] font-sans transition-colors border-b-2'

export const AXEL_NAV_SUB_ACTIVE =
  `${AXEL_NAV_SUB} border-ink text-ink font-semibold`

export const AXEL_NAV_SUB_IDLE =
  `${AXEL_NAV_SUB} border-transparent text-ink-muted hover:text-ink hover:border-line`

/** Chips de dia no diário — compactos */
export const AXEL_DAY_CHIP =
  'shrink-0 inline-flex items-center justify-center px-1.5 py-0.5 rounded-md font-mono text-[9px] uppercase tracking-wide transition-colors min-h-[22px]'

export const AXEL_DAY_CHIP_ACTIVE =
  `${AXEL_DAY_CHIP} text-accent font-semibold bg-accent/10 ring-1 ring-accent/25`

export const AXEL_DAY_CHIP_IDLE =
  `${AXEL_DAY_CHIP} text-ink-muted hover:text-ink hover:bg-chrome/60`

/** Segmentos em formulário (Gasto/Receita, categorias) — branco dentro do shell */
export const AXEL_FORM_SEG_ACTIVE =
  `${AXEL_SEG} bg-card dark:bg-card text-ink shadow-sm border border-line/70 min-h-[30px]`

export const AXEL_FORM_SEG_IDLE =
  `${AXEL_SEG_IDLE}`

/** Categoria selecionada no lançamento — destaque sutil */
export const AXEL_CHIP_SELECT_ACTIVE =
  `${AXEL_SEG} bg-accent/8 text-ink ring-1 ring-accent/35 min-h-[30px]`

export const AXEL_CHIP_SELECT_IDLE = AXEL_FORM_SEG_IDLE

/** Filtros da lista de lançamentos — sublinhado, sem caixa accent */
export const AXEL_LIST_FILTER =
  'shrink-0 px-2 py-1 font-mono text-[10px] uppercase tracking-wide transition-colors border-b-2 whitespace-nowrap'

export const AXEL_LIST_FILTER_ACTIVE =
  `${AXEL_LIST_FILTER} border-ink/45 text-ink font-semibold`

export const AXEL_LIST_FILTER_IDLE =
  `${AXEL_LIST_FILTER} border-transparent text-ink-muted hover:text-ink hover:border-line`

/** Avatar tipográfico */
export const AXEL_AVATAR =
  'w-14 h-14 shrink-0 rounded-sl-lg flex items-center justify-center bg-chrome border border-line shadow-sl'

export const AXEL_AVATAR_INITIALS =
  'text-xl font-sans font-semibold tracking-tight text-ink select-none'

/** @deprecated use AXEL_AVATAR */
export const AXEL_AVATAR_RING = AXEL_AVATAR

/** Item de nav ativo — faixa lateral arredondada */
export const AXEL_NAV_ACTIVE =
  'text-ink bg-chrome border-l-[3px] border-ink rounded-r-sl-sm'

/** Item de nav inativo */
export const AXEL_NAV_IDLE =
  'text-ink-muted border-l-[3px] border-transparent hover:bg-chrome hover:text-ink rounded-r-sl-sm'

/** Alvo de toque mínimo (iOS HIG) */
export const AXEL_TOUCH_ROW = 'min-h-[44px] py-3'

/** Gap vertical mobile */
export const AXEL_STACK_GAP = 'gap-6'

/** Botão primário — cream/grafite invertido, sem laranja */
export const AXEL_BTN_PRIMARY =
  `bg-ink text-fundo hover:opacity-90 font-sans font-semibold rounded-sl ${AXEL_TOUCH_PRESS}`

/** Botão primário compacto — modais e formulários */
export const AXEL_BTN_PRIMARY_COMPACT =
  `bg-ink text-fundo hover:opacity-90 font-sans font-semibold rounded-sl text-[12px] ${AXEL_TOUCH_PRESS}`

/** Link discreto */
export const AXEL_LINK =
  'text-ink-muted hover:text-accent transition-colors'

/** Linha interativa */
export const AXEL_ROW_HOVER =
  'hover:bg-chrome/80 transition-colors'

/** Menu suspenso */
export const AXEL_DROPDOWN =
  'bg-card border border-line rounded-sl-lg shadow-sl-lg overflow-hidden'

/** Número KPI grande */
export const AXEL_DISPLAY_STAT =
  'sl-metric text-ink'

/** Separador de seção no dashboard */
export const AXEL_SECTION_DIVIDER = 'border-t border-line/80 pt-8'

/** Métrica / resumo — hairline, sem caixa fechada */
export const AXEL_METRIC_HAIRLINE =
  'border-t-[0.5px] border-line pt-3'

/** Contêiner de página — desktop fluido; mobile sem restrição extra além do viewport */
export const AXEL_PAGE_SHELL =
  'w-full max-w-none lg:max-w-[1400px] xl:max-w-[1600px] mx-auto'

/** Coluna de leitura — Home, overview Finanças, Saúde */
export const AXEL_PAGE_SHELL_READING =
  'w-full max-w-[720px] mx-auto'

/** Kanban e boards — ocupa o main inteiro, sem cap de largura */
export const AXEL_PAGE_SHELL_FLUID =
  'w-full max-w-none mx-auto'

/** Mobile com coluna estreita (saúde, perfil) — só expande a partir de lg */
export const AXEL_PAGE_SHELL_MOBILE_NARROW =
  'w-full max-w-3xl lg:max-w-[1400px] xl:max-w-[1600px] mx-auto'

/** @deprecated use AXEL_SOFT_CARD */
export const AXEL_SURFACE = AXEL_SOFT_CARD
export const AXEL_FINANCE_SURFACE = AXEL_SOFT_CARD
export const AXEL_SECTION_PAD = ''
