/**
 * Energia do AXEL no modo aventura.
 * Enche quando a pessoa cuida do dia. À noite, sem registro, desce um pouco.
 * De manhã volta ao máximo. Nunca mexe em XP, moeda, Elo ou coleção.
 */

export const ENERGY_MAX = 100
export const ENERGY_FLOOR = 20
export const ENERGY_DIP = 15

export type EnergyKind = 'task' | 'water' | 'mood' | 'breathe'

export const ENERGY_FILL: Record<EnergyKind, number> = {
  task: 12,
  water: 8,
  mood: 10,
  breathe: 15,
}

export type AxelEnergyState = {
  energy: number
  day: string | null
  dippedOn: string | null
}

export function fillEnergy(current: number, amount: number): number
{
  const base = Number.isFinite(current) ? current : ENERGY_MAX
  const add = Number.isFinite(amount) ? Math.max(0, amount) : 0
  return Math.min(ENERGY_MAX, Math.max(0, base) + add)
}

/** Dia sem registro: desce no máximo 15, e não passa de 20 para baixo. */
export function endOfDayDip(current: number, actedToday: boolean): number
{
  const base = Math.min(ENERGY_MAX, Math.max(0, current))
  if (actedToday) return base
  return Math.max(ENERGY_FLOOR, base - ENERGY_DIP)
}

export function morningReset(): number
{
  return ENERGY_MAX
}

export function settleAxelEnergy(
  state: AxelEnergyState,
  input: { today: string; hour: number; actedToday: boolean },
): AxelEnergyState
{
  if (state.day !== input.today)
  {
    return { energy: morningReset(), day: input.today, dippedOn: null }
  }
  if (input.hour >= 22 && !input.actedToday && state.dippedOn !== input.today)
  {
    return {
      energy: endOfDayDip(state.energy, false),
      day: input.today,
      dippedOn: input.today,
    }
  }
  return {
    energy: Math.min(ENERGY_MAX, Math.max(0, state.energy)),
    day: state.day,
    dippedOn: state.dippedOn,
  }
}
