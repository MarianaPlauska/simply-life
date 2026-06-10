// Mapa de influência — remetente → peso (0 a 1.0)

export const DEFAULT_INFLUENCE_MAP: Record<string, number> = {
  'chefe@empresa.com': 1.0,
  'gestor@empresa.com': 0.95,
  'cliente@projeto.com': 0.9,
  'diretoria@empresa.com': 0.88,
  'sistema@automacao.com': 0.5,
  'noreply@servico.com': 0.25,
  'newsletter@marketing.com': 0.15,
}

export function normalizeSenderKey(sender: string): string
{
  return String(sender || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

export function resolveInfluenceWeight(
  sender: string,
  map: Record<string, number> = DEFAULT_INFLUENCE_MAP,
): number
{
  const key = normalizeSenderKey(sender)
  if (!key) return 0.35

  if (map[key] !== undefined)
  {
    return Math.min(1, Math.max(0, map[key]))
  }

  const emailMatch = key.match(/[\w.+-]+@[\w.-]+\.\w+/)
  if (emailMatch && map[emailMatch[0]] !== undefined)
  {
    return Math.min(1, Math.max(0, map[emailMatch[0]]))
  }

  for (const [entry, weight] of Object.entries(map))
  {
    if (key.includes(entry) || entry.includes(key))
    {
      return Math.min(1, Math.max(0, weight))
    }
  }

  return 0.35
}

export function formatSenderLabel(sender: string): string
{
  const key = normalizeSenderKey(sender)
  if (!key) return 'Remetente não identificado'

  if (key.includes('chefe') || key.includes('gestor') || key.includes('diretoria'))
  {
    return 'Gestor'
  }
  if (key.includes('cliente'))
  {
    return 'Cliente'
  }
  if (key.includes('sistema') || key.includes('automacao'))
  {
    return 'Automação'
  }

  const email = key.match(/[\w.+-]+@[\w.-]+\.\w+/)
  if (email) return email[0]

  return key.length > 32 ? `${key.slice(0, 29)}…` : key
}
