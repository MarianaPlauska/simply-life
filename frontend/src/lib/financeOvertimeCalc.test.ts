import { describe, expect, it } from 'vitest'
import {
  CLT_MONTHLY_HOURS,
  computeHourlyNormal,
  computeOvertimePay,
  computeOvertimeRates,
  sumOvertimeInMonth,
  toDecimalHours,
} from './financeOvertimeCalc'

describe('financeOvertimeCalc', () =>
{
  it('converte horas e minutos em decimal', () =>
  {
    expect(toDecimalHours(5, 34)).toBe(5.57)
    expect(toDecimalHours(3, 13)).toBe(3.22)
  })

  it('calcula hora normal CLT (2500 / 220)', () =>
  {
    expect(computeHourlyNormal(2500)).toBe(11.36)
  })

  it('calcula taxas de hora extra 50% e 100%', () =>
  {
    const rates = computeOvertimeRates(2500)
    expect(rates.hourlyNormal).toBe(11.36)
    expect(rates.hourlyWeekdayExtra).toBe(17.04)
    expect(rates.hourlySundayExtra).toBe(22.72)
  })

  it('calcula pagamento de hora extra em dia útil', () =>
  {
    const result = computeOvertimePay(2500, { hours: 2, minutes: 0, kind: 'weekday' })
    expect(result.decimalHours).toBe(2)
    expect(result.rate).toBe(17.04)
    expect(result.total).toBe(34.08)
  })

  it('usa divisor padrão de 220 horas', () =>
  {
    expect(CLT_MONTHLY_HOURS).toBe(220)
  })

  it('soma HE lançadas no mês', () =>
  {
    const tx = [
      { tipo: 'receita', valor: 34.08, data: '2026-06-10', descricao: '[extra:hora-extra] 2h' },
      { tipo: 'receita', valor: 17.04, data: '2026-06-15', descricao: '[extra:hora-extra] 1h' },
      { tipo: 'receita', valor: 2500, data: '2026-06-05', descricao: 'Salário' },
      { tipo: 'receita', valor: 50, data: '2026-05-10', descricao: '[extra:hora-extra] antigo' },
    ]
    expect(sumOvertimeInMonth(tx, 2026, 5)).toBe(51.12)
  })
})
