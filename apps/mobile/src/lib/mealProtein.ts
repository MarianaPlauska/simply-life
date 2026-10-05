/**
 * Proteína das refeições somando no hábito "proteina" (o mesmo dos botões +g da Saúde).
 *
 * O foodLogStore guarda, por refeição, quantos gramas já entraram no hábito e manda só a
 * diferença para cá (positiva ao ganhar proteína, negativa ao corrigir para menos ou apagar).
 * Hoje: usa addProteinGrams do dataStore (progresso do dia). Dia passado: soma no histórico
 * do dia (historico_habitos e log local) pelo saveHabitDay, sem mexer no progresso de hoje.
 * Nunca lança; devolve false quando não deu (sem o hábito carregado ainda), para tentar depois.
 */
import { localTodayIso } from '@simply-life/shared'
import { useDataStore } from '../store/dataStore'
import { habitDailyTotals, saveHabitDay } from './habitDailyTotals'
import { supabaseConfigured } from './supabase'

export async function addMealProteinToHabit(iso: string, deltaGrams: number, isGuest: boolean): Promise<boolean>
{
  if (!Number.isFinite(deltaGrams) || Math.abs(deltaGrams) < 0.05) return true
  try
  {
    const data = useDataStore.getState()
    const prot = data.habits.find((h) => h.tipo === 'proteina')
    if (!prot) return false
    if (iso === localTodayIso())
    {
      // nunca abaixo de zero no dia
      const delta = Math.max(-prot.progressoAtual, deltaGrams)
      if (Math.abs(delta) < 0.05) return true
      // o progresso local muda antes da chamada à nuvem; falha lá não deve somar de novo depois
      await data.addProteinGrams(Math.round(delta * 10) / 10, isGuest).catch(() => undefined)
      return true
    }
    if (iso > localTodayIso()) return true
    const [row] = await habitDailyTotals('proteina', iso, iso)
    const next = Math.max(0, Math.round(((row?.valor ?? 0) + deltaGrams) * 10) / 10)
    await saveHabitDay('proteina', next, { habitoId: prot.id, remote: !isGuest && supabaseConfigured, iso })
    return true
  }
  catch
  {
    return false
  }
}

/** Meta diária de proteína do hábito, quando existe (para a meta da Comida). */
export function proteinHabitGoal(): number | null
{
  const prot = useDataStore.getState().habits.find((h) => h.tipo === 'proteina')
  return prot && prot.metaDiaria > 0 ? prot.metaDiaria : null
}
