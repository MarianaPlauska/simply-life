/**
 * Checagem do corpo em quatro toques. Não substitui o humor nem vira diagnóstico.
 */

export const BODY_CHECKS = [
  { id: 'comi', label: 'Comi' },
  { id: 'bebi', label: 'Bebi' },
  { id: 'banheiro', label: 'Banheiro' },
  { id: 'corpo', label: 'Dói ou está alto' },
] as const

export type BodyCheckId = (typeof BODY_CHECKS)[number]['id']

export type BodyDay = Partial<Record<BodyCheckId, boolean>>

export function isBodyCheckId(value: unknown): value is BodyCheckId
{
  return BODY_CHECKS.some((item) => item.id === value)
}

/** Inverte um toque no dia. Os outros toques do mesmo dia ficam. */
export function toggleBodyAnswer(day: BodyDay | undefined, id: BodyCheckId): BodyDay
{
  const prev = day ?? {}
  return { ...prev, [id]: !prev[id] }
}

export function bodyChecked(day: BodyDay | undefined): boolean
{
  if (!day) return false
  return BODY_CHECKS.some((item) => day[item.id] === true)
}
