import { CHART_LIGHT, chartColor, type ChartPalette, type ChartSeries } from '@simply-life/ui-tokens'
import { LEGACY_FOLDER_HEX_TO_SERIES, seriesFromStored } from './taskPerformance'

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
  /** gasto lançado a partir de uma conta fixa (migração 061) */
  fixaId?: string
  /** parcelas da mesma compra compartilham este id (migração 061) */
  grupoParcela?: string
}

export interface CategorySpend
{
  categoria: FinanceCategory
  label: string
  total: number
  pct: number
  color: string
}

export type BuiltinFinanceCategory =
  | 'habitacao'
  | 'alimentacao'
  | 'transporte'
  | 'lazer'
  | 'saude'
  | 'educacao'
  | 'compras'
  | 'outros'

/**
 * Cor padrão de cada categoria como chave da paleta categórica (nunca hex):
 * a cor final depende do modo e sai de `financeCategoryColor(stored, chart, id)`.
 * As 8 categorias usam as 8 chaves, sem repetir. Coral é de ação e vermelho é
 * de erro, então nenhuma categoria usa esses tons.
 */
export const FINANCE_CATEGORY_SERIES: Readonly<Record<BuiltinFinanceCategory, ChartSeries>> = {
  habitacao: 'blue', // casa: tom estável e calmo
  alimentacao: 'green', // comida fresca; bem longe do coral de ação
  transporte: 'amber', // já era dourado
  lazer: 'violet', // diversão
  saude: 'teal', // convenção de saúde, sem cair no vermelho de alerta
  educacao: 'plum',
  compras: 'clay', // já era um marrom quente
  outros: 'slate', // neutro para o que sobra
}

/** Hex padrão antigo de cada categoria (antes da paleta). Só para ler dados antigos. */
export const LEGACY_FINANCE_CATEGORY_HEX: Readonly<Record<BuiltinFinanceCategory, string>> = {
  habitacao: '#8B9BA8',
  alimentacao: '#E8734A',
  transporte: '#C9A15C',
  lazer: '#7FA37A',
  saude: '#D47878',
  educacao: '#6B8CAE',
  compras: '#B8956B',
  outros: '#B0A89C',
}

/**
 * Hex antigo (amostras de finanças e padrão do banco) para chave, por semelhança
 * visual. Vale para categorias criadas pela pessoa e para contas fixas; o padrão
 * antigo de uma categoria embutida vai para o padrão novo dela (ver abaixo).
 */
export const LEGACY_FINANCE_HEX_TO_SERIES: Readonly<Record<string, ChartSeries>> = {
  ...LEGACY_FOLDER_HEX_TO_SERIES,
  '#8B9BA8': 'slate',
  '#C9A15C': 'amber',
  '#7FA37A': 'green',
  '#D47878': 'plum',
  '#6B8CAE': 'blue',
  '#B8956B': 'amber',
  '#B0A89C': 'slate',
  '#8B5CF6': 'violet', // DEFAULT das colunas `cor` no banco
}

export function isBuiltinFinanceCategory(id: unknown): id is BuiltinFinanceCategory
{
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(FINANCE_CATEGORY_SERIES, id)
}

/**
 * Chave de cor de uma categoria (ou conta fixa ligada a uma categoria) a partir do
 * valor guardado. Aceita chave, hex antigo ou hex qualquer; vazio usa o padrão da
 * categoria, ou `fallbackIndex` para categorias criadas pela pessoa.
 */
export function financeSeriesFromStored(
  stored: unknown,
  categoria?: string | null,
  fallbackIndex = 0,
): ChartSeries
{
  const cat = typeof categoria === 'string' ? categoria.toLowerCase() : ''
  const builtin = isBuiltinFinanceCategory(cat) ? cat : null
  if (builtin && typeof stored === 'string')
  {
    const t = stored.trim()
    const hex = (t.startsWith('#') ? t : `#${t}`).toUpperCase()
    if (hex === LEGACY_FINANCE_CATEGORY_HEX[builtin]) return FINANCE_CATEGORY_SERIES[builtin]
  }
  return seriesFromStored(
    stored,
    builtin ? FINANCE_CATEGORY_SERIES[builtin] : fallbackIndex,
    LEGACY_FINANCE_HEX_TO_SERIES,
  )
}

/** Cor da categoria no modo atual: passe `chart` de `useTheme()`. */
export function financeCategoryColor(
  stored: unknown,
  palette: ChartPalette,
  categoria?: string | null,
  fallbackIndex = 0,
): string
{
  return chartColor(palette, financeSeriesFromStored(stored, categoria, fallbackIndex))
}

/**
 * `colors` traz o valor guardado por categoria (chave ou hex antigo);
 * `palette` é `chart` de `useTheme()` (sem ele, usa a paleta clara).
 */
export function rankCategoriesBySpend(
  txs: FinanceTx[],
  colors?: Partial<Record<FinanceCategory, string>>,
  palette: ChartPalette = CHART_LIGHT,
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
    .sort((a, b) => b[1] - a[1])
    .map(([categoria, total], i) => ({
      categoria,
      label: FINANCE_CATEGORY_LABELS[categoria as keyof typeof FINANCE_CATEGORY_LABELS] ?? categoria,
      total,
      pct: sum > 0 ? Math.round((total / sum) * 100) : 0,
      color: financeCategoryColor(colors?.[categoria], palette, categoria, i),
    }))
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
