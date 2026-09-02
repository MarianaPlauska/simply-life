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
  `inline-flex items-center justify-center w-11 h-11 rounded-sl text-ink-muted hover:text-ink hover:bg-elevated ${AXEL_TOUCH_PRESS}`

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

/** Chip / micro-botão em painel */
export const AXEL_BENTO_CHIP =
  'bg-elevated border border-line rounded-sl transition-colors hover:bg-chrome dark:bg-card dark:border-line dark:hover:bg-chrome/80'

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
  'shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 text-[13px] font-sans transition-colors border-b-2 min-h-[44px]'

export const AXEL_NAV_SUB_ACTIVE =
  `${AXEL_NAV_SUB} border-axel text-ink font-semibold`

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

/** Item de nav ativo — faixa âmbar AXEL (marcador, não preenchimento) */
export const AXEL_NAV_ACTIVE =
  'text-ink bg-chrome border-l-[3px] border-axel rounded-r-sl-sm'

/** Item de nav inativo */
export const AXEL_NAV_IDLE =
  'text-ink-muted border-l-[3px] border-transparent hover:bg-chrome hover:text-ink rounded-r-sl-sm'

/** Alvo de toque mínimo (iOS HIG) */
export const AXEL_TOUCH_ROW = 'min-h-[44px] py-3'

/** Gap vertical mobile */
export const AXEL_STACK_GAP = 'gap-6'

/**
 * Escala de botão
 * sm — chips / linhas densas
 * md — CTA na tela (hug, 44px)
 * lg — folha/modal (largura total)
 */
export const AXEL_BTN_SM =
  'inline-flex items-center justify-center min-h-8 px-2.5 text-[12px]'

export const AXEL_BTN_MD =
  'inline-flex items-center justify-center min-h-11 px-4 text-[14px]'

export const AXEL_BTN_LG =
  'inline-flex items-center justify-center w-full min-h-11 px-4 py-2.5 text-[14px]'

/** CTA primário — tinta invertida. Laranja só na voz do AXEL. */
export const AXEL_BTN_PRIMARY =
  `bg-ink text-fundo hover:opacity-90 font-sans font-semibold rounded-sl ${AXEL_TOUCH_PRESS}`

/** CTA Executar — único botão na tinta da voz AXEL */
export const AXEL_BTN_EXECUTE =
  `bg-axel hover:bg-axel-hover text-[color:var(--sl-axel-on-fill)] font-sans font-semibold rounded-sl ${AXEL_TOUCH_PRESS}`

/** CTA compacto — modais e formulários */
export const AXEL_BTN_PRIMARY_COMPACT =
  `inline-flex items-center justify-center min-h-10 px-3 text-[12px] bg-ink text-fundo hover:opacity-90 font-sans font-semibold rounded-sl ${AXEL_TOUCH_PRESS}`

/** Busca / ação secundária — sem preenchimento de destaque */
export const AXEL_BTN_GHOST =
  `inline-flex items-center justify-center min-h-11 px-3 gap-2 border border-line bg-transparent text-ink hover:bg-chrome font-sans font-medium rounded-sl text-[13px] ${AXEL_TOUCH_PRESS}`

/** Link discreto */
export const AXEL_LINK =
  'text-ink-muted hover:text-ink transition-colors'

/** Linha interativa */
export const AXEL_ROW_HOVER =
  'hover:bg-chrome/80 transition-colors'

/** Menu suspenso */
export const AXEL_DROPDOWN =
  'bg-card border border-line rounded-sl-lg shadow-sl-lg overflow-hidden'

/** Número KPI grande */
export const AXEL_DISPLAY_STAT =
  'sl-metric text-ink'

/** Módulo de dado — faixa 2px à esquerda da seção */
export const MODULE_STRIP = {
  finance: 'border-l-2 border-finance pl-3',
  health: 'border-l-2 border-health pl-3',
  tasks: 'border-l-2 border-tasks pl-3',
} as const

/** Wash 8–14% só na linha do número */
export const MODULE_WASH = {
  finance: 'rounded-sl px-2 py-1.5 bg-finance-muted',
  health: 'rounded-sl px-2 py-1.5 bg-health-muted',
  tasks: 'rounded-sl px-2 py-1.5 bg-tasks-muted',
} as const

/** Tier 1 — um único dado herói por tela */
export const MODULE_SCREEN_HERO = {
  finance: 'sl-screen-hero text-finance',
  health: 'sl-screen-hero text-health',
  tasks: 'sl-screen-hero text-tasks',
  urgent: 'sl-screen-hero text-urgente',
} as const

/** Tier 2 — KPI com wash/legenda ao redor */
export const MODULE_HERO = {
  finance: 'sl-module-highlight text-finance',
  health: 'sl-module-highlight text-health',
  tasks: 'sl-module-highlight text-tasks',
} as const

/** Número secundária na cor do módulo */
export const MODULE_METRIC = {
  finance: 'sl-module-metric text-finance',
  health: 'sl-module-metric text-health',
  tasks: 'sl-module-metric text-tasks',
} as const

/** Separador de seção no dashboard */
export const AXEL_SECTION_DIVIDER = 'border-t border-line/80 pt-8'

/** Métrica / resumo — hairline, sem caixa fechada */
export const AXEL_METRIC_HAIRLINE =
  'border-t-[0.5px] border-line pt-3'

/** Recuo horizontal — o mesmo no header global e nas páginas */
export const AXEL_PAGE_GUTTER = 'px-3 sm:px-4 md:px-6 lg:px-8'
export const AXEL_PAGE_SHELL =
  'w-full max-w-none lg:max-w-[1400px] xl:max-w-[1600px] mx-auto'

/** Coluna de leitura — mobile/tablet; a partir de md preenche o main (sem cap 720) */
export const AXEL_PAGE_SHELL_READING =
  'w-full max-w-none mx-auto'

/** Diário / reflexão — coluna estreita no desktop (menos sobrecarga visual) */
export const AXEL_PAGE_SHELL_DIARY =
  'w-full max-w-3xl lg:max-w-5xl mx-auto'

/** Área de conteúdo das abas Hoje/Diário — preenche o viewport abaixo do header */
export const AXEL_HEALTH_TAB_BODY =
  'flex-1 py-3 sm:py-4 min-h-[calc(100dvh-12.5rem)]'

/** Workspace desktop — coluna principal + rail a partir de lg */
export const AXEL_DESKTOP_WORKSPACE =
  'lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:gap-6 xl:gap-8 lg:items-start lg:content-start'

/** Rail lateral do workspace — visível em lg+ */
export const AXEL_DESKTOP_RAIL = 'hidden lg:flex flex-col min-w-0 self-start gap-4'

/** Escopo visual premium — aplicar na raiz do Dashboard */
export const AXEL_DASHBOARD_SCOPE = 'sl-dashboard-scope'

/** Botão premium — 40px desktop / 44px mobile, radius 7px */
export const PREMIUM_BTN =
  'sl-btn active:scale-[0.98] transition-transform'

export const PREMIUM_BTN_GHOST =
  `${PREMIUM_BTN} bg-transparent text-ink hover:bg-chrome border-line`

export const PREMIUM_BTN_MODULE = {
  health: `${PREMIUM_BTN} bg-health-muted text-ink border-health/20 hover:opacity-90`,
  finance: `${PREMIUM_BTN} bg-finance-muted text-ink border-finance/20 hover:opacity-90`,
  tasks: `${PREMIUM_BTN} bg-tasks-muted text-ink border-tasks/20 hover:opacity-90`,
} as const

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
