import { computeCashPosition } from './financeReservedBills'
import type { CashAccountSettings, ReservedBill, Transaction } from '../store/storeTypes'

export interface ReconciliationSnapshot
{
  saldoCalculado: number
  saldoDisponivel: number
  saldoBanco: number | null
  delta: number | null
  absDelta: number | null
  alinhado: boolean
  atualizadoEm: string | null
  axelHeadline: string
  axelDetail: string
}

const TOLERANCE = 0.02

export function buildReconciliationSnapshot(
  transactions: Transaction[],
  cashAccount: CashAccountSettings,
  reservedBills: ReservedBill[],
): ReconciliationSnapshot
{
  const position = computeCashPosition(
    transactions,
    cashAccount.saldo_inicial,
    reservedBills,
  )

  const saldoBanco = cashAccount.saldo_banco ?? null
  const delta = saldoBanco != null
    ? saldoBanco - position.saldoDisponivel
    : null
  const absDelta = delta != null ? Math.abs(delta) : null
  const alinhado = absDelta != null && absDelta <= TOLERANCE

  let axelHeadline = 'Bata o saldo com o banco'
  let axelDetail = 'Abra o app do banco e informe o saldo disponível aqui — leva 10 segundos e evita surpresas.'

  if (saldoBanco != null && alinhado)
  {
    axelHeadline = 'Tudo certo com o banco'
    axelDetail = `Seu app e o banco batem em ${fmt(saldoBanco)}. Continue lançando PIX e débito pagos.`
  }
  else if (saldoBanco != null && delta != null && delta > TOLERANCE)
  {
    axelHeadline = `Faltam ${fmt(delta)} no app`
    axelDetail = `O banco mostra mais dinheiro. Pode ser receita não lançada ou lançamento pendente que já saiu.`
  }
  else if (saldoBanco != null && delta != null && delta < -TOLERANCE)
  {
    axelHeadline = `Sobram ${fmt(Math.abs(delta))} no app`
    axelDetail = `O app calcula mais gastos que o banco. Revise lançamentos duplicados ou marque pendentes já pagos.`
  }

  return {
    saldoCalculado: position.saldoCorrente,
    saldoDisponivel: position.saldoDisponivel,
    saldoBanco,
    delta,
    absDelta,
    alinhado,
    atualizadoEm: cashAccount.saldo_banco_at ?? null,
    axelHeadline,
    axelDetail,
  }
}

function fmt(v: number): string
{
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
