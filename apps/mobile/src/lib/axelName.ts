/** Nome escolhido no setup. Nunca o local-part do e-mail. */
export function resolveAxelName(input: {
  isGuest?: boolean
  callsYou?: string | null
  displayName?: string | null
  email?: string | null
}): string
{
  // convidado que disse o nome nas boas-vindas também é chamado por ele
  const chosen = (input.callsYou || input.displayName || '').trim()
  if (chosen && !chosen.includes('@'))
  {
    return chosen
  }

  return input.isGuest ? 'convidado' : 'você'
}
