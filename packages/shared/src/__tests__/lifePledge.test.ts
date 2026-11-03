import { describe, expect, it } from 'vitest'
import { pledgeDays, pledgeProgress } from '../lifePledge'

describe('meta de tempo', () =>
{
  it('o dia de início conta como 1', () =>
  {
    expect(pledgeDays('2026-01-01', '2026-01-01')).toBe(1)
  })

  it('não volta para trás se a data de hoje é anterior', () =>
  {
    expect(pledgeDays('2026-02-01', '2026-01-01')).toBe(0)
  })

  it('enche a faixa até a meta e para em 100', () =>
  {
    const start = pledgeProgress('2026-01-01', 365, '2026-01-01')
    expect(start.elapsed).toBe(1)
    expect(start.left).toBe(364)
    expect(start.complete).toBe(false)

    const done = pledgeProgress('2025-01-01', 365, '2026-01-01')
    expect(done.complete).toBe(true)
    expect(done.pct).toBe(100)
    expect(done.left).toBe(0)
  })
})
