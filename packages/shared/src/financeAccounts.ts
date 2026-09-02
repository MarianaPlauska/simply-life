import { formatBRL, monthExpenseTotal, monthIncomeTotal, type FinanceTx } from './finance'

export interface CashAccount
{
  saldoInicial: number
}

export type FinanceCardGradient = 'purple' | 'obsidian' | 'sunset' | 'ocean' | 'mint' | 'copper'

export interface FinanceCard
{
  id: string
  nome: string
  limite: number
  diaVencimento: number
  status: 'ativo' | 'bloqueado'
  bandeira: 'visa' | 'mastercard'
  tipoGradiente?: FinanceCardGradient
  numeroMascarado?: string
  titular?: string
  faturaAberta?: number
}

export interface ContaFixa
{
  id: number
  nome: string
  valor: number
  diaVencimento: number
  categoria: string
  ativa: boolean
}

export interface ContaAPagar
{
  id: number
  titulo: string
  valor: number
  vencimento: string
  status: 'aberta' | 'paga'
}

export interface FinanceGoal
{
  id: number
  titulo: string
  meta: number
  atual: number
}

export function demoCashAccount(): CashAccount
{
  return { saldoInicial: 4200 }
}

export function demoFinanceCards(): FinanceCard[]
{
  return [
    {
      id: 'c1',
      nome: 'Nubank',
      limite: 8000,
      diaVencimento: 12,
      status: 'ativo',
      bandeira: 'mastercard',
      tipoGradiente: 'purple',
      numeroMascarado: '•••• 4821',
      titular: 'Titular',
      faturaAberta: 1240,
    },
    {
      id: 'c2',
      nome: 'Inter',
      limite: 3500,
      diaVencimento: 5,
      status: 'ativo',
      bandeira: 'visa',
      tipoGradiente: 'ocean',
      numeroMascarado: '•••• 9034',
      titular: 'Titular',
      faturaAberta: 680,
    },
  ]
}

export function demoContasFixas(): ContaFixa[]
{
  return [
    { id: 1, nome: 'Aluguel', valor: 2200, diaVencimento: 5, categoria: 'habitacao', ativa: true },
    { id: 2, nome: 'Internet', valor: 120, diaVencimento: 10, categoria: 'outros', ativa: true },
    { id: 3, nome: 'Academia', valor: 99, diaVencimento: 15, categoria: 'saude', ativa: true },
  ]
}

export function demoContasAPagar(): ContaAPagar[]
{
  return [
    { id: 1, titulo: 'Energia', valor: 185, vencimento: '2026-09-05', status: 'aberta' },
    { id: 2, titulo: 'Cartão Nubank', valor: 1240, vencimento: '2026-09-12', status: 'aberta' },
    { id: 3, titulo: 'Condomínio', valor: 420, vencimento: '2026-08-28', status: 'paga' },
  ]
}

export function demoFinanceGoals(): FinanceGoal[]
{
  return [
    { id: 1, titulo: 'Reserva de emergência', meta: 15000, atual: 6200 },
    { id: 2, titulo: 'Viagem', meta: 5000, atual: 1800 },
  ]
}

export function computeSaldoDisponivel(
  cash: CashAccount,
  txs: FinanceTx[],
  fixas: ContaFixa[],
): { disponivel: number; receitas: number; despesas: number; fixasMes: number }
{
  const receitas = monthIncomeTotal(txs)
  const despesas = monthExpenseTotal(txs)
  const fixasMes = fixas.filter((c) => c.ativa).reduce((acc, c) => acc + c.valor, 0)
  const disponivel = cash.saldoInicial + receitas - despesas
  return { disponivel, receitas, despesas, fixasMes }
}

export function formatSaldo(value: number): string
{
  return formatBRL(value)
}
