/**
 * Cor do cartão de saldo conforme o saldo do mês (R$), nos tons da paleta Petróleo & Coral.
 * Abaixo de 80: crítico. De 80 a 150: atenção. De 151 a 500: bom. Acima de 500: excelente.
 * Texto branco passa de 5:1 em todos os degradês.
 */
export type SaldoTone = {
  /** Degradê do cartão, do canto superior esquerdo ao inferior direito */
  from: string
  to: string
  fg: string
  muted: string
  label: string
}

export function saldoToneForMonth(saldo: number): SaldoTone
{
  if (saldo > 500)
  {
    return { from: '#2B7454', to: '#1F3A3D', fg: '#FFFFFF', muted: 'rgba(255,255,255,0.86)', label: 'Excelente' }
  }
  if (saldo >= 151)
  {
    return { from: '#44617D', to: '#1F3A3D', fg: '#FFFFFF', muted: 'rgba(255,255,255,0.86)', label: 'Bom' }
  }
  if (saldo >= 80)
  {
    return { from: '#8A5E0E', to: '#4A3508', fg: '#FFFFFF', muted: 'rgba(255,255,255,0.86)', label: 'Atenção' }
  }
  return { from: '#B3304A', to: '#5E1A28', fg: '#FFFFFF', muted: 'rgba(255,255,255,0.86)', label: 'Crítico' }
}
