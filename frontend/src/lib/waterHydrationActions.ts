import type { HabitoDiario } from '../store/storeTypes'
import { useTaskStore } from '../store/useTaskStore'
import { AGUA_PRESET } from '../constants/healthPresets'
import {
  buildDefaultMlPatch,
  patchMlPresetChange,
} from '../lib/waterHydration'

/** Estado fresco do hábito água — evita patch com config desatualizada. */
export function freshAguaHabit(fallback?: HabitoDiario): HabitoDiario | undefined
{
  const id = fallback?.id
  if (id)
  {
    const found = useTaskStore.getState().habitos.find((h) => h.id === id)
    if (found) return found
  }
  return fallback ?? useTaskStore.getState().habitos.find((h) => h.tipo === 'agua')
}

export async function ensureAguaHabit(fallback?: HabitoDiario): Promise<HabitoDiario | null>
{
  const existing = freshAguaHabit(fallback)
  if (existing) return existing
  return useTaskStore.getState().ensureHealthHabit(AGUA_PRESET)
}

export async function saveAguaDefaultMl(fallback: HabitoDiario | undefined, ml: number): Promise<void>
{
  const ensured = await ensureAguaHabit(fallback)
  if (!ensured) return
  const fresh = freshAguaHabit(ensured)
  const patch = buildDefaultMlPatch(fresh, ml)
  await useTaskStore.getState().updateHabitoConfig(ensured.id, patch)
}

export async function saveAguaMlPreset(
  fallback: HabitoDiario | undefined,
  action: 'add' | 'remove',
  ml: number,
): Promise<void>
{
  const ensured = await ensureAguaHabit(fallback)
  if (!ensured) return
  const fresh = freshAguaHabit(ensured)
  const patch = patchMlPresetChange(fresh, action, ml)
  await useTaskStore.getState().updateHabitoConfig(ensured.id, patch)
}
