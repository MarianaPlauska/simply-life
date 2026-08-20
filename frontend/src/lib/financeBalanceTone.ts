// Tom de estabilidade do caixa — sage / âmbar / grafite (sem vermelho de alarme)

export type BalanceTone = 'ok' | 'caution' | 'danger'

export const BALANCE_TONE_TEXT: Record<BalanceTone, string> = {
  ok: 'text-concluido',
  caution: 'text-atencao',
  danger: 'text-ink-muted',
}

export const BALANCE_TONE_BG: Record<BalanceTone, string> = {
  ok: 'border-concluido/25 bg-concluido/8',
  caution: 'border-atencao/30 bg-atencao/8',
  danger: 'border-line bg-chrome/40',
}

export const BALANCE_TONE_LABEL: Record<BalanceTone, string> = {
  ok: 'Tranquilo',
  caution: 'Atenção',
  danger: 'Apertado',
}

export const STABILITY_HINT: Record<BalanceTone, string> = {
  ok: 'Folga confortável neste momento.',
  caution: 'Folga estreita — gaste com calma.',
  danger: 'Caixa apertado — priorize o essencial.',
}

export const STABILITY_BAR: Record<BalanceTone, string> = {
  ok: 'bg-concluido',
  caution: 'bg-atencao',
  danger: 'bg-ink-muted',
}

const STABILITY_BANDS: BalanceTone[] = ['ok', 'caution', 'danger']

export function stabilityBands(): readonly BalanceTone[]
{
  return STABILITY_BANDS
}

/** Projeção do mês futuro (ok / caution / urgent) → faixa de estabilidade */
export function outlookToneToBalance(tone: 'ok' | 'caution' | 'urgent'): BalanceTone
{
  if (tone === 'urgent') return 'danger'
  if (tone === 'caution') return 'caution'
  return 'ok'
}

/** Caixa corrente — negativo ou folga estreita puxam para atenção/apertado */
export function resolveCashTone(
  saldoCorrente: number,
  saldoProjetado?: number,
): BalanceTone
{
  if (saldoCorrente < 0) return 'danger'
  if (saldoProjetado != null && saldoProjetado < 0) return 'danger'
  if (saldoProjetado != null && saldoProjetado < saldoCorrente * 0.35)
  {
    return 'caution'
  }
  if (saldoCorrente === 0) return 'caution'
  return 'ok'
}

/** Limite do cartão — uso da fatura vs limite total (legado → BalanceTone) */
export function resolveLimitTone(spent: number, limit: number): BalanceTone
{
  const tone = resolveCardUsageToneFromSpend(spent, limit)
  if (tone === 'exhausted' || tone === 'danger') return 'danger'
  if (tone === 'caution') return 'caution'
  return 'ok'
}

export type CardUsageTone = 'ok' | 'caution' | 'danger' | 'exhausted'

/** Verde até 50%, amarelo até 88%, vermelho até 99%, preto em 100% */
export function resolveCardUsageTone(pctUsed: number): CardUsageTone
{
  if (pctUsed >= 100) return 'exhausted'
  if (pctUsed >= 88) return 'danger'
  if (pctUsed >= 50) return 'caution'
  return 'ok'
}

export function resolveCardUsageToneFromSpend(spent: number, limit: number): CardUsageTone
{
  if (limit <= 0)
  {
    return spent > 0 ? 'exhausted' : 'ok'
  }
  const pct = (spent / limit) * 100
  return resolveCardUsageTone(pct)
}

export const CARD_USAGE_BAR_CLASS: Record<CardUsageTone, string> = {
  ok: 'bg-concluido',
  caution: 'bg-atencao',
  danger: 'bg-urgente',
  exhausted: 'bg-zinc-950',
}

export const CARD_USAGE_TEXT_CLASS: Record<CardUsageTone, string> = {
  ok: 'text-concluido',
  caution: 'text-atencao',
  danger: 'text-urgente',
  exhausted: 'text-zinc-900 dark:text-zinc-200',
}
