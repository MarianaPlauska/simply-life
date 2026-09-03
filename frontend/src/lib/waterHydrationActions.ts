import type { HabitoDiario } from '../store/storeTypes'
import { useTaskStore } from '../store/useTaskStore'
import { AGUA_PRESET } from '../constants/healthPresets'
import {
  buildDefaultMlPatch,
  coposParaDoisLitros,
  DEFAULT_AGUA_COPOS,
  isLegacyAgua16L,
  META_AGUA_ML,
  mlPorCopo,
  patchMlPresetChange,
  registrosMl,
} from './waterHydration'
import { isAguaRitualComplete } from './healthRitual'
import { hapticTap } from './haptic'

/** Vibra só quando o copo extra fecha o ritual de hidratação */
export function hapticWaterGoalIfReached(
  prevCount: number,
  nextCount: number,
  meta: number,
): void
{
  if (!isAguaRitualComplete(prevCount, meta) && isAguaRitualComplete(nextCount, meta))
  {
    hapticTap()
  }
}

/** Estado fresco do hábito água - evita patch com config desatualizada. */
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

/** Sobe meta 1,6 L (8×200 ml) para 2 L sem mexer em metas já personalizadas. */
export async function promoteAguaMetaTo2L(fallback?: HabitoDiario): Promise<void>
{
  const agua = freshAguaHabit(fallback)
  if (!agua) return
  const ml = mlPorCopo(agua)
  if (!isLegacyAgua16L(agua.meta_diaria, ml)) return
  await useTaskStore.getState().updateHabitoMeta(agua.id, DEFAULT_AGUA_COPOS)
}

export async function saveAguaDefaultMl(fallback: HabitoDiario | undefined, ml: number): Promise<void>
{
  const ensured = await ensureAguaHabit(fallback)
  if (!ensured) return
  const fresh = freshAguaHabit(ensured)
  const beforeMl = mlPorCopo(fresh)
  const patch = buildDefaultMlPatch(fresh, ml)
  await useTaskStore.getState().updateHabitoConfig(ensured.id, patch)

  const metaAtualMl = ensured.meta_diaria * beforeMl
  if (metaAtualMl === META_AGUA_ML || isLegacyAgua16L(ensured.meta_diaria, beforeMl))
  {
    await useTaskStore.getState().updateHabitoMeta(ensured.id, coposParaDoisLitros(ml))
  }
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

/** Um copo na hora - captura rápida sem abrir Saúde */
export async function addOneWaterCup(): Promise<number | null>
{
  const ensured = await ensureAguaHabit()
  if (!ensured) return null
  const fresh = freshAguaHabit(ensured)
  const ml = mlPorCopo(fresh)
  const next = [...registrosMl(fresh), ml]
  const meta = fresh?.meta_diaria ?? DEFAULT_AGUA_COPOS
  await useTaskStore.getState().setAguaRegistros(ensured.id, next)
  hapticWaterGoalIfReached(registrosMl(fresh).length, next.length, meta)
  return next.length
}
