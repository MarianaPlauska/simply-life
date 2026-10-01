export type FinanceMainTab = 'inicio' | 'movimentos' | 'contas' | 'analise'

export type MovimentosSubTab = 'diario' | 'lista' | 'planilha' | 'pastas'

export type ContasSubTab = 'conta' | 'salario' | 'cartoes' | 'faturas' | 'contas-fixas'

export type AnaliseSubTab = 'visao-geral' | 'orcamentos' | 'metas' | 'coach'

import type { AppModuleId } from '../../lib/appModules'

type On = (id: AppModuleId) => boolean

/** Carteira, Extrato e Análise são de Gastos; Contas junta conta, cartões e fixas. */
export function visibleFinanceTabs(on: On)
{
  return FINANCE_MAIN_TABS.filter((t) =>
    t.id === 'contas' ? on('spend') || on('cards') || on('bills')
      : t.id === 'analise' ? on('spend') || on('goals')
        : on('spend'))
}

export function visibleContasTabs(on: On)
{
  return CONTAS_SUB_TABS.filter((t) =>
    t.id === 'cartoes' ? on('cards')
      : t.id === 'faturas' || t.id === 'contas-fixas' ? on('bills')
        : on('spend'))
}

export function visibleAnaliseTabs(on: On)
{
  return ANALISE_SUB_TABS.filter((t) => (t.id === 'metas' ? on('goals') : on('spend')))
}

export const FINANCE_MAIN_TABS = [
  { id: 'inicio' as const, label: 'Carteira' },
  { id: 'movimentos' as const, label: 'Extrato' },
  { id: 'contas' as const, label: 'Contas' },
  { id: 'analise' as const, label: 'Análise' },
]

export const MOVIMENTOS_SUB_TABS = [
  { id: 'diario' as const, label: 'Hoje' },
  { id: 'lista' as const, label: 'Lista' },
  { id: 'planilha' as const, label: 'Planilha' },
  { id: 'pastas' as const, label: 'Pastas' },
]

export const CONTAS_SUB_TABS = [
  { id: 'conta' as const, label: 'Conta' },
  { id: 'salario' as const, label: 'Salário' },
  { id: 'cartoes' as const, label: 'Cartões' },
  { id: 'faturas' as const, label: 'A pagar' },
  { id: 'contas-fixas' as const, label: 'Fixas' },
]

export const ANALISE_SUB_TABS = [
  { id: 'visao-geral' as const, label: 'Visão' },
  { id: 'orcamentos' as const, label: 'Orçamentos' },
  { id: 'metas' as const, label: 'Metas' },
  { id: 'coach' as const, label: 'Coach' },
]
