/**
 * Espera antes de um gasto por impulso. Desligada por padrão.
 * Conta a pagar, parcela e recorrência não entram na espera.
 */

export const DEFAULT_IMPULSE_THRESHOLD = 80
export const IMPULSE_WAIT_HOURS = 24

export type ImpulseHoldDraft = {
  titulo: string
  valor: number
  /** mais de uma parcela, conta fixa ou recorrência: lança na hora */
  planejado: boolean
}

export function shouldHoldImpulse(
  enabled: boolean,
  threshold: number,
  draft: ImpulseHoldDraft,
): boolean
{
  if (!enabled || draft.planejado) return false
  if (!Number.isFinite(draft.valor) || draft.valor <= 0) return false
  return draft.valor >= Math.max(1, threshold)
}

export function holdReleasesAt(from: Date, hours = IMPULSE_WAIT_HOURS): string
{
  return new Date(from.getTime() + hours * 60 * 60 * 1000).toISOString()
}

export function holdIsReady(liberaEm: string, now: Date): boolean
{
  const at = new Date(liberaEm).getTime()
  return Number.isFinite(at) && at <= now.getTime()
}
