// Tom visual do saldo — verde / amarelo / vermelho

export type BalanceTone = 'ok' | 'caution' | 'danger'

export const BALANCE_TONE_TEXT: Record<BalanceTone, string> = {
  ok: 'text-concluido',
  caution: 'text-atencao',
  danger: 'text-urgente',
}

export const BALANCE_TONE_BG: Record<BalanceTone, string> = {
  ok: 'border-concluido/35 bg-concluido/10',
  caution: 'border-atencao/35 bg-atencao/10',
  danger: 'border-urgente/35 bg-urgente/10',
}

export const BALANCE_TONE_LABEL: Record<BalanceTone, string> = {
  ok: 'Saudável',
  caution: 'Atenção',
  danger: 'Crítico',
}

/** Caixa corrente — negativo ou muitas pendências puxam para amarelo/vermelho */
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

/** Limite do cartão — uso da fatura vs limite total */
export function resolveLimitTone(spent: number, limit: number): BalanceTone
{
  if (limit <= 0)
  {
    return spent > 0 ? 'danger' : 'ok'
  }

  const pctUsed = spent / limit
  if (pctUsed >= 1 || spent > limit) return 'danger'
  if (pctUsed >= 0.75) return 'caution'
  return 'ok'
}
