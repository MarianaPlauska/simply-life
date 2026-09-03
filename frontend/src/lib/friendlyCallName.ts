/**
 * Nome que o AXEL usa em voz - nunca e-mail cru, mas extrai o primeiro nome humano.
 */

/** Mais longos primeiro para não casar "Ana" dentro de "Mariana". */
const FIRST_NAME_PREFIXES = [
  'mariana', 'maria', 'gabriela', 'fernanda', 'patricia', 'patrícia',
  'juliana', 'beatriz', 'larissa', 'camila', 'amanda', 'bruna',
  'carolina', 'isabela', 'isabella', 'leticia', 'letícia', 'rafaela',
  'daniela', 'vanessa', 'jessica', 'jéssica', 'alessandra', 'cristina',
  'gabriel', 'rafael', 'bruno', 'carlos', 'pedro', 'lucas', 'felipe',
  'matheus', 'mateus', 'thiago', 'tiago', 'rodrigo', 'eduardo',
  'joão', 'joao', 'jose', 'josé', 'paulo', 'andre', 'andré',
  'ana', 'luiz', 'luis',
]

export function friendlyCallName(...candidates: Array<string | null | undefined>): string
{
  for (const raw of candidates)
  {
    const name = pickHumanName(raw)
    if (name) return name
  }
  return ''
}

function pickHumanName(raw: string | null | undefined): string | null
{
  if (!raw) return null
  let s = raw.trim()
  if (!s) return null

  if (s.includes('@'))
  {
    s = s.slice(0, s.indexOf('@'))
  }

  if (s.includes(' '))
  {
    const first = s.split(/\s+/)[0] ?? ''
    return looksLikeFirstName(first) ? capitalizeWord(first) : null
  }

  const token = s.split(/[._-]/)[0] ?? ''
  const fromPrefix = firstNameFromMashed(token)
  if (fromPrefix) return fromPrefix

  if (looksLikeFirstName(token)) return capitalizeWord(token)
  return null
}

function firstNameFromMashed(token: string): string | null
{
  const lower = token.toLowerCase()
  for (const prefix of FIRST_NAME_PREFIXES)
  {
    if (lower === prefix) return capitalizeWord(prefix)
    if (lower.startsWith(prefix) && lower.length > prefix.length)
    {
      return capitalizeWord(prefix)
    }
  }
  return null
}

function looksLikeFirstName(word: string): boolean
{
  if (word.length < 2 || word.length > 24) return false
  if (/\d/.test(word)) return false
  return /^[\p{L}]+$/u.test(word)
}

function capitalizeWord(word: string): string
{
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}
