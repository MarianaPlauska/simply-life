// Entrada monetária BRL — dígitos da direita (centavos primeiro)

export function centsFromDigits(digits: string): number
{
  const clean = digits.replace(/\D/g, '')
  if (!clean)
  {
    return 0
  }
  return Number.parseInt(clean, 10)
}

export function formatCentsToBrl(cents: number): string
{
  const safe = Number.isFinite(cents) ? Math.max(0, Math.round(cents)) : 0
  return (safe / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function parseMoneyInputToNumber(display: string): number
{
  return centsFromDigits(display) / 100
}

/** Aplica tecla/dígito ao valor em centavos (modo caixa) */
export function applyMoneyDigit(currentDisplay: string, input: string): string
{
  if (input === 'Backspace')
  {
    const cents = centsFromDigits(currentDisplay)
    return formatCentsToBrl(Math.floor(cents / 10))
  }

  const digit = input.replace(/\D/g, '')
  if (!digit)
  {
    return currentDisplay
  }

  const nextCents = Number.parseInt(
    `${centsFromDigits(currentDisplay)}${digit}`,
    10,
  )
  return formatCentsToBrl(nextCents)
}

export function normalizeMoneyBlur(display: string): string
{
  return formatCentsToBrl(centsFromDigits(display))
}
