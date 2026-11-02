/**
 * Cara do AXEL a partir do dia da pessoa. A noite deixa sonolento.
 * A festa só dura o instante do recorde. Humor baixo continua cuidado, não cobrança.
 */

export type AxelFace = 'calm' | 'happy' | 'care' | 'sleepy' | 'party'

export function axelFace(input: {
  hour: number
  moodLevel: number | null
  loggedToday: boolean
  celebrating: boolean
}): AxelFace
{
  if (input.celebrating) return 'party'
  if (input.hour >= 22 || input.hour < 8) return 'sleepy'
  if (input.moodLevel != null && input.moodLevel <= 2) return 'care'
  if (input.loggedToday || (input.moodLevel != null && input.moodLevel >= 4)) return 'happy'
  return 'calm'
}

export type AxelAccessory = {
  id: string
  label: string
  coins: number
}

export const AXEL_ACCESSORIES: AxelAccessory[] = [
  { id: 'laco', label: 'Laço', coins: 40 },
  { id: 'cachecol', label: 'Cachecol', coins: 40 },
  { id: 'oculos', label: 'Óculos', coins: 40 },
]

export type ChestPrize =
  | { kind: 'gold'; amount: number }
  | { kind: 'accessory'; id: string; label: string }

function hash(text: string): number
{
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 33 + text.charCodeAt(i)) >>> 0
  return h
}

/** Baú do dia: moedas ou um acessório que ela ainda não tem. Nunca tira o que já é dela. */
export function pickChestPrize(today: string, owned: string[]): ChestPrize
{
  const missing = AXEL_ACCESSORIES.filter((a) => !owned.includes(a.id))
  const h = hash(`${today}:bau`)
  if (missing.length && h % 2 === 0)
  {
    const item = missing[h % missing.length]
    return { kind: 'accessory', id: item.id, label: item.label }
  }
  return { kind: 'gold', amount: 8 + (h % 5) }
}
