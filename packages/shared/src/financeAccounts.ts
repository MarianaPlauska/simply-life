import { formatBRL, monthIncomeTotal, type FinanceTx } from './finance'
import { cashExpenseTotal, creditExpenseTotal } from './financeCash'
import { localTodayIso } from './dates'

export interface CashAccount
{
  saldoInicial: number
}

export type FinanceCardGradient =
  | 'purple'
  | 'obsidian'
  | 'sunset'
  | 'ocean'
  | 'mint'
  | 'copper'
  | 'wine'
  | 'green'
  | 'blue'
  | 'violet'
  | 'rose'

export interface FinanceCard
{
  id: string
  nome: string
  limite: number
  diaVencimento: number
  /** dia em que a fatura fecha; nele o disponível volta ao limite cheio se não houver parcelas */
  diaFechamento?: number
  /** valor extra por ciclo (chave AAAA-MM do início do ciclo); não muda o limite */
  adicionais?: Record<string, number>
  status: 'ativo' | 'bloqueado'
  bandeira: 'visa' | 'mastercard'
  tipoGradiente?: FinanceCardGradient
  numeroMascarado?: string
  titular?: string
  faturaAberta?: number
  /** Metadados de “cartão real” (edição local) */
  banco?: string
  enderecoCobranca?: string
  cep?: string
  validadeMesAno?: string
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

export function emptyCashAccount(): CashAccount
{
  return { saldoInicial: 0 }
}

export function emptyFinanceCards(): FinanceCard[]
{
  return []
}

export function demoFinanceCards(): FinanceCard[]
{
  return [
    {
      id: 'c1',
      nome: 'Cartão lilás',
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
      nome: 'Cartão azul',
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

/** Cartão plantado pelo modo demo — não entra em conta nova. */
export function isDemoFinanceCard(card: Pick<FinanceCard, 'id'>): boolean
{
  return card.id === 'c1' || card.id === 'c2'
}

export function demoContasFixas(): ContaFixa[]
{
  return [
    { id: 1, nome: 'Aluguel do quiosque', valor: 90, diaVencimento: 5, categoria: 'habitacao', ativa: true },
    { id: 2, nome: 'Revista mensal', valor: 19, diaVencimento: 10, categoria: 'outros', ativa: true },
    { id: 3, nome: 'Aula de origami', valor: 33, diaVencimento: 15, categoria: 'saude', ativa: true },
  ]
}

export function demoContasAPagar(): ContaAPagar[]
{
  return [
    { id: 1, titulo: 'Luz do galpão', valor: 47, vencimento: '2026-09-05', status: 'aberta' },
    { id: 2, titulo: 'Fatura do cartão lilás', valor: 86, vencimento: '2026-09-12', status: 'aberta' },
    { id: 3, titulo: 'Taxa do clube de xadrez', valor: 25, vencimento: '2026-08-28', status: 'paga' },
  ]
}

export function demoFinanceGoals(): FinanceGoal[]
{
  return [
    { id: 1, titulo: 'Estante de quadrinhos', meta: 400, atual: 80 },
    { id: 2, titulo: 'Viagem de barco', meta: 260, atual: 40 },
  ]
}

export function computeSaldoDisponivel(
  cash: CashAccount,
  txs: FinanceTx[],
  fixas: ContaFixa[],
  ref = new Date(),
): {
  disponivel: number
  receitas: number
  despesas: number
  fixasMes: number
  creditoAberto: number
}
{
  // lançamento com data futura (parcela de boleto, conta de amanhã) ainda não saiu da conta:
  // entra na projeção do fim do mês, não no saldo de hoje
  const today = localTodayIso(ref)
  txs = txs.filter((t) => !t.data || String(t.data).slice(0, 10) <= today)
  const receitas = monthIncomeTotal(txs)
  // Débito sai na hora; crédito só depois de pagar a fatura (lançamento “Fatura …”).
  const despesas = cashExpenseTotal(txs)
  const creditoAberto = creditExpenseTotal(txs)
  const fixasMes = fixas.filter((c) => c.ativa).reduce((acc, c) => acc + c.valor, 0)
  const disponivel = cash.saldoInicial + receitas - despesas
  return { disponivel, receitas, despesas, fixasMes, creditoAberto }
}

export function formatSaldo(value: number): string
{
  return formatBRL(value)
}
