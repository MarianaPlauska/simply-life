import type { ComponentType } from 'react'
import { BookOpen, CreditCard, Home, TrendingUp } from 'lucide-react'

export type PlannerGroup = 'inicio' | 'movimentos' | 'contas' | 'analise'

export type PlannerLeafTab =
  | 'inicio'
  | 'diario'
  | 'tabela'
  | 'planilha'
  | 'config'
  | 'cartoes'
  | 'faturas'
  | 'contas-fixas'
  | 'visao-geral'
  | 'metas'

export interface FinanceNavTab
{
  id: PlannerGroup
  label: string
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
}

export interface FinanceSubTab
{
  id: PlannerLeafTab
  label: string
}

export const FINANCE_MAIN_TABS: FinanceNavTab[] = [
  { id: 'inicio', label: 'Início', icon: Home },
  { id: 'movimentos', label: 'Movimentos', icon: BookOpen },
  { id: 'contas', label: 'Contas', icon: CreditCard },
  { id: 'analise', label: 'Análise', icon: TrendingUp },
]

export const FINANCE_SUB_TABS: Record<Exclude<PlannerGroup, 'inicio'>, FinanceSubTab[]> = {
  movimentos: [
    { id: 'diario', label: 'Diário' },
    { id: 'tabela', label: 'Lista' },
    { id: 'planilha', label: 'Planilha' },
  ],
  contas: [
    { id: 'config', label: 'Configurar' },
    { id: 'cartoes', label: 'Cartões' },
    { id: 'faturas', label: 'Faturas' },
    { id: 'contas-fixas', label: 'Fixas' },
  ],
  analise: [
    { id: 'visao-geral', label: 'Visão' },
    { id: 'metas', label: 'Metas' },
  ],
}

const DEFAULT_SUB: Record<Exclude<PlannerGroup, 'inicio'>, PlannerLeafTab> = {
  movimentos: 'diario',
  contas: 'config',
  analise: 'visao-geral',
}

const LEAF_TO_GROUP: Record<PlannerLeafTab, PlannerGroup> = {
  inicio: 'inicio',
  diario: 'movimentos',
  tabela: 'movimentos',
  planilha: 'movimentos',
  config: 'contas',
  cartoes: 'contas',
  faturas: 'contas',
  'contas-fixas': 'contas',
  'visao-geral': 'analise',
  metas: 'analise',
}

export function groupFromLeaf(leaf: PlannerLeafTab): PlannerGroup
{
  return LEAF_TO_GROUP[leaf]
}

export function defaultSubForGroup(group: PlannerGroup): PlannerLeafTab | null
{
  if (group === 'inicio') return 'inicio'
  return DEFAULT_SUB[group]
}

export function resolveLeafTab(group: PlannerGroup, sub: PlannerLeafTab | null): PlannerLeafTab
{
  if (group === 'inicio') return 'inicio'
  if (sub && LEAF_TO_GROUP[sub] === group) return sub
  return DEFAULT_SUB[group]
}

export function navigateToLeaf(leaf: PlannerLeafTab): { group: PlannerGroup; sub: PlannerLeafTab }
{
  const group = groupFromLeaf(leaf)
  return {
    group,
    sub: group === 'inicio' ? 'inicio' : leaf,
  }
}
