// Subtipos para lançamento rápido no cartão — descrição + categoria prontas

export interface CardQuickSubtype
{
  id: string
  label: string
  emoji: string
  categoria: string
}

export const CARD_QUICK_SUBTYPES: CardQuickSubtype[] = [
  { id: 'lanche', label: 'Lanche', emoji: '🥪', categoria: 'alimentacao' },
  { id: 'almoco', label: 'Almoço', emoji: '🍽️', categoria: 'alimentacao' },
  { id: 'mercado', label: 'Mercado', emoji: '🛒', categoria: 'alimentacao' },
  { id: 'cafe', label: 'Café', emoji: '☕', categoria: 'alimentacao' },
  { id: 'roupa', label: 'Roupa', emoji: '👕', categoria: 'vestuario' },
  { id: 'presente', label: 'Presente', emoji: '🎁', categoria: 'outros' },
  { id: 'transporte', label: 'Transporte', emoji: '🚗', categoria: 'transporte' },
  { id: 'farmacia', label: 'Farmácia', emoji: '💊', categoria: 'saude' },
  { id: 'lazer', label: 'Lazer', emoji: '🎬', categoria: 'lazer' },
  { id: 'assinatura', label: 'Assinatura', emoji: '📱', categoria: 'internet' },
  { id: 'outro', label: 'Outro', emoji: '✏️', categoria: 'outros' },
]

/** Valores comuns para toque rápido (VR, lanches, etc.) */
export const CARD_QUICK_AMOUNT_HINTS = [8, 12, 15, 20, 25, 30, 40, 50, 80, 100]

/** Menos chips — cabe em uma linha no dashboard */
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
