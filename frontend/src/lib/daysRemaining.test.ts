import { describe, expect, it } from 'vitest'
import { diffDaysUntilDue, formatDaysRemaining } from './daysRemaining'

describe('daysRemaining', () =>
{
  const today = new Date(2026, 5, 10, 12, 0, 0)

  it('retorna null sem prazo', () =>
  {
    expect(diffDaysUntilDue(null, today)).toBeNull()
    expect(formatDaysRemaining(null, today).label).toBe('Sem prazo')
  })

  it('rotula hoje e atraso', () =>
  {
    const hoje = new Date(2026, 5, 10, 18, 0, 0).toISOString()
    expect(formatDaysRemaining(hoje, today).label).toBe('Hoje')

    const atraso = new Date(2026, 5, 8).toISOString()
    expect(formatDaysRemaining(atraso, today).label).toBe('2d atraso')
    expect(formatDaysRemaining(atraso, today).tone).toBe('urgente')
  })

  it('rotula amanhã e N dias', () =>
  {
    const amanha = new Date(2026, 5, 11).toISOString()
    expect(formatDaysRemaining(amanha, today).label).toBe('Amanhã')

    const tresDias = new Date(2026, 5, 13).toISOString()
    expect(formatDaysRemaining(tresDias, today).label).toBe('3d')
  })
})
