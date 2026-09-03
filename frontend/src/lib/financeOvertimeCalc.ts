// Cálculos CLT - hora normal e hora extra (44h/semana → 220h/mês)

export const CLT_MONTHLY_HOURS = 220

export type OvertimeKind = 'weekday' | 'sunday'

export interface OvertimeRates
{
  hourlyNormal: number
  hourlyWeekdayExtra: number
  hourlySundayExtra: number
}

export interface OvertimeInput
{
  hours: number
  minutes: number
  kind: OvertimeKind
}

export interface OvertimeResult
{
  decimalHours: number
  rate: number
  total: number
  label: string
}

/** Converte horas + minutos em horas decimais */
export function toDecimalHours(hours: number, minutes: number): number
{
  const h = Math.max(0, hours)
  const m = Math.min(59, Math.max(0, minutes))
  return Math.round((h + m / 60) * 100) / 100
}

/** Valor da hora normal = salário bruto ÷ 220 */
export function computeHourlyNormal(grossSalary: number): number
{
  if (grossSalary <= 0) return 0
  return Math.round((grossSalary / CLT_MONTHLY_HOURS) * 100) / 100
}

/** Taxas de hora extra - 50% dias úteis, 100% domingo/feriado */
export function computeOvertimeRates(grossSalary: number): OvertimeRates
{
  const hourlyNormal = computeHourlyNormal(grossSalary)
  return {
    hourlyNormal,
    hourlyWeekdayExtra: Math.round(hourlyNormal * 1.5 * 100) / 100,
    hourlySundayExtra: Math.round(hourlyNormal * 2 * 100) / 100,
  }
}

export function computeOvertimePay(
  grossSalary: number,
  input: OvertimeInput,
): OvertimeResult
{
  const rates = computeOvertimeRates(grossSalary)
  const decimalHours = toDecimalHours(input.hours, input.minutes)

  const rate = input.kind === 'sunday'
    ? rates.hourlySundayExtra
    : rates.hourlyWeekdayExtra

  const total = Math.round(decimalHours * rate * 100) / 100

  const label = input.kind === 'sunday'
    ? 'Hora extra 100%'
    : 'Hora extra 50%'

  return { decimalHours, rate, total, label }
}

/** Soma horas extras já lançadas no mês (marcador [extra:hora-extra]) */
export function sumOvertimeInMonth(
  transactions: { tipo: string; valor: number; data: string; descricao: string }[],
  year: number,
  month: number,
): number
{
  return transactions
    .filter((t) =>
    {
      if (t.tipo !== 'receita') return false
      const d = new Date(`${t.data.slice(0, 10)}T12:00:00`)
      if (d.getFullYear() !== year || d.getMonth() !== month) return false
      return t.descricao.toLowerCase().includes('[extra:hora-extra]')
        || t.descricao.toLowerCase().includes('hora extra')
    })
    .reduce((s, t) => s + t.valor, 0)
}
