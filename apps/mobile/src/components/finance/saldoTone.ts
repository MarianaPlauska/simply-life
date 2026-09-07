/**
 * Cor do card de valores conforme saldo do mês (R$).
 * <80 vermelho · 80–150 amarelo (inclui ponte 80–99) · 151–500 azul · >500 verde
 */
export type SaldoTone = {
  bg: string
  fg: string
  muted: string
  label: string
}

export function saldoToneForMonth(saldo: number): SaldoTone
{
  if (saldo > 500)
  {
    return {
      bg: '#1F8A5B',
      fg: '#FFFFFF',
      muted: 'rgba(255,255,255,0.78)',
      label: 'Excelente',
    }
  }
  if (saldo >= 151)
  {
    return {
      bg: '#1557C0',
      fg: '#FFFFFF',
      muted: 'rgba(255,255,255,0.82)',
      label: 'Bom',
    }
  }
  if (saldo >= 80)
  {
    return {
      bg: '#E0A800',
      fg: '#1A1508',
      muted: 'rgba(26,21,8,0.72)',
      label: 'Atenção',
    }
  }
  return {
    bg: '#C94444',
    fg: '#FFFFFF',
    muted: 'rgba(255,255,255,0.78)',
    label: 'Crítico',
  }
}
