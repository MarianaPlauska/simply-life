import { create } from 'zustand'
import {
  demoFinance,
  demoHumor,
  demoTasks,
  demoHabits,
  demoMedicamentos,
  demoCashAccount,
  demoFinanceCards,
  demoContasFixas,
  demoContasAPagar,
  demoFinanceGoals,
  pickMoodCareMessage,
  type FinanceTx,
  type HumorRegistro,
  type MobileTask,
  type HabitoDiario,
  type Medicamento,
  type CashAccount,
  type FinanceCard,
  type ContaFixa,
  type ContaAPagar,
  type FinanceGoal,
  findHabit,
} from '@simply-life/shared'
import { fetchHumorMes, registrarHumor } from '../lib/sync/humor'
import { createTarefa, fetchTarefas, toggleSubtarefa, updateTarefaStatus } from '../lib/sync/tasks'
import { addDespesa, fetchDespesas, parseExpenseQuick } from '../lib/sync/finance'
import { bumpHabitoProgress, fetchHabitos } from '../lib/sync/habits'
import { fetchMedicamentos, toggleMedicamentoTomado } from '../lib/sync/medicamentos'
import {
  fetchCashAccount,
  fetchContasAPagar,
  fetchContasFixas,
  fetchFinanceCards,
} from '../lib/sync/financeAccounts'
import { loadOfflineBundle, saveOfflineBundle } from '../lib/offlineCache'
import { supabaseConfigured } from '../lib/supabase'
import { hapticLight } from '../lib/haptics'

function useLocal(isGuest?: boolean): boolean
{
  return Boolean(isGuest) || !supabaseConfigured
}

type DataState = {
  loading: boolean
  error: string | null
  source: 'remote' | 'demo' | 'idle'
  humor: HumorRegistro[]
  tasks: MobileTask[]
  finance: FinanceTx[]
  habits: HabitoDiario[]
  medicamentos: Medicamento[]
  cashAccount: CashAccount
  financeCards: FinanceCard[]
  contasFixas: ContaFixa[]
  contasAPagar: ContaAPagar[]
  financeGoals: FinanceGoal[]
  lastAxelCare: string | null
  refreshAll: (opts: { isGuest: boolean }) => Promise<void>
  reset: () => void
  addHumor: (humor: number, nota?: string, isGuest?: boolean) => Promise<void>
  addTask: (titulo: string, isGuest?: boolean, notas?: string) => Promise<void>
  addExpenseFromText: (text: string, isGuest?: boolean) => Promise<{ ok: boolean; error?: string }>
  commitDump: (text: string, isGuest?: boolean) => Promise<{ ok: boolean; error?: string; count?: number }>
  toggleTaskCheck: (taskId: string, subId: string, feito: boolean, isGuest?: boolean) => Promise<void>
  toggleTaskDone: (taskId: string, isGuest?: boolean) => Promise<void>
  addWaterCup: (isGuest?: boolean) => Promise<void>
  addProteinGrams: (grams: number, isGuest?: boolean) => Promise<void>
  toggleTreinoDone: (isGuest?: boolean) => Promise<void>
  toggleMedicamento: (id: number, isGuest?: boolean) => Promise<void>
  /** Bloqueia/desbloqueia cartão (estado local + demo) */
  setFinanceCardStatus: (cardId: string, status: FinanceCard['status']) => void
}

export const useDataStore = create<DataState>((set, get) => ({
  loading: false,
  error: null,
  source: 'idle',
  humor: [],
  tasks: [],
  finance: [],
  habits: [],
  medicamentos: [],
  cashAccount: demoCashAccount(),
  financeCards: [],
  contasFixas: [],
  contasAPagar: [],
  financeGoals: [],
  lastAxelCare: null,

  reset: () =>
  {
    set({
      humor: [],
      tasks: [],
      finance: [],
      habits: [],
      medicamentos: [],
      cashAccount: demoCashAccount(),
      financeCards: [],
      contasFixas: [],
      contasAPagar: [],
      financeGoals: [],
      lastAxelCare: null,
      source: 'idle',
      error: null,
      loading: false,
    })
  },

  refreshAll: async ({ isGuest }) =>
  {
    set({ loading: true, error: null })

    if (get().source === 'idle')
    {
      const cached = await loadOfflineBundle()
      if (cached)
      {
        try
        {
          const humor = JSON.parse(cached.humorJson) as HumorRegistro[]
          const tasks = JSON.parse(cached.tasksJson) as MobileTask[]
          if (Array.isArray(humor) && Array.isArray(tasks))
          {
            set({ humor, tasks })
          }
        }
        catch
        {
          /* cache inválido */
        }
      }
    }

    try
    {
      if (useLocal(isGuest))
      {
        const humor = demoHumor()
        const tasks = demoTasks()
        const finance = demoFinance()
        const habits = demoHabits()
        const medicamentos = demoMedicamentos()
        set({
          humor,
          tasks,
          finance,
          habits,
          medicamentos,
          cashAccount: demoCashAccount(),
          financeCards: demoFinanceCards(),
          contasFixas: demoContasFixas(),
          contasAPagar: demoContasAPagar(),
          financeGoals: demoFinanceGoals(),
          source: 'demo',
          loading: false,
        })
        await saveOfflineBundle({
          updatedAt: new Date().toISOString(),
          humorJson: JSON.stringify(humor),
          tasksJson: JSON.stringify(tasks),
        })
        return
      }

      const [humor, tasks, finance, habitsRaw, medicamentosRaw, cash, cards, fixas, bills] =
        await Promise.all([
          fetchHumorMes(90),
          fetchTarefas(),
          fetchDespesas(100),
          fetchHabitos().catch(() => demoHabits()),
          fetchMedicamentos().catch(() => demoMedicamentos()),
          fetchCashAccount().catch(() => demoCashAccount()),
          fetchFinanceCards().catch(() => demoFinanceCards()),
          fetchContasFixas().catch(() => demoContasFixas()),
          fetchContasAPagar().catch(() => demoContasAPagar()),
        ])
      const habits = habitsRaw.length ? habitsRaw : demoHabits()
      const medicamentos = medicamentosRaw.length ? medicamentosRaw : demoMedicamentos()
      set({
        humor,
        tasks,
        finance,
        habits,
        medicamentos,
        cashAccount: cash,
        financeCards: cards.length ? cards : demoFinanceCards(),
        contasFixas: fixas.length ? fixas : demoContasFixas(),
        contasAPagar: bills.length ? bills : demoContasAPagar(),
        financeGoals: demoFinanceGoals(),
        source: 'remote',
        loading: false,
      })
      await saveOfflineBundle({
        updatedAt: new Date().toISOString(),
        humorJson: JSON.stringify(humor),
        tasksJson: JSON.stringify(tasks),
      })
    }
    catch (e)
    {
      const msg = e instanceof Error ? e.message : 'Falha ao sincronizar'
      set({
        error: msg,
        humor: get().humor.length ? get().humor : demoHumor(),
        tasks: get().tasks.length ? get().tasks : demoTasks(),
        finance: get().finance.length ? get().finance : demoFinance(),
        habits: get().habits.length ? get().habits : demoHabits(),
        medicamentos: get().medicamentos.length ? get().medicamentos : demoMedicamentos(),
        cashAccount: get().cashAccount.saldoInicial ? get().cashAccount : demoCashAccount(),
        financeCards: get().financeCards.length ? get().financeCards : demoFinanceCards(),
        contasFixas: get().contasFixas.length ? get().contasFixas : demoContasFixas(),
        contasAPagar: get().contasAPagar.length ? get().contasAPagar : demoContasAPagar(),
        financeGoals: get().financeGoals.length ? get().financeGoals : demoFinanceGoals(),
        source: get().source === 'remote' ? 'remote' : 'demo',
        loading: false,
      })
    }
  },

  addHumor: async (humor, nota, isGuest) =>
  {
    const care = pickMoodCareMessage(humor)
    hapticLight()

    if (useLocal(isGuest))
    {
      const row: HumorRegistro = {
        id: Date.now(),
        data: new Date().toISOString().slice(0, 10),
        humor,
        nota: nota || null,
        created_at: new Date().toISOString(),
      }
      set({ humor: [row, ...get().humor], lastAxelCare: care })
      return
    }
    const saved = await registrarHumor({ humor, nota })
    set({
      humor: [saved, ...get().humor.filter((h) => h.id !== saved.id)],
      lastAxelCare: care,
    })
  },

  addTask: async (titulo, isGuest, notas) =>
  {
    if (useLocal(isGuest))
    {
      const t: MobileTask = {
        id: `local-${Date.now()}`,
        titulo,
        status: 'todo',
        dataVencimento: new Date().toISOString().slice(0, 10),
        horaMinutos: null,
        estimativaMinutos: 30,
        progresso: 0,
        checklist: [],
        anotacao: notas || '',
        prioridade: 2,
      }
      set({ tasks: [t, ...get().tasks] })
      return
    }
    const saved = await createTarefa(titulo, notas)
    set({ tasks: [saved, ...get().tasks] })
  },

  addExpenseFromText: async (text, isGuest) =>
  {
    const parsed = parseExpenseQuick(text)
    if (!parsed) return { ok: false, error: 'Informe valor, ex: café 12,50' }

    if (useLocal(isGuest))
    {
      const tx: FinanceTx = {
        id: `local-${Date.now()}`,
        titulo: parsed.titulo,
        valor: parsed.valor,
        categoria: 'outros',
        data: new Date().toISOString().slice(0, 10),
        tipo: 'despesa',
      }
      set({ finance: [tx, ...get().finance] })
      return { ok: true }
    }

    try
    {
      const saved = await addDespesa(parsed)
      set({ finance: [saved, ...get().finance] })
      return { ok: true }
    }
    catch (e)
    {
      return { ok: false, error: e instanceof Error ? e.message : 'Erro ao salvar' }
    }
  },

  commitDump: async (text, isGuest) =>
  {
    const lines = text
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean)
    if (lines.length === 0) return { ok: false, error: 'Escreva ao menos uma linha' }

    let count = 0
    for (const line of lines)
    {
      if (parseExpenseQuick(line))
      {
        const res = await get().addExpenseFromText(line, isGuest)
        if (!res.ok) return { ok: false, error: res.error, count }
      }
      else
      {
        await get().addTask(line, isGuest)
      }
      count += 1
    }
    return { ok: true, count }
  },

  toggleTaskCheck: async (taskId, subId, feito, isGuest) =>
  {
    set({
      tasks: get().tasks.map((t) =>
      {
        if (t.id !== taskId) return t
        const checklist = t.checklist.map((c) =>
          c.id === subId ? { ...c, feito } : c,
        )
        const doneCount = checklist.filter((c) => c.feito).length
        const progresso = t.status === 'done'
          ? 1
          : checklist.length > 0
            ? doneCount / checklist.length
            : t.progresso
        return { ...t, checklist, progresso }
      }),
    })

    if (useLocal(isGuest) || taskId.startsWith('local-')) return
    await toggleSubtarefa(taskId, subId, feito)
  },

  toggleTaskDone: async (taskId, isGuest) =>
  {
    const current = get().tasks.find((t) => t.id === taskId)
    if (!current) return
    const done = current.status !== 'done'
    hapticLight()
    set({
      tasks: get().tasks.map((t) =>
        t.id === taskId
          ? { ...t, status: done ? 'done' : 'todo', progresso: done ? 1 : 0 }
          : t,
      ),
    })

    if (useLocal(isGuest) || taskId.startsWith('local-')) return
    await updateTarefaStatus(taskId, done)
  },

  addWaterCup: async (isGuest) =>
  {
    const agua = findHabit(get().habits, 'agua')
    if (!agua) return
    const next = Math.min(agua.metaDiaria, agua.progressoAtual + 1)
    hapticLight()
    set({
      habits: get().habits.map((h) =>
        h.id === agua.id ? { ...h, progressoAtual: next } : h,
      ),
    })
    if (useLocal(isGuest) || agua.id.startsWith('h-')) return
    await bumpHabitoProgress(agua.id, next)
  },

  addProteinGrams: async (grams, isGuest) =>
  {
    const prot = findHabit(get().habits, 'proteina')
    if (!prot) return
    const next = prot.progressoAtual + grams
    hapticLight()
    set({
      habits: get().habits.map((h) =>
        h.id === prot.id ? { ...h, progressoAtual: next } : h,
      ),
    })
    if (useLocal(isGuest) || prot.id.startsWith('h-')) return
    await bumpHabitoProgress(prot.id, next)
  },

  toggleTreinoDone: async (isGuest) =>
  {
    const treino = findHabit(get().habits, 'treino')
    if (!treino) return
    const next = treino.progressoAtual >= treino.metaDiaria ? 0 : treino.metaDiaria
    hapticLight()
    set({
      habits: get().habits.map((h) =>
        h.id === treino.id ? { ...h, progressoAtual: next } : h,
      ),
    })
    if (useLocal(isGuest) || treino.id.startsWith('h-')) return
    await bumpHabitoProgress(treino.id, next)
  },

  toggleMedicamento: async (id, isGuest) =>
  {
    const med = get().medicamentos.find((m) => m.id === id)
    if (!med) return
    const next = !med.tomado
    hapticLight()
    set({
      medicamentos: get().medicamentos.map((m) =>
        m.id === id ? { ...m, tomado: next } : m,
      ),
    })
    if (useLocal(isGuest)) return
    try
    {
      await toggleMedicamentoTomado(id, next)
    }
    catch
    {
      /* mantém estado otimista em demo/offline */
    }
  },

  setFinanceCardStatus: (cardId, status) =>
  {
    hapticLight()
    set({
      financeCards: get().financeCards.map((c) =>
        c.id === cardId ? { ...c, status } : c,
      ),
    })
  },
}))
