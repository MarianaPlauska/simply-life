// Evita vários AxelCareNudge visíveis ao mesmo tempo (humor + ritual, etc.)

let activeUntil = 0

export function tryClaimAxelCareNudge(durationMs = 4500): boolean
{
  const now = Date.now()
  if (now < activeUntil) return false
  activeUntil = now + durationMs
  return true
}

export function releaseAxelCareNudge(): void
{
  activeUntil = 0
}
