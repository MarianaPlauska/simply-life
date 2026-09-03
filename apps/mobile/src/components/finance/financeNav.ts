export type FinanceMainTab = 'inicio' | 'movimentos' | 'contas' | 'analise'

export type MovimentosSubTab = 'diario' | 'lista' | 'planilha'

export type ContasSubTab = 'conta' | 'cartoes' | 'faturas' | 'contas-fixas'

export type AnaliseSubTab = 'visao-geral' | 'metas' | 'coach'

export const FINANCE_MAIN_TABS = [
  { id: 'inicio' as const, label: 'Início' },
  { id: 'movimentos' as const, label: 'Movimentos' },
  { id: 'contas' as const, label: 'Contas' },
  { id: 'analise' as const, label: 'Análise' },
]

export const MOVIMENTOS_SUB_TABS = [
  { id: 'diario' as const, label: 'Diário' },
  { id: 'lista' as const, label: 'Lista' },
  { id: 'planilha' as const, label: 'Planilha' },
]

export const CONTAS_SUB_TABS = [
  { id: 'conta' as const, label: 'Conta' },
  { id: 'cartoes' as const, label: 'Cartões' },
  { id: 'faturas' as const, label: 'A pagar' },
  { id: 'contas-fixas' as const, label: 'Fixas' },
]

export const ANALISE_SUB_TABS = [
  { id: 'visao-geral' as const, label: 'Visão' },
  { id: 'metas' as const, label: 'Metas' },
  { id: 'coach' as const, label: 'Coach' },
]
