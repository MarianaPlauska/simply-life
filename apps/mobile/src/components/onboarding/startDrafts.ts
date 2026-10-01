import {
  ACADEMY_WEEK_DAYS,
  DEFAULT_ACADEMY_SESSION,
  PROTEINA_META_G,
  SONO_META_H,
  AGUA_META_COPOS,
  aguaMlPorCopo,
  configWithWeekPlan,
  findHabit,
  parseBrlNumber,
  weekPlanFromConfig,
  type AcademyWeekKey,
  type AcademyWeekPlan,
  type HabitoDiario,
} from '@simply-life/shared'
import { useDataStore } from '../../store/dataStore'
import { useRoutineStore } from '../../store/routineStore'
import { emptySalary, useSalaryStore } from '../../store/salaryStore'
import { isModuleOn, type AppModuleId } from '../../lib/appModules'

/* ------------------------------------------------------------------ */
/* Saúde                                                              */
/* ------------------------------------------------------------------ */

export type MedDraft = { nome: string; horario: string }

export type HealthDraft = {
  waterGoal: number
  cupMl: number
  sleepGoal: number
  proteinGoal: number
  gymDays: AcademyWeekKey[]
  meds: MedDraft[]
}

export function healthDraftFrom(habits: HabitoDiario[]): HealthDraft
{
  const agua = findHabit(habits, 'agua')
  const sono = findHabit(habits, 'sono')
  const prot = findHabit(habits, 'proteina')
  const treino = findHabit(habits, 'treino')
  const plan = weekPlanFromConfig(treino?.config)
  return {
    waterGoal: agua?.metaDiaria || AGUA_META_COPOS,
    cupMl: agua ? aguaMlPorCopo(agua) : 250,
    sleepGoal: sono?.metaDiaria || SONO_META_H,
    proteinGoal: prot?.metaDiaria || PROTEINA_META_G,
    gymDays: ACADEMY_WEEK_DAYS.map((d) => d.key).filter((k) => (plan[k] ?? []).some((e) => e.name.trim())),
    meds: [],
  }
}

/** Dias escolhidos ganham a sessão padrão (ou mantêm a que já tinham); os outros viram folga. */
function planForDays(current: AcademyWeekPlan, days: AcademyWeekKey[]): AcademyWeekPlan
{
  const plan: AcademyWeekPlan = {}
  for (const d of ACADEMY_WEEK_DAYS)
  {
    if (!days.includes(d.key))
    {
      plan[d.key] = []
      continue
    }
    const kept = (current[d.key] ?? []).filter((e) => e.name.trim())
    plan[d.key] = kept.length ? kept : DEFAULT_ACADEMY_SESSION.map((ex) => ({ ...ex, id: `${ex.id}-${d.key}` }))
  }
  return plan
}

export async function applyHealthDraft(
  draft: HealthDraft,
  enabled: AppModuleId[] | undefined,
  isGuest: boolean,
): Promise<void>
{
  const data = useDataStore.getState()
  if (isModuleOn(enabled, 'water'))
  {
    await data.patchAguaHabit({ metaDiaria: draft.waterGoal, mlPorCopo: draft.cupMl }, isGuest)
  }
  if (isModuleOn(enabled, 'sleep')) await data.setHabitGoal('sono', draft.sleepGoal, isGuest)
  if (isModuleOn(enabled, 'food')) await data.setHabitGoal('proteina', draft.proteinGoal, isGuest)
  if (isModuleOn(enabled, 'gym'))
  {
    const treino = findHabit(useDataStore.getState().habits, 'treino')
    const plan = planForDays(weekPlanFromConfig(treino?.config), draft.gymDays)
    await data.patchTreinoConfig(configWithWeekPlan(treino?.config, plan), isGuest)
  }
  if (isModuleOn(enabled, 'meds'))
  {
    for (const m of draft.meds)
    {
      if (m.nome.trim()) await data.addMedicamento(m.nome.trim(), m.horario.trim() || '08:00', isGuest)
    }
  }
}

/* ------------------------------------------------------------------ */
/* Tarefas e rotina                                                   */
/* ------------------------------------------------------------------ */

export type TasksDraft = {
  week: string[]
  habits: string[]
}

export const EMPTY_TASKS_DRAFT: TasksDraft = { week: ['', '', ''], habits: [] }

export const ROUTINE_PRESETS = [
  'Arrumar a cama',
  'Meditar 5 min',
  'Ler 10 páginas',
  'Caminhar',
  'Alongar',
  'Escrever no diário',
  'Estudar',
  'Sem tela antes de dormir',
]

export async function applyTasksDraft(
  draft: TasksDraft,
  enabled: AppModuleId[] | undefined,
  isGuest: boolean,
): Promise<void>
{
  if (isModuleOn(enabled, 'tasks'))
  {
    const add = useDataStore.getState().addTask
    for (const t of draft.week)
    {
      if (t.trim()) await add(t.trim(), isGuest, undefined, { prioridade: 2 })
    }
  }
  if (isModuleOn(enabled, 'routine') && draft.habits.length)
  {
    const routine = useRoutineStore.getState()
    // sem hidratar antes, salvar por cima apagaria a rotina que já estava no aparelho
    if (!routine.loaded) await routine.hydrate()
    const existing = new Set(useRoutineStore.getState().items.map((i) => i.title.toLowerCase()))
    for (const h of draft.habits)
    {
      if (!existing.has(h.toLowerCase())) useRoutineStore.getState().addHabit(h)
    }
  }
}

/* ------------------------------------------------------------------ */
/* Carteira                                                           */
/* ------------------------------------------------------------------ */

export type FixaDraft = { nome: string; valor: string; dia: string }

export type FinanceDraft = {
  balance: string
  salary: string
  /** true = 5º dia útil; false = dia fixo */
  quintoDiaUtil: boolean
  payday: string
  fixas: FixaDraft[]
  goalTitle: string
  goalValue: string
}

export const EMPTY_FINANCE_DRAFT: FinanceDraft = {
  balance: '',
  salary: '',
  quintoDiaUtil: true,
  payday: '5',
  fixas: [],
  goalTitle: '',
  goalValue: '',
}

export const FIXA_PRESETS = ['Aluguel', 'Condomínio', 'Luz', 'Internet', 'Celular', 'Streaming', 'Academia', 'Escola']

function day(raw: string, fallback: number): number
{
  const n = Math.round(Number(raw.replace(/\D/g, '')))
  return Number.isFinite(n) && n >= 1 && n <= 31 ? n : fallback
}

export async function applyFinanceDraft(
  draft: FinanceDraft,
  enabled: AppModuleId[] | undefined,
  isGuest: boolean,
): Promise<string[]>
{
  const problems: string[] = []
  const data = useDataStore.getState()
  if (isModuleOn(enabled, 'spend'))
  {
    const saldo = parseBrlNumber(draft.balance)
    if (saldo != null)
    {
      const res = await data.setCurrentBalance(saldo, isGuest)
      if (!res.ok && res.error) problems.push(res.error)
    }
    const base = parseBrlNumber(draft.salary)
    if (base != null && base > 0)
    {
      const store = useSalaryStore.getState()
      if (!store.hydrated) await store.hydrate()
      const ok = await useSalaryStore.getState().save({
        ...(useSalaryStore.getState().salary ?? emptySalary()),
        base,
        quintoDiaUtil: draft.quintoDiaUtil,
        diaRecebimento: day(draft.payday, 5),
      })
      if (!ok) problems.push(useSalaryStore.getState().error ?? 'Não consegui salvar o salário')
    }
  }
  if (isModuleOn(enabled, 'bills'))
  {
    for (const f of draft.fixas)
    {
      const valor = parseBrlNumber(f.valor)
      if (!f.nome.trim() || valor == null) continue
      const res = await data.addContaFixa({ nome: f.nome.trim(), valor, diaVencimento: day(f.dia, 10), isGuest })
      if (!res.ok && res.error) problems.push(res.error)
    }
  }
  if (isModuleOn(enabled, 'goals'))
  {
    const meta = parseBrlNumber(draft.goalValue)
    if (draft.goalTitle.trim() && meta != null && meta > 0) data.addFinanceGoal(draft.goalTitle.trim(), meta)
  }
  return problems
}
