import { describe, expect, it } from 'vitest'
import {
  buildConsistencyCells,
  buildExecutionDayMap,
  buildSpendDayMap,
  intensity01,
  intensityLevel,
  localIsoDate,
  formatExecutionTooltip,
} from './consistencyHeatmap'
import { worstBudgetEnvelope, type CategoryBudgetRow } from './financeCategoryBudget'

describe('consistencyHeatmap', () =>
{
  it('preenche 12 semanas alinhadas à segunda até o fim local', () =>
  {
    const end = new Date(2026, 7, 21)
    const iso = localIsoDate(end)
    const cells = buildConsistencyCells(
      { [iso]: { date: iso, count: 2, value: 50 } },
      12,
      end,
    )
    expect(cells[0].date).toBe('2026-05-25')
    expect(cells[cells.length - 1].date).toBe(iso)
    expect(cells[cells.length - 1].count).toBe(2)
    expect(cells.length).toBeGreaterThanOrEqual(84)
  })

  it('agrega foco e conclusões no mesmo dia', () =>
  {
    const map = buildExecutionDayMap(
      { '2026-08-21': 50 },
      ['2026-08-21T18:00:00'],
    )
    expect(map['2026-08-21'].count).toBe(1)
    expect(map['2026-08-21'].value).toBe(50)
  })

  it('tooltip de execução prefere concluídas', () =>
  {
    expect(formatExecutionTooltip({ date: '2026-08-21', count: 3, value: 0 }))
      .toBe('2026-08-21 · 3 concluídas')
    expect(formatExecutionTooltip({ date: '2026-08-21', count: 2, value: 50 }))
      .toBe('2026-08-21 · 2 sessão(ões) de foco')
  })

  it('soma gastos por dia', () =>
  {
    const map = buildSpendDayMap([
      { data: '2026-08-21', tipo: 'despesa', valor: 10 },
      { data: '2026-08-21', tipo: 'despesa', valor: 5 },
      { data: '2026-08-21', tipo: 'receita', valor: 100 },
    ])
    expect(map['2026-08-21'].count).toBe(2)
    expect(map['2026-08-21'].value).toBe(15)
  })

  it('intensidade zero sem contagem', () =>
  {
    expect(intensity01(0, 4)).toBe(0)
    expect(intensity01(2, 4)).toBe(0.5)
    expect(intensityLevel(0, 4)).toBe(0)
    expect(intensityLevel(1, 4)).toBe(1)
    expect(intensityLevel(4, 4)).toBe(4)
  })
})

describe('worstBudgetEnvelope', () =>
{
  it('escolhe o teto com maior percentual', () =>
  {
    const rows: CategoryBudgetRow[] = [
      {
        id: 1,
        nome: 'Mercado',
        icone: '',
        cor: '',
        gasto: 80,
        limite: 100,
        pct: 80,
        alert: 'caution',
        restante: 20,
      },
      {
        id: 2,
        nome: 'Lazer',
        icone: '',
        cor: '',
        gasto: 110,
        limite: 100,
        pct: 110,
        alert: 'over',
        restante: 0,
      },
    ]
    expect(worstBudgetEnvelope(rows)?.nome).toBe('Lazer')
  })
})
