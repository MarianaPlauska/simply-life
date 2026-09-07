export type FinanceCategory =
  | 'habitacao'
  | 'alimentacao'
  | 'transporte'
  | 'lazer'
  | 'saude'
  | 'educacao'
  | 'compras'
  | 'outros'
  | (string & {})

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

export type FinanceEscopo = 'pessoal' | 'casal'

export interface FinanceTx
{
  id: string
  titulo: string
  valor: number
  categoria: FinanceCategory
  data: string
  tipo: 'despesa' | 'receita'
  /** Cartão vinculado (fatura / quick spend) */
  cardId?: string
  /** pix | debito | dinheiro | boleto | cartao | ted | outro */
  formaPagamento?: string
  /** Pasta do Kanban — agrupa gastos relacionados */
  folderId?: string
  /** Casal = visível ao parceiro; pessoal = só o autor */
  escopo?: FinanceEscopo
  /** Gasto pessoal que saiu da conta compartilhada do casal */
  pagoContaCasal?: boolean
}

export interface CategorySpend
{
  categoria: FinanceCategory
  label: string
  total: number
  pct: number
  color: string
}

export const FINANCE_CATEGORY_COLORS: Record<FinanceCategory, string> = {
  habitacao: '#8B9BA8',
  alimentacao: '#E8734A',
  transporte: '#C9A15C',
  lazer: '#7FA37A',
  saude: '#D47878',
  educacao: '#6B8CAE',
  compras: '#B8956B',
  outros: '#B0A89C',
}

export function rankCategoriesBySpend(
  txs: FinanceTx[],
  colors?: Partial<Record<FinanceCategory, string>>,
): CategorySpend[]
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
      label: FINANCE_CATEGORY_LABELS[categoria as keyof typeof FINANCE_CATEGORY_LABELS] ?? categoria,
      total,
      pct: sum > 0 ? Math.round((total / sum) * 100) : 0,
      color: colors?.[categoria] || FINANCE_CATEGORY_COLORS[categoria as keyof typeof FINANCE_CATEGORY_COLORS] || '#B0A89C',
    }))
    .sort((a, b) => b.total - a.total)
}

export function formatBRL(value: number | null | undefined): string
{
  const n = Number(value ?? 0)
  const safe = Number.isFinite(n) ? n : 0
  return safe.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function monthExpenseTotal(txs: FinanceTx[] | null | undefined): number
{
  return (txs ?? [])
    .filter((t) => t?.tipo === 'despesa')
    .reduce((a, t) => a + (Number(t?.valor) || 0), 0)
}

export function monthIncomeTotal(txs: FinanceTx[] | null | undefined): number
{
  return (txs ?? [])
    .filter((t) => t?.tipo === 'receita')
    .reduce((a, t) => a + (Number(t?.valor) || 0), 0)
}

/** Série diária de despesas do mês corrente - sparkline da Home */
export function monthDailyExpenseSeries(
  txs: FinanceTx[] | null | undefined,
  now = new Date(),
): { day: number; total: number }[]
{
  const y = now.getFullYear()
  const m = now.getMonth()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const totals = new Array<number>(daysInMonth).fill(0)
  for (const t of txs ?? [])
  {
    if (t?.tipo !== 'despesa') continue
    const d = String(t.data || '').slice(0, 10)
    if (d.length < 10) continue
    const dt = new Date(`${d}T12:00:00`)
    if (dt.getFullYear() !== y || dt.getMonth() !== m) continue
    const day = dt.getDate()
    totals[day - 1] += Number(t.valor) || 0
  }
  return totals.map((total, i) => ({ day: i + 1, total }))
}
