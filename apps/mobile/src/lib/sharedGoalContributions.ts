/**
 * Quanto EU fiz em cada dia do ciclo de uma meta junto, a partir do que já
 * anoto no app (princípio 1: ninguém anota duas vezes).
 * Água, proteína, sono e treino: habitDailyTotals (histórico por dia).
 * Foco: sessões do focusLogStore. Tarefas: concluídas (banco e log local).
 * Humor: dia com registro. "livre": registro manual na tela da meta.
 * Corpo (cuidar do corpo juntos): refeições da Comida (foodLogStore), açúcar no
 * limite que a própria pessoa escolheu e "dia cuidando do corpo" (refeição, água,
 * treino, sono ou proteína). Proteína já inclui a das refeições, que o
 * foodLogStore soma no hábito (lib/mealProtein).
 */
import {
  aguaMlPorCopo,
  localTodayIso,
  sharedGoalBackfillDays,
  sharedGoalBodyCareOfDay,
  sharedGoalCycle,
  sharedGoalMealsOfDay,
  sharedGoalSugarOkOfDay,
  sharedGoalValueFromHabit,
  type SharedGoal,
} from '@simply-life/shared'
import { habitDailyTotals, type HabitTipo } from './habitDailyTotals'
import { useDataStore } from '../store/dataStore'
import { useFocusLogStore } from '../store/focusLogStore'
import { usePlanLogStore } from '../store/planLogStore'
import { useAuthStore } from '../store/authStore'
import { useFoodLogStore } from '../store/foodLogStore'

const HABIT_METRICS: Record<string, HabitTipo> = {
  agua: 'agua',
  proteina: 'proteina',
  sono: 'sono',
  treino: 'treino',
}

function localDayOf(iso: string): string
{
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso.slice(0, 10) : localTodayIso(d)
}

/** Refeições e preferências da Comida da conta atual (carrega do aparelho se preciso). */
async function foodState()
{
  const { userId, isGuest } = useAuthStore.getState()
  const owner = isGuest || !userId ? 'guest' : userId
  const st = useFoodLogStore.getState()
  if (!st.loaded || st.owner !== owner) await st.hydrate({ userId, isGuest }).catch(() => undefined)
  return useFoodLogStore.getState()
}

/** Valores por dia (unidade da meta) para os dias do ciclo atual até hoje. */
export async function computeMyGoalDays(
  goal: SharedGoal,
  today = localTodayIso(),
): Promise<Record<string, number> | null>
{
  if (goal.metrica === 'livre' || goal.status !== 'ativa') return null
  const cycle = sharedGoalCycle(goal, today)
  const days = sharedGoalBackfillDays(cycle, today)
  if (days.length === 0) return null
  const from = days[0]!
  const to = days[days.length - 1]!
  const out: Record<string, number> = Object.fromEntries(days.map((d) => [d, 0]))

  if (goal.metrica === 'refeicoes')
  {
    const { meals } = await foodState()
    for (const d of days) out[d] = sharedGoalMealsOfDay(meals, d)
    return out
  }

  if (goal.metrica === 'acucar_ok')
  {
    const { meals, prefs } = await foodState()
    // sem limite escolhido (ou com os nutrientes escondidos, sem estimativa de açúcar)
    // a pessoa não contribui; a tela da meta explica só para ela
    if (prefs.metaAcucar == null || !prefs.mostrarCalorias) return null
    for (const d of days) out[d] = sharedGoalSugarOkOfDay(meals, d, prefs.metaAcucar) ?? 0
    return out
  }

  if (goal.metrica === 'corpo')
  {
    const [{ meals }, agua, treino, sono, proteina] = await Promise.all([
      foodState(),
      habitDailyTotals('agua', from, to),
      habitDailyTotals('treino', from, to),
      habitDailyTotals('sono', from, to),
      habitDailyTotals('proteina', from, to),
    ])
    const byDay = (rows: { data: string; valor: number }[]) => new Map(rows.map((r) => [r.data, r.valor]))
    const a = byDay(agua)
    const t = byDay(treino)
    const s = byDay(sono)
    const p = byDay(proteina)
    for (const d of days)
    {
      out[d] = sharedGoalBodyCareOfDay({
        refeicoes: sharedGoalMealsOfDay(meals, d),
        agua: a.get(d),
        treino: t.get(d),
        sono: s.get(d),
        proteina: p.get(d),
      })
    }
    return out
  }

  const tipo = HABIT_METRICS[goal.metrica]
  if (tipo)
  {
    const rows = await habitDailyTotals(tipo, from, to)
    // água vem em copos: converte para ml pelo tamanho do copo atual
    const ml = tipo === 'agua'
      ? aguaMlPorCopo(useDataStore.getState().habits.find((h) => h.tipo === 'agua'))
      : 1
    for (const r of rows)
    {
      if (!(r.data in out)) continue
      const raw = tipo === 'agua' ? r.valor * ml : tipo === 'treino' ? (r.valor > 0 ? 1 : 0) : r.valor
      out[r.data] = sharedGoalValueFromHabit(goal.metrica, raw)
    }
    return out
  }

  if (goal.metrica === 'foco')
  {
    for (const s of useFocusLogStore.getState().sessions)
    {
      const d = localDayOf(s.at)
      if (d in out) out[d] = (out[d] ?? 0) + Math.max(0, s.minutes)
    }
    return out
  }

  if (goal.metrica === 'tarefas')
  {
    const seen = new Map<string, Set<string>>()
    const add = (taskId: string, at: string | null | undefined) =>
    {
      if (!at) return
      const d = localDayOf(at)
      if (!(d in out)) return
      const set = seen.get(d) ?? new Set<string>()
      set.add(taskId)
      seen.set(d, set)
    }
    for (const t of useDataStore.getState().tasks)
    {
      if (t.status === 'done') add(t.id, t.concluidoEm)
    }
    for (const c of usePlanLogStore.getState().completions) add(c.taskId, c.at)
    for (const [d, set] of seen) out[d] = set.size
    return out
  }

  if (goal.metrica === 'humor')
  {
    for (const h of useDataStore.getState().humor)
    {
      const d = String(h.data).slice(0, 10)
      if (d in out) out[d] = 1
    }
    return out
  }

  return null
}
