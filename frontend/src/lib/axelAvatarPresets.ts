// Avatares do wizard - iniciais ou companheiros SVG (sem API externa)

export type AvatarStyleId =
  | 'initials'
  | 'companion_owl'
  | 'companion_fox'
  | 'companion_bloom'
  | 'companion_bear'
  | 'companion_cat'
  | 'companion_bunny'

export interface AvatarPreset
{
  id: AvatarStyleId
  label: string
  hint: string
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'initials', label: 'Iniciais', hint: 'Suas letras' },
  { id: 'companion_owl', label: 'Coruja', hint: 'Calma e foco' },
  { id: 'companion_fox', label: 'Raposa', hint: 'Esperta e leve' },
  { id: 'companion_bloom', label: 'Flor', hint: 'Leve e positiva' },
  { id: 'companion_bear', label: 'Urso', hint: 'Acolhedor' },
  { id: 'companion_cat', label: 'Gato', hint: 'Independente' },
  { id: 'companion_bunny', label: 'Coelho', hint: 'Suave e gentil' },
]

export function avatarsForLevel(level: number): AvatarStyleId[]
{
  const all = AVATAR_PRESETS.map((preset) => preset.id)
  if (level >= 10) return all
  if (level >= 6) return all.slice(0, 6)
  if (level >= 3) return all.slice(0, 4)
  return ['initials', 'companion_owl']
}

export function iniciaisDe(nome: string): string
{
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length >= 2)
  {
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
  }
  if (partes.length === 1 && partes[0].length >= 2)
  {
    return partes[0].slice(0, 2).toUpperCase()
  }
  return ''
}
