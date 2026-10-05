import {
  checkPurchase,
  installmentPlan,
  launchCashYm,
  purchaseCheckMessage,
  spendRoomHint,
} from '../purchaseCheck'
import { monthEndProjection } from '../financeProjection'
import { computeSaldoDisponivel, type ContaFixa } from '../financeAccounts'
import type { FinanceTx } from '../finance'

const REF = new Date(2026, 9, 10, 12) // 10 de outubro de 2026
const fmt = (n: number) => `R$ ${n.toFixed(2).replace('.', ',')}`

const tx = (p: Partial<FinanceTx>): FinanceTx => ({
  id: Math.random().toString(36).slice(2),
  titulo: 'Gasto',
  valor: 10,
  categoria: 'outros',
  data: '2026-10-01',
  tipo: 'despesa',
  ...p,
})

const aluguel: ContaFixa = { id: 1, nome: 'Aluguel', valor: 1500, diaVencimento: 20, categoria: 'casa', ativa: true }

function projection(saldo: number, extra: Partial<Parameters<typeof monthEndProjection>[0]> = {})
{
  return monthEndProjection({
    ref: REF,
    saldoDisponivel: saldo,
    txs: [],
    fixas: [],
    paidKeys: new Set(),
    faturas: [],
    receitas: [],
    ...extra,
  })
}

describe('checkPurchase', () =>
{
  it('compra à vista que cabe no mês fica tranquila', () =>
  {
    const p = projection(2000)
    const c = checkPurchase({ ref: REF, projection: p, launches: [{ valor: 100, data: '2026-10-10' }], txs: [], fixas: [], rendaMensal: 3000 })
    expect(c.tom).toBe('tranquilo')
    expect(c.pior?.sobraDepois).toBe(1900)
  })

  it('compra que passa da sobra do mês fica apertada e diz quanto falta', () =>
  {
    const p = projection(2000, { fixas: [aluguel] }) // sobra 500
    const c = checkPurchase({ ref: REF, projection: p, launches: [{ valor: 680, data: '2026-10-10' }], txs: [], fixas: [aluguel], rendaMensal: 3000 })
    expect(c.tom).toBe('apertado')
    expect(c.pior?.sobraDepois).toBe(-180)
    const msg = purchaseCheckMessage(c, fmt, REF)
    expect(msg.mensagem).toContain('faltariam R$ 180,00 para fechar o mês')
    expect(msg.mensagem).toContain('cabem até R$ 500,00')
  })

  it('sobra baixa, mas positiva, fica no limite', () =>
  {
    const p = projection(2000, { fixas: [aluguel] }) // sobra 500, colchão 200
    const c = checkPurchase({ ref: REF, projection: p, launches: [{ valor: 400, data: '2026-10-10' }], txs: [], fixas: [aluguel], rendaMensal: 3000 })
    expect(c.tom).toBe('atencao')
  })

  it('parcelas pesam nos meses seguintes e o aviso aponta o mês que aperta', () =>
  {
    const p = projection(5000)
    // dezembro já tem uma parcela grande de outra compra
    const txs = [tx({ titulo: 'TV 3/10', valor: 1200, data: '2026-12-05', cardId: 'c1' })]
    const launches = [0, 1, 2].map((i) => ({ valor: 300, data: `2026-${10 + i}-05` }))
    const c = checkPurchase({ ref: REF, projection: p, launches, txs, fixas: [aluguel], rendaMensal: 2000 })
    // dezembro: 2000 − 1500 − 1200 − 300 = −1000
    expect(c.tom).toBe('apertado')
    expect(c.pior?.ym).toBe('2026-12')
    expect(c.pior?.sobraDepois).toBe(-1000)
    expect(purchaseCheckMessage(c, fmt, REF).mensagem).toContain('em dezembro')
  })

  it('sem renda cadastrada, os meses futuros ficam de fora da conta', () =>
  {
    const p = projection(3000)
    const launches = [{ valor: 100, data: '2026-10-10' }, { valor: 100, data: '2026-11-10' }]
    const c = checkPurchase({ ref: REF, projection: p, launches, txs: [], fixas: [], rendaMensal: null })
    expect(c.meses.map((m) => m.ym)).toEqual(['2026-10'])
    expect(c.semRenda).toEqual(['2026-11'])
  })

  it('sem saldo, renda nem histórico, não avisa nada', () =>
  {
    const c = checkPurchase({ ref: REF, projection: projection(0), launches: [{ valor: 50, data: '2026-10-10' }], txs: [], fixas: [], rendaMensal: null })
    expect(c.tom).toBe('sem-dados')
  })
})

describe('launchCashYm', () =>
{
  it('crédito comprado depois do vencimento vai para a fatura seguinte', () =>
  {
    expect(launchCashYm({ valor: 1, data: '2026-10-15' }, '2026-10', { diaVencimento: 10 })).toBe('2026-11')
    expect(launchCashYm({ valor: 1, data: '2026-10-05' }, '2026-10', { diaVencimento: 10 })).toBe('2026-10')
  })

  it('débito com data passada pesa no mês de agora', () =>
  {
    expect(launchCashYm({ valor: 1, data: '2026-09-28' }, '2026-10')).toBe('2026-10')
  })
})

describe('installmentPlan', () =>
{
  it('divide o total sem perder centavos', () =>
  {
    const plan = installmentPlan({ valor: 100, parcelas: 3, data: '2026-10-10' })
    expect(plan.map((p) => p.valor)).toEqual([33.34, 33.33, 33.33])
    expect(plan.reduce((a, p) => a + p.valor, 0)).toBeCloseTo(100)
  })

  it('compra em andamento lança só as parcelas que faltam, a partir da data', () =>
  {
    const plan = installmentPlan({ valor: 150, parcelas: 10, data: '2026-10-10', porParcela: true, pagas: 3 })
    expect(plan).toHaveLength(7)
    expect(plan[0]).toEqual({ numero: 4, total: 10, valor: 150, offset: 0 })
    expect(plan[6].numero).toBe(10)
  })

  it('aceita até 24x', () =>
  {
    expect(installmentPlan({ valor: 2400, parcelas: 24, data: '2026-10-10' })).toHaveLength(24)
  })
})

describe('lançamentos com data futura', () =>
{
  it('não saem do saldo de hoje e entram na projeção do mês', () =>
  {
    const txs = [
      tx({ titulo: 'Mercado', valor: 200, data: '2026-10-05' }),
      tx({ titulo: 'Curso 1/3', valor: 300, data: '2026-10-25', formaPagamento: 'boleto' }),
    ]
    const saldo = computeSaldoDisponivel({ saldoInicial: 1000 }, txs, [], REF).disponivel
    expect(saldo).toBe(800)
    const p = projection(saldo, { txs })
    const agendado = p.lines.find((l) => l.kind === 'agendado')
    expect(agendado?.valor).toBe(-300)
  })
})

describe('spendRoomHint', () =>
{
  it('mostra quanto cabe ou quanto falta', () =>
  {
    expect(spendRoomHint(projection(800), fmt)).toContain('cabem até R$ 800,00')
    expect(spendRoomHint(projection(-50), fmt)).toContain('faltam R$ 50,00')
  })
})
