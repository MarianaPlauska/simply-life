import { describe, expect, it } from 'vitest'
import { buildPurchaseDeferTask, purchaseDeferDueIso } from './deferPurchaseToKanban'

describe('deferPurchaseToKanban', () =>
{
  it('agenda o vencimento da tarefa N dias à frente', () =>
  {
    const from = new Date('2026-08-19T12:00:00')
    expect(purchaseDeferDueIso(3, from)).toBe('2026-08-22')
    expect(purchaseDeferDueIso(0, from)).toBe('2026-08-20')
  })

  it('monta título e notas com o veredito do AXEL', () =>
  {
    const copy = buildPurchaseDeferTask({
      descricao: 'fone bluetooth',
      valor: 320,
      verdict: {
        tone: 'wait',
        headline: 'Melhor esperar',
        detail: 'Folga negativa após a compra.',
        diasSugeridos: 7,
      },
    })

    expect(copy.titulo).toContain('fone bluetooth')
    expect(copy.titulo).toContain('R$')
    expect(copy.notas).toContain('Melhor esperar')
    expect(copy.notas).toContain('AXEL (wait)')
    expect(copy.dias).toBe(7)
  })
})
