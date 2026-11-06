import { describe, expect, it } from 'vitest'
import { cardCycle, cardUso } from '../financeCash'
import type { FinanceTx } from '../finance'

const tx = (id: string, data: string, valor: number, titulo = 'Almoço'): FinanceTx =>
  ({ id, titulo, valor, categoria: 'alimentacao', data, tipo: 'despesa', cardId: 'vr' }) as FinanceTx

const vr = { id: 'vr', nome: 'VR', limite: 700, diaFechamento: 10 }

describe('cardCycle', () =>
{
  it('o dia do fechamento já abre o ciclo novo', () =>
  {
    expect(cardCycle(10, new Date(2026, 10, 10))).toEqual({ inicio: '2026-11-10', fim: '2026-12-09', chave: '2026-11' })
    expect(cardCycle(10, new Date(2026, 10, 9))).toEqual({ inicio: '2026-10-10', fim: '2026-11-09', chave: '2026-10' })
  })

  it('sem fechamento usa o mês', () =>
  {
    expect(cardCycle(undefined, new Date(2026, 1, 15))).toEqual({ inicio: '2026-02-01', fim: '2026-02-28', chave: '2026-02' })
  })
})

describe('cardUso', () =>
{
  const txs = [tx('a', '2026-11-05', 200), tx('b', '2026-11-12', 50)]

  it('sem parcelas volta ao limite cheio no fechamento', () =>
  {
    expect(cardUso(vr, txs, new Date(2026, 10, 9)).disponivel).toBe(500)
    const depois = cardUso(vr, txs, new Date(2026, 10, 12))
    expect(depois.reseta).toBe(true)
    expect(depois.disponivel).toBe(650)
  })

  it('com parcela no ciclo não reseta', () =>
  {
    const comParcela = [...txs, tx('p', '2026-11-15', 100, 'Geladeira 2/5')]
    expect(cardUso(vr, comParcela, new Date(2026, 10, 12)).reseta).toBe(false)
  })

  it('adicional soma só no ciclo dele, sem mudar o limite', () =>
  {
    const card = { ...vr, adicionais: { '2026-11': 100 } }
    const u = cardUso(card, txs, new Date(2026, 10, 12))
    expect(u.limite).toBe(800)
    expect(u.disponivel).toBe(750)
    expect(cardUso(card, txs, new Date(2026, 10, 9)).adicional).toBe(0)
    expect(card.limite).toBe(700)
  })
})
