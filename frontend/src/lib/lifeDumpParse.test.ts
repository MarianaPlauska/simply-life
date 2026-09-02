import { describe, it, expect } from 'vitest'
import { parseLifeDump } from './lifeDumpParse'
import { markDumpConflicts } from './lifeDumpConflict'

const REF = new Date('2026-08-21T12:00:00')

describe('parseLifeDump', () =>
{
  it('separa compromisso, tarefa e intenção', () =>
  {
    const cards = parseLifeDump(
      'reunião terça 14h, pagar aluguel, ligar pra mãe um dia desses',
      REF,
    )
    expect(cards).toHaveLength(3)
    expect(cards[0].kind).toBe('compromisso')
    expect(cards[0].hora).toBe('14:00')
    expect(cards[1].kind).toBe('intencao')
    expect(cards[2].kind).toBe('intencao')
    expect(cards[2].dataVencimento).toBeNull()
  })

  it('reconhece gasto em linguagem natural', () =>
  {
    const cards = parseLifeDump('gastei 20 no café', REF)
    expect(cards[0].kind).toBe('gasto')
    expect(cards[0].gasto?.valor).toBe(20)
  })
})

describe('markDumpConflicts', () =>
{
  it('marca dois horários próximos', () =>
  {
    const cards = parseLifeDump('dentista hoje 14h, call hoje 14h', REF)
    const marked = markDumpConflicts(cards, [])
    expect(marked.every((c) => c.conflict)).toBe(true)
  })
})
