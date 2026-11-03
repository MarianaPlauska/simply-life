/**
 * Medidor de energia do dia. Só informa.
 * Não altera ordem de tarefas, capacidade nem o ritual da noite.
 */
import type { TaskEnergy } from './taskPrompt'

export const DEFAULT_ENERGY_STOCK = 8

const POINTS: Record<TaskEnergy, number> = { baixa: 1, media: 2, alta: 3 }

export function energyPoints(level: TaskEnergy): number
{
  return POINTS[level]
}

/** Quando a tarefa não tem energia marcada, a duração sugere. */
export function energyFromMinutes(minutos: number): TaskEnergy
{
  if (minutos >= 90) return 'alta'
  if (minutos <= 20) return 'baixa'
  return 'media'
}

export type EnergyBudget = {
  stock: number
  used: number
  remaining: number
  over: boolean
  phrase: string
}

export function energyBudget(used: number, stock = DEFAULT_ENERGY_STOCK): EnergyBudget
{
  const safeStock = Math.max(1, Math.round(stock))
  const safeUsed = Math.max(0, Math.round(used))
  const remaining = safeStock - safeUsed
  const over = remaining < 0
  const phrase = over
    ? `O dia pede ${safeUsed} pontos e o medidor está em ${safeStock}. O plano não muda sozinho.`
    : `Energia do dia: ${safeUsed} de ${safeStock} pontos.`
  return { stock: safeStock, used: safeUsed, remaining, over, phrase }
}

/** Sugestão de medidor menor. A pessoa aplica se quiser. O dia continua igual. */
export function suggestedEnergyStock(
  stock: number,
  signals: { humorLow?: boolean; manyHigh?: boolean },
): number | null
{
  let next = stock
  if (signals.humorLow) next -= 2
  if (signals.manyHigh) next -= 1
  next = Math.max(4, next)
  return next < stock ? next : null
}
