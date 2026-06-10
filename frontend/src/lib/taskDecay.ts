import type { TarefaUnificada } from '../types'
import type { TemporalHorizon } from './temporalHorizon'

// Degradação térmica — contexto esfria em HOJE / ESTA SEMANA

const DECAY_COLUMNS: TemporalHorizon[] = ['hoje', 'semana']
const THERMAL_DECAY_DAYS = 3

export function getTaskActivityTimestamp(
  createdAt: string | null | undefined,
  lastMovedAt: string | null | undefined,
): number | null
{
  const moved = lastMovedAt ? new Date(lastMovedAt).getTime() : NaN
  const created = createdAt ? new Date(createdAt).getTime() : NaN

  if (!Number.isNaN(moved)) return moved
  if (!Number.isNaN(created)) return created
  return null
}

export function computeDaysStagnant(
  createdAt: string | null | undefined,
  lastMovedAt: string | null | undefined,
  nowMs: number = Date.now(),
): number
{
  const ts = getTaskActivityTimestamp(createdAt, lastMovedAt)
  if (ts === null) return 0
  return Math.floor((nowMs - ts) / 86_400_000)
}

/** Valor efetivo: explícito no modelo ou calculado pela inatividade */
export function resolveDaysStagnant(
  task: TarefaUnificada,
  lastMovedAt: string | null | undefined,
  nowMs: number = Date.now(),
): number
{
  const explicit = task.daysStagnant ?? 0
  const computed = computeDaysStagnant(task.created_at, lastMovedAt, nowMs)
  return Math.max(explicit, computed)
}

export function isThermalDecay(
  horizon: TemporalHorizon | undefined,
  daysStagnant: number,
): boolean
{
  if (horizon == null) return false
  return DECAY_COLUMNS.includes(horizon) && daysStagnant > THERMAL_DECAY_DAYS
}

export const TASK_DECAY_TOOLTIP =
  'Contexto esfriando — rebaixe ao Backlog ou retome com foco'
