import type { CardModalidade } from '../store/storeTypes'

export const CARD_MODALIDADE_OPTIONS: { id: CardModalidade; label: string; nomeSugerido: string }[] = [
  { id: 'credito', label: 'Crédito', nomeSugerido: '' },
  { id: 'debito', label: 'Débito', nomeSugerido: '' },
  { id: 'vr', label: 'VR', nomeSugerido: 'VR' },
  { id: 'alimentacao', label: 'Alimentação', nomeSugerido: 'Vale Alimentação' },
]

export function cardModalidadeLabel(m?: CardModalidade): string
{
  const found = CARD_MODALIDADE_OPTIONS.find((o) => o.id === (m ?? 'credito'))
  return found?.label ?? 'Crédito'
}

export function cardTemCicloFatura(m?: CardModalidade): boolean
{
  return (m ?? 'credito') === 'credito'
}

/** VR e vale - extrato, não fatura de crédito */
export function cardUsaExtrato(m?: CardModalidade): boolean
{
  const mod = m ?? 'credito'
  return mod === 'vr' || mod === 'alimentacao'
}
