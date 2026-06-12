import type { Category } from '../store/storeTypes'

export interface ParsedFinanceCapture
{
  tipo: 'despesa' | 'receita'
  valor: number
  descricao: string
}

const EXPENSE_RE = /^(?:gastei|gasto|paguei|comprei|-\s*)\s*(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:reais?)?\s*(?:no|na|em|de)?\s*(.+)?$/i
const INCOME_RE = /^(?:recebi|ganhei|entrou|sal[aá]rio|\+)\s*(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:reais?)?\s*(.+)?$/i
const SHORT_RE = /^([+-])\s*(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)\s+(.+)$/i

export function parseFinanceQuickCapture(raw: string): ParsedFinanceCapture | null
{
  const text = raw.trim()
  if (!text) return null

  const short = text.match(SHORT_RE)
  if (short)
  {
    const valor = parseValor(short[2])
    if (valor == null) return null
    return {
      tipo: short[1] === '+' ? 'receita' : 'despesa',
      valor,
      descricao: short[3].trim() || (short[1] === '+' ? 'Receita' : 'Gasto'),
    }
  }

  const income = text.match(INCOME_RE)
  if (income)
  {
    const valor = parseValor(income[1])
    if (valor == null) return null
    return {
      tipo: 'receita',
      valor,
      descricao: (income[2] || 'Receita').trim(),
    }
  }

  const expense = text.match(EXPENSE_RE)
  if (expense)
  {
    const valor = parseValor(expense[1])
    if (valor == null) return null
    return {
      tipo: 'despesa',
      valor,
      descricao: (expense[2] || 'Gasto').trim(),
    }
  }

  return null
}

function parseValor(raw: string): number | null
{
  const n = parseFloat(raw.replace(/\./g, '').replace(',', '.'))
  if (Number.isNaN(n) || n <= 0) return null
  return n
}

/** Sugere categoria por palavras-chave na descrição */
export function guessCategoryId(
  descricao: string,
  categories: Category[],
  tipo: 'despesa' | 'receita',
): number | undefined
{
  const q = descricao.toLowerCase()
  const pool = categories.filter((c) =>
    tipo === 'receita' ? c.tipo === 'receita' : c.tipo === 'despesa',
  )

  const rules: Array<{ keys: string[]; match: (c: Category) => boolean }> = [
    { keys: ['almoço', 'almoco', 'jantar', 'mercado', 'ifood', 'restaurante'], match: (c) => /aliment|mercado|comida/i.test(c.nome) },
    { keys: ['uber', '99', 'gasolina', 'combust'], match: (c) => /transport/i.test(c.nome) },
    { keys: ['netflix', 'spotify', 'assinatura'], match: (c) => /assin|lazer|stream/i.test(c.nome) },
    { keys: ['aluguel', 'condomínio', 'condominio'], match: (c) => /moradia|aluguel|habita/i.test(c.nome) },
    { keys: ['salário', 'salario', 'freelance', 'pix'], match: (c) => /sal[aá]rio|receita|renda/i.test(c.nome) },
  ]

  for (const rule of rules)
  {
    if (!rule.keys.some((k) => q.includes(k))) continue
    const hit = pool.find(rule.match)
    if (hit) return hit.id
  }

  return undefined
}

export function looksLikeFinanceCapture(raw: string): boolean
{
  return parseFinanceQuickCapture(raw) != null
}
