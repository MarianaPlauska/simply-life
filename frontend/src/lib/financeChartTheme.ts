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
  receita: '#4A7C59',
  despesa: '#C44D4D',
  accent: '#C17F3A',
  grid: '#2E2C28',
  tick: '#9C9890',
  card: '#232220',
  line: '#2E2C28',
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
