import type { Bloco } from '@simply-life/shared'

/** A cor do bloco é um índice da paleta de gráficos, para acompanhar o tema claro e escuro. */
export const MUNDO_CORES = ['0', '2', '4', '5', '3', '6']

export function blocoColor(b: Bloco, chart: readonly string[], fallback: string): string
{
  const i = Number(b.cor)
  return Number.isInteger(i) && chart[i] ? chart[i] : fallback
}
