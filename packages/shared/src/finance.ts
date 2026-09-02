export type FinanceCategory =
  | 'habitacao'
  | 'alimentacao'
  | 'transporte'
  | 'lazer'
  | 'saude'
  | 'educacao'
  | 'compras'
  | 'outros'

export const FINANCE_CATEGORY_LABELS: Record<FinanceCategory, string> = {
  habitacao: 'Moradia',
  alimentacao: 'Alimentação',
  transporte: 'Transporte',
  lazer: 'Lazer',
  saude: 'Saúde',
  educacao: 'Educação',
  compras: 'Compras',
  outros: 'Outros',
}

export interface FinanceTx
{
  id: string
  titulo: string
  valor: number
  categoria: FinanceCategory
  data: string
  tipo: 'despesa' | 'receita'
}

export interface CategorySpend
{
  categoria: FinanceCategory
  label: string
  total: number
  pct: number
  color: string
}

const CATEGORY_COLORS: Record<FinanceCategory, string> = {
  habitacao: '#8B9BA8',
  alimentacao: '#E8734A',
  transporte: '#C9A15C',
  lazer: '#7FA37A',
  saude: '#D47878',
  educacao: '#6B8CAE',
  compras: '#B8956B',
  outros: '#B0A89C',
}

export function rankCategoriesBySpend(txs: FinanceTx[]): CategorySpend[]
{
  const despesas = txs.filter((t) => t.tipo === 'despesa')
  const totals = new Map<FinanceCategory, number>()
  let sum = 0
  for (const t of despesas)
  {
    const prev = totals.get(t.categoria) ?? 0
    totals.set(t.categoria, prev + t.valor)
    sum += t.valor
  }
  return [...totals.entries()]
    .map(([categoria, total]) => ({
      categoria,
      label: FINANCE_CATEGORY_LABELS[categoria],
      total,
      pct: sum > 0 ? Math.round((total / sum) * 100) : 0,
      color: CATEGORY_COLORS[categoria],
    }))
    .sort((a, b) => b.total - a.total)
}

export function formatBRL(value: number): string
{
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function monthExpenseTotal(txs: FinanceTx[]): number
{
  return txs.filter((t) => t.tipo === 'despesa').reduce((a, t) => a + t.valor, 0)
}

export function monthIncomeTotal(txs: FinanceTx[]): number
{
  return txs.filter((t) => t.tipo === 'receita').reduce((a, t) => a + t.valor, 0)
}
