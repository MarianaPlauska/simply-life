import type { Transaction } from '../store/storeTypes'
import { transactionDayKey } from './financeLedger'

export type FinancePeriodMode = 'mes' | 'semana' | 'quinzena' | 'custom'

export interface FinancePeriodConfig
{
  mode: FinancePeriodMode
  monthOffset: number
  weekIndex: number
  quinzenaPart: 1 | 2
  customStart: string
  customEnd: string
}

export interface ResolvedFinancePeriod
{
  start: string
  end: string
  label: string
  shortLabel: string
  weekCount: number
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function pad2(n: number): string
{
  return String(n).padStart(2, '0')
}

function isoDate(year: number, month: number, day: number): string
{
  return `${year}-${pad2(month)}-${pad2(day)}`
}

function parseIso(iso: string): Date
{
  return new Date(`${iso}T12:00:00`)
}

function formatBr(iso: string): string
{
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function viewMonthFromOffset(monthOffset: number, ref = new Date()): { year: number; month: number }
{
  const d = new Date(ref.getFullYear(), ref.getMonth() + monthOffset, 1)
  return { year: d.getFullYear(), month: d.getMonth() }
}

export function weekCountInMonth(year: number, month: number): number
{
  const lastDay = new Date(year, month + 1, 0).getDate()
  return Math.ceil(lastDay / 7)
}

export function defaultWeekIndex(year: number, month: number, ref = new Date()): number
{
  if (ref.getFullYear() !== year || ref.getMonth() !== month) return 0
  return Math.floor((ref.getDate() - 1) / 7)
}

export function defaultCustomRange(monthOffset: number, ref = new Date()): { start: string; end: string }
{
  const { year, month } = viewMonthFromOffset(monthOffset, ref)
  const lastDay = new Date(year, month + 1, 0).getDate()
  return {
    start: isoDate(year, month + 1, 1),
    end: isoDate(year, month + 1, lastDay),
  }
}

export function createDefaultPeriodConfig(monthOffset = 0, ref = new Date()): FinancePeriodConfig
{
  const custom = defaultCustomRange(monthOffset, ref)
  const { year, month } = viewMonthFromOffset(monthOffset, ref)

  return {
    mode: 'mes',
    monthOffset,
    weekIndex: defaultWeekIndex(year, month, ref),
    quinzenaPart: ref.getDate() <= 15 ? 1 : 2,
    customStart: custom.start,
    customEnd: custom.end,
  }
}

export function resolveFinancePeriod(
  config: FinancePeriodConfig,
  ref = new Date(),
): ResolvedFinancePeriod
{
  const { year, month } = viewMonthFromOffset(config.monthOffset, ref)
  const monthName = MONTHS[month]
  const lastDay = new Date(year, month + 1, 0).getDate()
  const weekCount = weekCountInMonth(year, month)

  if (config.mode === 'mes')
  {
    return {
      start: isoDate(year, month + 1, 1),
      end: isoDate(year, month + 1, lastDay),
      label: `${monthName} ${year}`,
      shortLabel: `${monthName.slice(0, 3)} ${year}`,
      weekCount,
    }
  }

  if (config.mode === 'semana')
  {
    const idx = Math.min(Math.max(config.weekIndex, 0), weekCount - 1)
    const startDay = idx * 7 + 1
    const endDay = Math.min(startDay + 6, lastDay)
    const start = isoDate(year, month + 1, startDay)
    const end = isoDate(year, month + 1, endDay)

    return {
      start,
      end,
      label: `Semana ${idx + 1} · ${formatBr(start)} – ${formatBr(end)}`,
      shortLabel: `Sem. ${idx + 1}`,
      weekCount,
    }
  }

  if (config.mode === 'quinzena')
  {
    const part = config.quinzenaPart
    const startDay = part === 1 ? 1 : 16
    const endDay = part === 1 ? 15 : lastDay
    const start = isoDate(year, month + 1, startDay)
    const end = isoDate(year, month + 1, endDay)

    return {
      start,
      end,
      label: `${part}ª quinzena · ${monthName} ${year}`,
      shortLabel: `Q${part}`,
      weekCount,
    }
  }

  const start = config.customStart || isoDate(year, month + 1, 1)
  const end = config.customEnd || isoDate(year, month + 1, lastDay)
  const a = start <= end ? start : end
  const b = start <= end ? end : start

  return {
    start: a,
    end: b,
    label: `${formatBr(a)} – ${formatBr(b)}`,
    shortLabel: 'Personalizado',
    weekCount,
  }
}

export function filterTransactionsByPeriod(
  transactions: Transaction[],
  config: FinancePeriodConfig,
  ref = new Date(),
): Transaction[]
{
  const { start, end } = resolveFinancePeriod(config, ref)

  return transactions.filter((t) =>
  {
    const day = transactionDayKey(t.data)
    return day >= start && day <= end
  })
}

export function shiftPeriodConfig(
  config: FinancePeriodConfig,
  direction: -1 | 1,
  ref = new Date(),
): FinancePeriodConfig
{
  if (config.mode === 'semana')
  {
    const { year, month } = viewMonthFromOffset(config.monthOffset, ref)
    const weekCount = weekCountInMonth(year, month)
    const next = config.weekIndex + direction

    if (next >= 0 && next < weekCount)
    {
      return { ...config, weekIndex: next }
    }

    return {
      ...config,
      monthOffset: config.monthOffset + direction,
      weekIndex: direction > 0 ? 0 : weekCountInMonth(
        viewMonthFromOffset(config.monthOffset + direction, ref).year,
        viewMonthFromOffset(config.monthOffset + direction, ref).month,
      ) - 1,
    }
  }

  if (config.mode === 'quinzena')
  {
    if (direction > 0 && config.quinzenaPart === 1)
    {
      return { ...config, quinzenaPart: 2 }
    }
    if (direction < 0 && config.quinzenaPart === 2)
    {
      return { ...config, quinzenaPart: 1 }
    }

    const nextOffset = config.monthOffset + direction
    const { year, month } = viewMonthFromOffset(nextOffset, ref)
    const custom = defaultCustomRange(nextOffset, ref)

    return {
      ...config,
      monthOffset: nextOffset,
      quinzenaPart: direction > 0 ? 1 : 2,
      customStart: custom.start,
      customEnd: custom.end,
      weekIndex: defaultWeekIndex(year, month, ref),
    }
  }

  if (config.mode === 'custom')
  {
    const resolved = resolveFinancePeriod(config, ref)
    const span = Math.max(
      1,
      Math.round((parseIso(resolved.end).getTime() - parseIso(resolved.start).getTime()) / 86_400_000) + 1,
    )
    const delta = direction * span
    const start = new Date(parseIso(resolved.start))
    start.setDate(start.getDate() + delta)
    const end = new Date(parseIso(resolved.end))
    end.setDate(end.getDate() + delta)

    return {
      ...config,
      customStart: isoDate(start.getFullYear(), start.getMonth() + 1, start.getDate()),
      customEnd: isoDate(end.getFullYear(), end.getMonth() + 1, end.getDate()),
    }
  }

  return {
    ...config,
    monthOffset: config.monthOffset + direction,
    weekIndex: defaultWeekIndex(
      viewMonthFromOffset(config.monthOffset + direction, ref).year,
      viewMonthFromOffset(config.monthOffset + direction, ref).month,
      ref,
    ),
  }
}
