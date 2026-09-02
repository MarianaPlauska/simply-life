import { describe, expect, it } from 'vitest'
import { computeStreakStats } from './habitStreakCalc'

describe('computeStreakStats', () =>
{
  const ref = new Date('2026-08-28T12:00:00')

  it('retorna zero sem datas', () =>
  {
    expect(computeStreakStats([], ref)).toEqual({
      streak_dias: 0,
      recorde_dias: 0,
      ultima_data: null,
    })
  })

  it('calcula sequência atual terminando hoje', () =>
  {
    const stats = computeStreakStats([
      '2026-08-26',
      '2026-08-27',
      '2026-08-28',
    ], ref)
    expect(stats.streak_dias).toBe(3)
    expect(stats.recorde_dias).toBe(3)
    expect(stats.ultima_data).toBe('2026-08-28')
  })

  it('aceita sequência até ontem se hoje ainda não registrou', () =>
  {
    const stats = computeStreakStats([
      '2026-08-26',
      '2026-08-27',
    ], ref)
    expect(stats.streak_dias).toBe(2)
  })

  it('encontra recorde maior que sequência atual', () =>
  {
    const stats = computeStreakStats([
      '2026-08-01',
      '2026-08-02',
      '2026-08-03',
      '2026-08-04',
      '2026-08-28',
    ], ref)
    expect(stats.streak_dias).toBe(1)
    expect(stats.recorde_dias).toBe(4)
  })
})
