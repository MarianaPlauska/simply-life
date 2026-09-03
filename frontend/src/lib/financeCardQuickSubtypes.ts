// Subtipos para lançamento rápido no cartão - descrição + categoria prontas

export interface CardQuickSubtype
{
  id: string
  label: string
  icon: string
  categoria: string
}

export const CARD_QUICK_SUBTYPES: CardQuickSubtype[] = [
  { id: 'lanche', label: 'Lanche', icon: 'lanche', categoria: 'alimentacao' },
  { id: 'almoco', label: 'Almoço', icon: 'almoco', categoria: 'alimentacao' },
  { id: 'mercado', label: 'Mercado', icon: 'mercado', categoria: 'alimentacao' },
  { id: 'cafe', label: 'Café', icon: 'cafe', categoria: 'alimentacao' },
  { id: 'roupa', label: 'Roupa', icon: 'roupa', categoria: 'vestuario' },
  { id: 'presente', label: 'Presente', icon: 'presente', categoria: 'outros' },
  { id: 'transporte', label: 'Transporte', icon: 'transporte', categoria: 'transporte' },
  { id: 'farmacia', label: 'Farmácia', icon: 'farmacia', categoria: 'saude' },
  { id: 'lazer', label: 'Lazer', icon: 'lazer', categoria: 'lazer' },
  { id: 'assinatura', label: 'Assinatura', icon: 'assinatura', categoria: 'internet' },
  { id: 'outro', label: 'Outro', icon: 'outro', categoria: 'outros' },
]

/** Valores comuns para toque rápido (VR, lanches, etc.) */
export const CARD_QUICK_AMOUNT_HINTS = [8, 12, 15, 20, 25, 30, 40, 50, 80, 100]

/** Menos chips - cabe em uma linha no dashboard */
export const CARD_QUICK_AMOUNT_HINTS_COMPACT = [8, 15, 20, 30, 50, 100]

const STORAGE_KEY = 'simply-life-card-quick-subtype'

export function loadLastCardQuickSubtypeId(): string | null
{
  try
  {
    return localStorage.getItem(STORAGE_KEY)
  }
  catch
  {
    return null
  }
}

export function saveLastCardQuickSubtypeId(id: string): void
{
  localStorage.setItem(STORAGE_KEY, id)
}
