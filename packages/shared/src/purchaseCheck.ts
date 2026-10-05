/**
 * Checagem de compra: antes de salvar um gasto, o app refaz a conta do mês com ele
 * (e dos próximos meses, quando há parcelas). Lógica pura, sem IA decidindo.
 *
 * Mês atual: a sobra da projeção do fim do mês (monthEndProjection) menos o que a compra tira neste mês.
 * Meses seguintes: renda mensal prevista − contas fixas − o que já está lançado para aquele mês
 *                  (parcelas, boletos) − gasto médio do dia a dia × dias do mês − a parcela nova.
 *
 * O app avisa e pede confirmação; não proíbe. A decisão final é da pessoa.
 */
import type { FinanceTx } from './finance'
import type { ContaFixa } from './financeAccounts'
import type { MonthProjection } from './financeProjection'
import { localTodayIso } from './dates'

/** Cada lançamento que a compra vai criar (uma linha por parcela). */
export type PurchaseLaunch = { valor: number; data: string }

export type PurchaseCheckInput = {
  ref?: Date
  /** projeção do mês atual, sem a compra */
  projection: MonthProjection
  launches: PurchaseLaunch[]
  /** compra no crédito: sai da conta no vencimento da fatura */
  credito?: { diaVencimento: number } | null
  txs: FinanceTx[]
  fixas: ContaFixa[]
  /** quanto entra por mês (salário líquido previsto ou média das receitas); null = não sabemos */
  rendaMensal: number | null
}

export type PurchaseMonth = {
  ym: string
  /** quanto a compra tira deste mês */
  impacto: number
  sobraAntes: number
  sobraDepois: number
  /** abaixo disso o mês fica "no limite" */
  colchao: number
}

export type PurchaseCheckTom = 'tranquilo' | 'atencao' | 'apertado' | 'sem-dados'

export type PurchaseCheck = {
  tom: PurchaseCheckTom
  /** meses que a compra toca, em ordem */
  meses: PurchaseMonth[]
  /** o mês que fica pior depois da compra */
  pior: PurchaseMonth | null
  /** meses futuros que não deu para avaliar (sem renda cadastrada) */
  semRenda: string[]
}

export type SpendGuardLevel = 'avisar' | 'firme' | 'desligado'

export const SPEND_GUARD_LEVELS: { id: SpendGuardLevel; label: string; hint: string }[] = [
  { id: 'avisar', label: 'Avisar', hint: 'Quando um gasto apertar o mês, o app mostra a conta e pergunta se você quer salvar.' },
  { id: 'firme', label: 'Firme', hint: 'Mesmo aviso, e o botão de salvar só libera depois de alguns segundos, como um respiro.' },
  { id: 'desligado', label: 'Desligado', hint: 'Nenhum aviso antes de salvar. A conta do mês continua na Carteira.' },
]

/** segundos de espera do modo Firme antes de liberar "Salvar mesmo assim" */
export const SPEND_GUARD_FIRM_SECONDS = 5

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

const round2 = (n: number) => Math.round(n * 100) / 100

function nextYm(ym: string): string
{
  const [y, m] = ym.split('-').map(Number)
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
}

function daysInYm(ym: string): number
{
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

export function monthNamePt(ym: string): string
{
  return MONTHS[Number(ym.slice(5, 7)) - 1] ?? ym
}

/**
 * Em que mês o lançamento sai da conta. Débito/pix: no mês da data (data passada pesa agora).
 * Crédito: na fatura do mês; comprado depois do vencimento, vai para a fatura do mês seguinte.
 */
export function launchCashYm(l: PurchaseLaunch, thisYm: string, credito?: { diaVencimento: number } | null): string
{
  let ym = l.data.slice(0, 7)
  if (credito && Number(l.data.slice(8, 10)) > credito.diaVencimento) ym = nextYm(ym)
  return ym < thisYm ? thisYm : ym
}

/** Sobra prevista de um mês futuro, antes da compra nova. */
export function futureMonthSobra(
  ym: string,
  input: { txs: FinanceTx[]; fixas: ContaFixa[]; rendaMensal: number; mediaDiaria: number },
): number
{
  const fixas = input.fixas.filter((f) => f.ativa).reduce((a, f) => a + f.valor, 0)
  // já lançado para aquele mês: parcelas de cartão, boletos, contas agendadas (fixas contam acima)
  const comprometido = input.txs
    .filter((t) => t.tipo === 'despesa' && !t.fixaId && String(t.data).slice(0, 7) === ym)
    .reduce((a, t) => a + (Number(t.valor) || 0), 0)
  const extras = input.txs
    .filter((t) => t.tipo === 'receita' && String(t.data).slice(0, 7) === ym)
    .reduce((a, t) => a + (Number(t.valor) || 0), 0)
  return round2(input.rendaMensal + extras - fixas - comprometido - input.mediaDiaria * daysInYm(ym))
}

export function checkPurchase(input: PurchaseCheckInput): PurchaseCheck
{
  const ref = input.ref ?? new Date()
  const thisYm = localTodayIso(ref).slice(0, 7)
  const p = input.projection
  const saldo = p.lines.find((l) => l.kind === 'saldo')?.valor ?? 0
  const temReceita = p.lines.some((l) => l.kind === 'receita')
  const semDados = saldo === 0 && !temReceita && input.rendaMensal == null && p.mediaDiaria === 0

  // quanto a compra tira de cada mês
  const porMes = new Map<string, number>()
  for (const l of input.launches)
  {
    if (!(l.valor > 0)) continue
    const ym = launchCashYm(l, thisYm, input.credito)
    porMes.set(ym, (porMes.get(ym) ?? 0) + l.valor)
  }
  if (semDados || porMes.size === 0) return { tom: 'sem-dados', meses: [], pior: null, semRenda: [] }

  const mediaDiaria = p.mediaDiaria
  const meses: PurchaseMonth[] = []
  const semRenda: string[] = []
  for (const ym of [...porMes.keys()].sort())
  {
    const impacto = round2(porMes.get(ym) ?? 0)
    if (ym === thisYm)
    {
      const colchao = Math.max(100, saldo * 0.1)
      meses.push({ ym, impacto, sobraAntes: p.sobra, sobraDepois: round2(p.sobra - impacto), colchao })
      continue
    }
    if (input.rendaMensal == null)
    {
      semRenda.push(ym)
      continue
    }
    const sobraAntes = futureMonthSobra(ym, { txs: input.txs, fixas: input.fixas, rendaMensal: input.rendaMensal, mediaDiaria })
    const colchao = Math.max(100, input.rendaMensal * 0.1)
    meses.push({ ym, impacto, sobraAntes, sobraDepois: round2(sobraAntes - impacto), colchao })
  }

  if (meses.length === 0) return { tom: 'sem-dados', meses, pior: null, semRenda }
  const pior = meses.reduce((a, b) => (b.sobraDepois < a.sobraDepois ? b : a))
  const tom: PurchaseCheckTom = meses.some((m) => m.sobraDepois < 0)
    ? 'apertado'
    : meses.some((m) => m.sobraDepois < m.colchao) ? 'atencao' : 'tranquilo'
  return { tom, meses, pior, semRenda }
}

/** Título e frase calma para o aviso (nunca "estourou"). */
export function purchaseCheckMessage(
  c: PurchaseCheck,
  fmt: (n: number) => string,
  ref = new Date(),
): { titulo: string; mensagem: string }
{
  const thisYm = localTodayIso(ref).slice(0, 7)
  const pior = c.pior
  if (!pior || c.tom === 'sem-dados')
  {
    return { titulo: 'Sem dados para a conta', mensagem: 'Cadastre seu saldo e salário na Carteira para o app avisar quando um gasto apertar o mês.' }
  }
  const quando = pior.ym === thisYm ? 'para fechar o mês' : `em ${monthNamePt(pior.ym)}`
  const apertados = c.meses.filter((m) => m.sobraDepois < 0)
  if (c.tom === 'apertado')
  {
    let mensagem = pior.ym === thisYm
      ? `Com esse gasto, faltariam ${fmt(Math.abs(pior.sobraDepois))} ${quando}.`
      : `Com as parcelas desse gasto, faltariam ${fmt(Math.abs(pior.sobraDepois))} ${quando}.`
    if (apertados.length > 1) mensagem += ` Ao todo, ${apertados.length} meses ficam no vermelho.`
    if (pior.sobraAntes < 0) mensagem += ' Esse mês já estava no limite antes dele.'
    else mensagem += ` Sem apertar, cabem até ${fmt(pior.sobraAntes)}.`
    return { titulo: 'Esse gasto aperta o mês', mensagem }
  }
  if (c.tom === 'atencao')
  {
    return {
      titulo: 'Cabe, mas deixa pouco',
      mensagem: `Depois dele, sobram só ${fmt(pior.sobraDepois)} ${pior.ym === thisYm ? 'no fim do mês' : `em ${monthNamePt(pior.ym)}`}.`,
    }
  }
  return {
    titulo: 'Cabe no mês',
    mensagem: `Depois dele, ainda sobram ${fmt(pior.sobraDepois)} ${pior.ym === thisYm ? 'no fim do mês' : `em ${monthNamePt(pior.ym)}`}.`,
  }
}

/** Dica embaixo do valor, antes de salvar: quanto ainda cabe neste mês fora o dia a dia. */
export function spendRoomHint(p: MonthProjection, fmt: (n: number) => string): string
{
  if (p.sobra < 0) return `O mês já está apertado: faltam ${fmt(Math.abs(p.sobra))} para fechar.`
  return `Fora o gasto do dia a dia, cabem até ${fmt(p.sobra)} até o fim do mês.`
}

/**
 * Lançamentos de uma compra parcelada, iguais aos que o app salva:
 * centavos divididos sem perder nada, um por mês a partir da data.
 * `pagas` = parcelas que já foram pagas antes de cadastrar (compra em andamento):
 * a primeira lançada é a pagas+1, na data informada.
 */
export function installmentPlan(input: {
  valor: number
  parcelas: number
  data: string
  /** valor digitado é de cada parcela (true) ou o total da compra (false) */
  porParcela?: boolean
  pagas?: number
}): { numero: number; total: number; valor: number; offset: number }[]
{
  const total = Math.max(1, Math.min(48, Math.round(input.parcelas)))
  const pagas = Math.max(0, Math.min(total - 1, Math.round(input.pagas ?? 0)))
  const cents = Math.round((input.porParcela ? input.valor * total : input.valor) * 100)
  const base = Math.floor(cents / total)
  const rem = cents - base * total
  const out: { numero: number; total: number; valor: number; offset: number }[] = []
  for (let i = pagas; i < total; i += 1)
  {
    out.push({ numero: i + 1, total, valor: (base + (i < rem ? 1 : 0)) / 100, offset: i - pagas })
  }
  return out
}
