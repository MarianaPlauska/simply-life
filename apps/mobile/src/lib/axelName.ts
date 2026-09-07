/** Nome escolhido no setup. Nunca o local-part do e-mail. */
export function resolveAxelName(input: {
  isGuest?: boolean
  callsYou?: string | null
  displayName?: string | null
  email?: string | null
}): string
{
  if (input.isGuest) return 'convidado'

  const chosen = (input.callsYou || input.displayName || '').trim()
  if (chosen && !chosen.includes('@'))
  {
    return chosen
  }

  return 'você'
}
