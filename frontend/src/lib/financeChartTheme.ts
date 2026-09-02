import { useMemo } from 'react'

/** Paleta para Recharts — lê tokens Instrumento (--sl-*) no DOM */
export interface FinanceChartTheme
{
  receita: string
  despesa: string
  accent: string
  grid: string
  tick: string
  card: string
  line: string
}

const FALLBACK_DARK: FinanceChartTheme = {
  receita: '#48BB78',
  despesa: '#F56565',
  accent: '#C9A15C',
  grid: '#2D2D2D',
  tick: '#9D9D9D',
  card: '#2D2D2D',
  line: 'rgba(255, 255, 255, 0.09)',
}

function readCssVar(name: string, fallback: string): string
{
  if (typeof window === 'undefined') return fallback

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()

  return value || fallback
}

export function getFinanceChartTheme(): FinanceChartTheme
{
  return {
    receita: readCssVar('--sl-success', FALLBACK_DARK.receita),
    despesa: readCssVar('--sl-urgent', FALLBACK_DARK.despesa),
    accent: readCssVar('--sl-finance', FALLBACK_DARK.accent),
    grid: readCssVar('--sl-border', FALLBACK_DARK.grid),
    tick: readCssVar('--sl-text-muted', FALLBACK_DARK.tick),
    card: readCssVar('--sl-surface', FALLBACK_DARK.card),
    line: readCssVar('--sl-border', FALLBACK_DARK.line),
  }
}

export function useFinanceChartTheme(): FinanceChartTheme
{
  return useMemo(() => getFinanceChartTheme(), [])
}
