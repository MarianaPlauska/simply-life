/**
 * Projeção do fim do mês (Etapa 2): "vai sobrar ~R$ X no dia 30" e
 * "quanto dá para gastar por dia, com calma". Um número, com a conta aberta ao tocar.
 *
 * sobra = saldo de hoje
 *       − contas fixas que ainda vencem e não foram pagas
 *       − faturas de cartão que ainda vencem neste mês
 *       + salário/receitas previstas que ainda entram neste mês
 *       − gasto do dia a dia (média recente, sem fixas e sem faturas) × dias que faltam
 */
import type { FinanceTx } from './finance'
import type { ContaFixa } from './financeAccounts'
import { hitsCashBalance, isFaturaSettlement, parseParcela } from './financeCash'
import { monthPaidKey } from './dayFocus'
import { localTodayIso } from './dates'
import { addDaysIso } from './taskPrompt'

export type ProjectionLine = {
  label: string
  /** positivo entra, negativo sai */
  valor: number
  kind: 'saldo' | 'fixa' | 'fatura' | 'receita' | 'variavel'
  /** dia previsto (ISO), quando faz sentido */
  data?: string
  /** id da conta fixa ou do cartão, para ações como "Já paguei" */
  refId?: string | number
}

export type MonthProjection = {
  sobra: number
  /** o que dá para gastar por dia até o fim do mês sem ficar no vermelho */
  porDia: number
  diasRestantes: number
  fimDoMes: string
  mediaDiaria: number
  lines: ProjectionLine[]
  tom: 'tranquilo' | 'atencao' | 'apertado'
  /** fixas que venceram neste mês sem marcação: perguntar "já pagou?" */
  vencidas: { fixaId: number; nome: string; valor: number; data: string }[]
}

export type ProjectionInput = {
  ref?: Date
  saldoDisponivel: number
  txs: FinanceTx[]
  fixas: ContaFixa[]
  /** chaves já pagas (monthPaidKey / invoicePaidKey) */
  paidKeys: Set<string> | Record<string, unknown>
  /** faturas a pagar neste mês (valor já calculado pelo app) */
  faturas: { cardId: string; nome: string; valor: number; diaVencimento: number }[]
  /** receitas previstas ainda não confirmadas (ex.: salário) */
  receitas: { label: string; valor: number; data: string }[]
  /** fixas vencidas que a pessoa disse que AINDA NÃO pagou: entram como a pagar */
  vencidasEmAberto?: (string | number)[]
}

const round2 = (n: number) => Math.round(n * 100) / 100

function norm(t: string): string
{
  return (t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

/**
 * Já existe um gasto deste mês que parece ser esta conta fixa? (lançado à mão, sem ligação)
 * Mesmo nome (um contém o outro) ou mesmo valor (±R$ 1), a partir de 10 dias antes do vencimento.
 */
export function fixaPaidByLooseMatch(f: ContaFixa, txs: FinanceTx[], ym: string, due: string): boolean
{
  const nome = norm(f.nome)
  const from = addDaysIso(due, -10)
  return txs.some((t) =>
  {
    if (t.tipo !== 'despesa' || !t.data.startsWith(ym) || t.data < from) return false
    const titulo = norm(t.titulo)
    const sameName = nome.length >= 3 && (titulo.includes(nome) || (titulo.length >= 3 && nome.includes(titulo)))
    // valor igual só vale perto do vencimento (uma compra qualquer de R$ 90 no mês não é a academia)
    const sameValue = Math.abs(t.valor - f.valor) <= 1 && t.data <= addDaysIso(due, 10)
    return sameName || sameValue
  })
}

/**
 * Média do gasto "do dia a dia" nos últimos 60 dias: só o que sai da conta
 * (não crédito, que entra na fatura), sem fixas lançadas e sem pagamento de fatura.
 * Os 5% de dias mais caros ficam de fora (uma compra grande não distorce a média).
 */
export function dailyVariableSpend(txs: FinanceTx[], ref = new Date(), days = 60): number
{
  const today = localTodayIso(ref)
  const from = addDaysIso(today, -days)
  const byDay = new Map<string, number>()
  for (const t of txs)
  {
    if (t.tipo !== 'despesa' || t.data < from || t.data >= today) continue
    if (!hitsCashBalance(t) || isFaturaSettlement(t) || t.fixaId) continue
    byDay.set(t.data, (byDay.get(t.data) ?? 0) + t.valor)
  }
  const values: number[] = []
  for (let d = from; d < today; d = addDaysIso(d, 1)) values.push(byDay.get(d) ?? 0)
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const keep = sorted.slice(0, Math.max(1, Math.ceil(sorted.length * 0.95)))
  return round2(keep.reduce((a, b) => a + b, 0) / keep.length)
}

export function monthEndProjection(input: ProjectionInput): MonthProjection
{
  const ref = input.ref ?? new Date()
  const today = localTodayIso(ref)
  const [y, m] = today.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  const fimDoMes = `${today.slice(0, 7)}-${String(lastDay).padStart(2, '0')}`
  const dayNum = Number(today.slice(8, 10))
  const diasRestantes = Math.max(1, lastDay - dayNum + 1)
  const paid = input.paidKeys instanceof Set ? input.paidKeys : new Set(Object.keys(input.paidKeys))
  const ym = today.slice(0, 7)
  const lines: ProjectionLine[] = [{ label: 'Saldo hoje', valor: round2(input.saldoDisponivel), kind: 'saldo' }]

  // fixas que ainda vencem neste mês, não pagas e sem lançamento ligado
  const lancadas = new Set(input.txs.filter((t) => t.fixaId && t.data.startsWith(ym)).map((t) => String(t.fixaId)))
  const emAberto = new Set((input.vencidasEmAberto ?? []).map(String))
  const vencidas: MonthProjection['vencidas'] = []
  for (const f of input.fixas)
  {
    if (!f.ativa) continue
    const due = `${ym}-${String(Math.min(f.diaVencimento, lastDay)).padStart(2, '0')}`
    if (paid.has(monthPaidKey('fixa', f.id, due)) || lancadas.has(String(f.id))) continue
    // lançada à mão sem ligação (ex.: "Aluguel 2.200" no extrato): conta como paga, sem perguntar
    if (fixaPaidByLooseMatch(f, input.txs, ym, due)) continue
    if (f.diaVencimento < dayNum)
    {
      // venceu e ninguém marcou: pode ter sido paga por fora. Só desconta se a pessoa disser "ainda não"
      if (emAberto.has(String(f.id)))
      {
        lines.push({ label: `${f.nome} (venceu dia ${f.diaVencimento})`, valor: -round2(f.valor), kind: 'fixa', data: due, refId: f.id })
      }
      else
      {
        vencidas.push({ fixaId: Number(f.id), nome: f.nome, valor: round2(f.valor), data: due })
      }
      continue
    }
    lines.push({ label: f.nome, valor: -round2(f.valor), kind: 'fixa', data: due, refId: f.id })
  }
  for (const fat of input.faturas)
  {
    if (fat.valor <= 0 || fat.diaVencimento < dayNum) continue
    const due = `${ym}-${String(Math.min(fat.diaVencimento, lastDay)).padStart(2, '0')}`
    if (paid.has(monthPaidKey('cartao', fat.cardId, due))) continue
    lines.push({ label: `Fatura ${fat.nome}`, valor: -round2(fat.valor), kind: 'fatura', data: due, refId: fat.cardId })
  }
  for (const r of input.receitas)
  {
    if (r.data < today || r.data > fimDoMes || r.valor <= 0) continue
    lines.push({ label: r.label, valor: round2(r.valor), kind: 'receita', data: r.data })
  }
  const mediaDiaria = dailyVariableSpend(input.txs, ref)
  if (mediaDiaria > 0)
  {
    lines.push({
      label: `Dia a dia (~${mediaDiaria.toFixed(0)}/dia × ${diasRestantes})`,
      valor: -round2(mediaDiaria * diasRestantes),
      kind: 'variavel',
    })
  }

  const sobra = round2(lines.reduce((s, l) => s + l.valor, 0))
  const semVariavel = sobra + (mediaDiaria > 0 ? round2(mediaDiaria * diasRestantes) : 0)
  const porDia = round2(Math.max(0, semVariavel / diasRestantes))
  const tom: MonthProjection['tom'] = sobra < 0
    ? 'apertado'
    : sobra < Math.max(100, input.saldoDisponivel * 0.1) ? 'atencao' : 'tranquilo'
  return { sobra, porDia, diasRestantes, fimDoMes, mediaDiaria, lines, tom, vencidas }
}

/** Parcelas/compras já lançadas para os próximos meses (compromisso futuro), por mês. */
export function futureCommitments(txs: FinanceTx[], ref = new Date(), months = 6): { ym: string; total: number; itens: number }[]
{
  const thisYm = localTodayIso(ref).slice(0, 7)
  const byYm = new Map<string, { total: number; itens: number }>()
  for (const t of txs)
  {
    if (t.tipo !== 'despesa') continue
    const ym = t.data.slice(0, 7)
    if (ym <= thisYm) continue
    if (!parseParcela(t.titulo) && !t.cardId) continue
    const cur = byYm.get(ym) ?? { total: 0, itens: 0 }
    cur.total += t.valor
    cur.itens += 1
    byYm.set(ym, cur)
  }
  return [...byYm.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .slice(0, months)
    .map(([ym, v]) => ({ ym, total: round2(v.total), itens: v.itens }))
}

/** Frase calma para o número da projeção (nunca "estourou"). */
export function projectionMessage(p: MonthProjection, fmt: (n: number) => string): string
{
  if (p.tom === 'apertado')
  {
    return `Pelo ritmo de agora, faltariam ${fmt(Math.abs(p.sobra))} para fechar o mês. Dá para ajustar com calma: veja o que ainda vence.`
  }
  if (p.tom === 'atencao')
  {
    return `Deve sobrar pouco (${fmt(p.sobra)}). Até o dia ${p.fimDoMes.slice(8, 10)}, uns ${fmt(p.porDia)} por dia deixam o mês fechado.`
  }
  return `Deve sobrar ${fmt(p.sobra)} no fim do mês. Dá para gastar uns ${fmt(p.porDia)} por dia, com calma.`
}
