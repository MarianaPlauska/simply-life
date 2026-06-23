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
  accent: '#38B2AC',
  grid: '#2A3340',
  tick: '#94A3B8',
  card: '#222A35',
  line: '#3D4A5C',
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
    accent: readCssVar('--sl-accent', FALLBACK_DARK.accent),
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
