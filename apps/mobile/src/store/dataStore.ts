import { create } from 'zustand'
import {
  demoFinance,
  demoHumor,
  demoTasks,
  demoHabits,
  starterHabits,
  demoMedicamentos,
  demoCashAccount,
  emptyCashAccount,
  demoFinanceCards,
  demoContasFixas,
  demoContasAPagar,
  demoFinanceGoals,
  pickMoodCareMessage,
  dueDateForBucket,
  type DueBucket,
  type FinanceCategory,
  type FinanceGoal,
  type FinanceTx,
  type HumorRegistro,
  type ImportedTransactionRow,
  type MobileTask,
  type TaskStatus,
  type HabitoDiario,
  type Medicamento,
  type CashAccount,
  type FinanceCard,
  type ContaFixa,
  type FinancePaymentMethod,
  type ContaAPagar,
  findHabit,
  ensureSonoHabit,
  isDemoHumorRow,
  localTodayIso,
  stampEvoPct,
  invoicePaidKey,
} from '@simply-life/shared'
import { fetchHumorMes, registrarHumor } from '../lib/sync/humor'
import { createTarefa, fetchTarefas, insertSubtarefa, archiveTarefa, patchTarefa, persistTaskStatus, toggleSubtarefa, updateTarefaDue, updateTarefaStatus } from '../lib/sync/tasks'
import { addDespesa, fetchDespesas, parseExpenseQuick } from '../lib/sync/finance'
import { bumpHabitoProgress, fetchHabitos, patchHabitoAgua } from '../lib/sync/habits'
import {
  deleteMedicamento,
  fetchMedicamentos,
  insertMedicamento,
  toggleMedicamentoTomado,
} from '../lib/sync/medicamentos'
import {
  fetchCashAccount,
  fetchContasAPagar,
  fetchContasFixas,
  fetchFinanceCards,
  insertContaFixa,
  updateContaAPagarStatus,
  updateContaFixa,
} from '../lib/sync/financeAccounts'
import { loadOfflineBundle, saveOfflineBundle } from '../lib/offlineCache'
import { supabaseConfigured } from '../lib/supabase'
import { hapticLight } from '../lib/haptics'
import { useGamificationStore } from './gamificationStore'
import { useWaterLogStore } from './waterLogStore'
import { useBodyWeekStore } from './bodyWeekStore'
import { useActivityStore } from './activityStore'
import { useDuePaidStore } from './duePaidStore'

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
  addTask: (
    titulo: string,
    isGuest?: boolean,
    notas?: string,
    extra?: {
      dataVencimento?: string | null
      horaMinutos?: number | null
      estimativaMinutos?: number
      prioridade?: 1 | 2 | 3
      status?: TaskStatus
      checklist?: string[]
    },
  ) => Promise<void>
  addExpenseFromText: (
    text: string,
    isGuest?: boolean,
    opts?: {
      categoria?: FinanceCategory
      data?: string
      tipo?: 'despesa' | 'receita'
      formaPagamento?: FinancePaymentMethod
      cardId?: string
      folderId?: string
      escopo?: import('@simply-life/shared').FinanceEscopo
      pagoContaCasal?: boolean
      partnerWorkspaceId?: string | null
    },
  ) => Promise<{ ok: boolean; error?: string }>
  commitDump: (text: string, isGuest?: boolean) => Promise<{ ok: boolean; error?: string; count?: number }>
  toggleTaskCheck: (taskId: string, subId: string, feito: boolean, isGuest?: boolean) => Promise<void>
  toggleTaskDone: (taskId: string, isGuest?: boolean) => Promise<void>
  setTaskStatus: (taskId: string, status: TaskStatus, isGuest?: boolean) => Promise<void>
  addWaterCup: (isGuest?: boolean) => Promise<void>
  removeWaterCup: (isGuest?: boolean) => Promise<void>
  patchAguaHabit: (patch: { metaDiaria?: number; mlPorCopo?: number }, isGuest?: boolean) => Promise<void>
  addProteinGrams: (grams: number, isGuest?: boolean) => Promise<void>
  setSleepHours: (hours: number, isGuest?: boolean) => Promise<void>
  toggleTreinoDone: (isGuest?: boolean) => Promise<void>
  toggleMedicamento: (id: number, isGuest?: boolean) => Promise<void>
  addMedicamento: (nome: string, horario: string, isGuest?: boolean) => Promise<{ error?: string }>
  removeMedicamento: (id: number, isGuest?: boolean) => Promise<void>
  moveTaskBucket: (taskId: string, bucket: DueBucket, isGuest?: boolean) => Promise<void>
  importFinanceRows: (rows: ImportedTransactionRow[], isGuest?: boolean) => Promise<number>
  addFinanceGoal: (titulo: string, meta: number) => void
  addCardSpend: (
    cardId: string,
    valor: number,
    titulo: string,
    isGuest?: boolean,
    opts?: { data?: string; categoria?: FinanceCategory; somarFatura?: boolean; folderId?: string },
  ) => Promise<{ ok: boolean; error?: string }>
  payCardInvoice: (
    cardId: string,
    isGuest?: boolean,
  ) => Promise<{ ok: boolean; error?: string }>
  addContaFixa: (input: {
    nome: string
    valor: number
    categoria?: string
    diaVencimento?: number
    isGuest?: boolean
  }) => Promise<{ ok: boolean; error?: string; id?: number }>
  patchContaFixa: (
    id: number,
    patch: Partial<Pick<ContaFixa, 'nome' | 'valor' | 'diaVencimento' | 'categoria' | 'ativa'>>,
    isGuest?: boolean,
  ) => Promise<{ ok: boolean; error?: string }>
  markContaAPagar: (id: number, paga: boolean, isGuest?: boolean) => Promise<void>
  patchTaskNotes: (taskId: string, notes: string) => void
  patchTask: (taskId: string, patch: Partial<MobileTask>, isGuest?: boolean) => Promise<void>
  removeTask: (taskId: string, isGuest?: boolean) => Promise<void>
  addChecklistItem: (taskId: string, texto: string, isGuest?: boolean) => Promise<void>
  /** Bloqueia/desbloqueia cartão (estado local + demo) */
  setFinanceCardStatus: (cardId: string, status: FinanceCard['status']) => void
  /** Atualiza perfil do cartão (local/demo) */
  updateFinanceCard: (cardId: string, patch: Partial<FinanceCard>) => void
  addFinanceCard: (input: {
    nome: string
    limite: number
    diaVencimento: number
    bandeira?: FinanceCard['bandeira']
    tipoGradiente?: FinanceCard['tipoGradiente']
    titular?: string
    numeroMascarado?: string
  }) => FinanceCard
  removeFinanceCard: (cardId: string) => void
}

async function writeOffline(state: {
  humor: HumorRegistro[]
  tasks: MobileTask[]
  habits: HabitoDiario[]
}): Promise<void>
{
  await saveOfflineBundle({
    updatedAt: new Date().toISOString(),
    humorJson: JSON.stringify(state.humor.filter((h) => !isDemoHumorRow(h))),
    tasksJson: JSON.stringify(state.tasks),
    habitsJson: JSON.stringify(state.habits),
  })
}

function parseCachedHabits(raw: string | undefined): HabitoDiario[]
{
  if (!raw) return []
  try
  {
    const v = JSON.parse(raw) as HabitoDiario[]
    return Array.isArray(v) ? v : []
  }
  catch
  {
    return []
  }
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
  cashAccount: emptyCashAccount(),
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
      cashAccount: emptyCashAccount(),
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
    const cached = await loadOfflineBundle()

    if (get().source === 'idle' && cached)
    {
      try
      {
        const humor = JSON.parse(cached.humorJson) as HumorRegistro[]
        const tasks = JSON.parse(cached.tasksJson) as MobileTask[]
        const habits = parseCachedHabits(cached.habitsJson)
        if (Array.isArray(humor) && Array.isArray(tasks))
        {
          set({
            humor,
            tasks,
            ...(habits.length ? { habits } : {}),
          })
        }
      }
      catch
      {
        /* cache inválido */
      }
    }

    try
    {
      if (useLocal(isGuest))
      {
        const cachedHumor = (() =>
        {
          try
          {
            return JSON.parse((cached?.humorJson ?? '[]')) as HumorRegistro[]
          }
          catch
          {
            return [] as HumorRegistro[]
          }
        })()
        const liveReal = get().humor.filter((h) => !isDemoHumorRow(h))
        const cachedReal = (Array.isArray(cachedHumor) ? cachedHumor : []).filter(
          (h) => !isDemoHumorRow(h),
        )
        const byId = new Map<number, HumorRegistro>()
        for (const h of [...cachedReal, ...liveReal]) byId.set(h.id, h)
        const real = [...byId.values()]
        const demo = demoHumor()
        const humor = [
          ...real,
          ...demo.filter((d) => !real.some((r) => r.data === d.data)),
        ]
        const cachedHabits = parseCachedHabits(cached?.habitsJson)
        const keepHabits = get().habits.length > 0
          ? get().habits
          : (cachedHabits.length ? cachedHabits : demoHabits())
        const keepTasks = get().source === 'demo' && get().tasks.length > 0
          ? get().tasks
          : demoTasks()
        const keepFinance = get().source === 'demo' && get().finance.length > 0
          ? get().finance
          : demoFinance()
        set({
          humor,
          tasks: keepTasks,
          finance: keepFinance,
          habits: ensureSonoHabit(keepHabits),
          medicamentos: get().source === 'demo' && get().medicamentos.length
            ? get().medicamentos
            : demoMedicamentos(),
          cashAccount: get().source === 'demo' ? get().cashAccount : demoCashAccount(),
          financeCards: get().source === 'demo' && get().financeCards.length
            ? get().financeCards
            : demoFinanceCards(),
          contasFixas: get().source === 'demo' && get().contasFixas.length
            ? get().contasFixas
            : demoContasFixas(),
          contasAPagar: get().source === 'demo' && get().contasAPagar.length
            ? get().contasAPagar
            : demoContasAPagar(),
          financeGoals: get().source === 'demo' && get().financeGoals.length
            ? get().financeGoals
            : demoFinanceGoals(),
          source: 'demo',
          loading: false,
        })
        await writeOffline({ humor: real, tasks: keepTasks, habits: ensureSonoHabit(keepHabits) })
        useBodyWeekStore.getState().hydrate()
        useBodyWeekStore.getState().seedDemoIfEmpty()
        return
      }

      const [humor, tasks, finance, habitsRaw, medicamentosRaw, cash, cards, fixas, bills] =
        await Promise.all([
          fetchHumorMes(90),
          fetchTarefas(),
          fetchDespesas(),
          fetchHabitos().catch(() => [] as HabitoDiario[]),
          fetchMedicamentos().catch(() => [] as Medicamento[]),
          fetchCashAccount().catch(() => emptyCashAccount()),
          fetchFinanceCards().catch(() => [] as FinanceCard[]),
          fetchContasFixas().catch(() => [] as ContaFixa[]),
          fetchContasAPagar().catch(() => [] as ContaAPagar[]),
        ])
      const habits = ensureSonoHabit(habitsRaw.length ? habitsRaw : starterHabits())
      set({
        humor,
        tasks,
        finance,
        habits,
        medicamentos: medicamentosRaw,
        cashAccount: cash,
        financeCards: cards,
        contasFixas: fixas,
        contasAPagar: bills,
        financeGoals: [],
        source: 'remote',
        loading: false,
      })
      await writeOffline({ humor, tasks, habits })
      useBodyWeekStore.getState().hydrate()
    }
    catch (e)
    {
      const msg = e instanceof Error ? e.message : 'Falha ao sincronizar'
      set({
        error: msg,
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
        data: localTodayIso(),
        humor,
        nota: nota || null,
        created_at: new Date().toISOString(),
      }
      const next = [row, ...get().humor.filter((h) =>
        !((h.data || '').slice(0, 10) === row.data && !isDemoHumorRow(h)),
      )]
      set({ humor: next, lastAxelCare: care })
      await writeOffline(get())
      useActivityStore.getState().markAction('mood')
      return
    }
    const saved = await registrarHumor({ humor, nota })
    const next = [saved, ...get().humor.filter((h) => h.id !== saved.id)]
    set({
      humor: next,
      lastAxelCare: care,
    })
    await writeOffline(get())
    useActivityStore.getState().markAction('mood')
  },

  addTask: async (titulo, isGuest, notas, extra) =>
  {
    const prioridade = extra?.prioridade ?? 2
    const estimativaMinutos = extra?.estimativaMinutos ?? 30
    const horaMinutos = extra?.horaMinutos ?? null
    const dataVencimento =
      extra && Object.prototype.hasOwnProperty.call(extra, 'dataVencimento')
        ? extra.dataVencimento ?? null
        : new Date().toISOString().slice(0, 10)
    const status = extra?.status ?? 'todo'
    const checklist = (extra?.checklist ?? []).map((t) => t.trim()).filter(Boolean)

    if (useLocal(isGuest))
    {
      const t: MobileTask = {
        id: `local-${Date.now()}`,
        titulo,
        status,
        dataVencimento,
        horaMinutos,
        estimativaMinutos,
        progresso: status === 'done' ? 1 : status === 'doing' ? 0.4 : 0,
        checklist: checklist.map((texto, i) => ({
          id: `c-${Date.now()}-${i}`,
          texto,
          feito: false,
        })),
        anotacao: notas || '',
        prioridade,
      }
      set({ tasks: [t, ...get().tasks] })
      return
    }
    const saved = await createTarefa(titulo, notas, {
      dataVencimento,
      horaMinutos,
      estimativaMinutos,
      prioridade,
      status,
    })
    set({ tasks: [saved, ...get().tasks] })
    for (const texto of checklist)
    {
      await get().addChecklistItem(saved.id, texto, isGuest)
    }
  },

  addExpenseFromText: async (text, isGuest, opts) =>
  {
    const parsed = parseExpenseQuick(text)
    if (!parsed) return { ok: false, error: 'Informe valor, ex: café 12,50' }

    const tipo = opts?.tipo === 'receita' ? 'receita' : 'despesa'
    const formaPagamento = opts?.formaPagamento
    const cardId = opts?.cardId

    if (useLocal(isGuest))
    {
      const tx: FinanceTx = {
        id: `local-${Date.now()}`,
        titulo: parsed.titulo,
        valor: parsed.valor,
        categoria: opts?.categoria ?? 'outros',
        data: opts?.data || new Date().toISOString().slice(0, 10),
        tipo,
        cardId,
        formaPagamento,
        folderId: opts?.folderId,
        escopo: opts?.escopo ?? 'pessoal',
        pagoContaCasal: Boolean(opts?.pagoContaCasal && opts?.escopo !== 'casal'),
      }
      set({ finance: [tx, ...get().finance] })
      useGamificationStore.getState().grantXp(8, tipo === 'receita' ? 'Receita lançada' : 'Gasto lançado', parsed.titulo)
      useGamificationStore.getState().unlockIf('finance_log')
      useActivityStore.getState().markAction('finance')
      return { ok: true }
    }

    try
    {
      const saved = await addDespesa({
        ...parsed,
        categoria: opts?.categoria,
        data: opts?.data,
        tipo,
        formaPagamento,
        cardId,
        folderId: opts?.folderId,
        escopo: opts?.escopo,
        pagoContaCasal: opts?.pagoContaCasal,
        partnerWorkspaceId: opts?.partnerWorkspaceId,
      })
      set({ finance: [saved, ...get().finance] })
      useGamificationStore.getState().grantXp(8, tipo === 'receita' ? 'Receita lançada' : 'Gasto lançado', parsed.titulo)
      useGamificationStore.getState().unlockIf('finance_log')
      useActivityStore.getState().markAction('finance')
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
          ? {
              ...t,
              status: done ? 'done' : 'todo',
              progresso: done ? 1 : 0,
              anotacao: stampEvoPct(t.anotacao, done ? 100 : 0),
            }
          : t,
      ),
    })

    if (done)
    {
      useGamificationStore.getState().grantXp(12, 'Tarefa concluída', current.titulo)
      useGamificationStore.getState().unlockIf('first_task')
      useActivityStore.getState().markAction('task')
    }

    if (useLocal(isGuest) || taskId.startsWith('local-')) return
    await updateTarefaStatus(taskId, done)
    const next = get().tasks.find((t) => t.id === taskId)
    if (next)
    {
      await patchTarefa(taskId, { notas_locais: next.anotacao || null })
    }
  },

  setTaskStatus: async (taskId, status, isGuest) =>
  {
    const current = get().tasks.find((t) => t.id === taskId)
    if (!current || current.status === status) return
    hapticLight()
    set({
      tasks: get().tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status,
              progresso: status === 'done' ? 1 : status === 'doing' ? Math.max(t.progresso, 0.4) : 0,
            }
          : t,
      ),
    })
    if (status === 'done' && current.status !== 'done')
    {
      useGamificationStore.getState().grantXp(12, 'Tarefa concluída', current.titulo)
      useGamificationStore.getState().unlockIf('first_task')
      useActivityStore.getState().markAction('task')
    }
    if (useLocal(isGuest) || taskId.startsWith('local-')) return
    await persistTaskStatus(taskId, status)
  },

  addWaterCup: async (isGuest) =>
  {
    const agua = findHabit(get().habits, 'agua')
    if (!agua) return
    const next = agua.progressoAtual + 1
    hapticLight()
    set({
      habits: get().habits.map((h) =>
        h.id === agua.id ? { ...h, progressoAtual: next } : h,
      ),
    })
    useWaterLogStore.getState().recordSip(next)
    useActivityStore.getState().markAction('water')
    if (useLocal(isGuest) || agua.id.startsWith('h-'))
    {
      await writeOffline(get())
      return
    }
    await bumpHabitoProgress(agua.id, next)
    await writeOffline(get())
  },

  removeWaterCup: async (isGuest) =>
  {
    const agua = findHabit(get().habits, 'agua')
    if (!agua || agua.progressoAtual <= 0) return
    const next = agua.progressoAtual - 1
    hapticLight()
    set({
      habits: get().habits.map((h) =>
        h.id === agua.id ? { ...h, progressoAtual: next } : h,
      ),
    })
    useWaterLogStore.getState().recordSip(next)
    if (useLocal(isGuest) || agua.id.startsWith('h-'))
    {
      await writeOffline(get())
      return
    }
    await bumpHabitoProgress(agua.id, next)
    await writeOffline(get())
  },

  patchAguaHabit: async (patch, isGuest) =>
  {
    const agua = findHabit(get().habits, 'agua')
    if (!agua) return
    const next: HabitoDiario = {
      ...agua,
      metaDiaria: patch.metaDiaria ?? agua.metaDiaria,
      mlPorCopo: patch.mlPorCopo ?? agua.mlPorCopo,
      config: {
        ...(agua.config ?? {}),
        ...(patch.mlPorCopo != null ? { ml_por_copo: patch.mlPorCopo } : {}),
      },
    }
    set({
      habits: get().habits.map((h) => (h.id === agua.id ? next : h)),
    })
    if (useLocal(isGuest) || agua.id.startsWith('h-'))
    {
      await writeOffline(get())
      return
    }
    await patchHabitoAgua(
      agua.id,
      {
        metaDiaria: next.metaDiaria,
        mlPorCopo: next.mlPorCopo,
      },
      next.config,
    )
    await writeOffline(get())
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

  setSleepHours: async (hours, isGuest) =>
  {
    const rounded = Math.round(hours * 2) / 2
    let habits = ensureSonoHabit(get().habits)
    if (habits !== get().habits) set({ habits })
    const sono = findHabit(habits, 'sono')
    if (!sono) return
    hapticLight()
    set({
      habits: get().habits.map((h) =>
        h.id === sono.id ? { ...h, progressoAtual: rounded } : h,
      ),
    })
    useBodyWeekStore.getState().recordSleep(rounded)
    if (useLocal(isGuest) || sono.id.startsWith('h-'))
    {
      await writeOffline(get())
      return
    }
    await bumpHabitoProgress(sono.id, rounded)
    await writeOffline(get())
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
    useBodyWeekStore.getState().recordWorkout(next > 0)
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

  updateFinanceCard: (cardId, patch) =>
  {
    hapticLight()
    set({
      financeCards: get().financeCards.map((c) =>
        c.id === cardId ? { ...c, ...patch, id: c.id } : c,
      ),
    })
  },

  addFinanceCard: (input) =>
  {
    hapticLight()
    const card: FinanceCard = {
      id: `c-${Date.now()}`,
      nome: input.nome.trim(),
      limite: input.limite,
      diaVencimento: input.diaVencimento,
      status: 'ativo',
      bandeira: input.bandeira ?? 'mastercard',
      tipoGradiente: input.tipoGradiente ?? 'copper',
      numeroMascarado:
        input.numeroMascarado
        ?? `•••• ${String(Math.floor(1000 + Math.random() * 9000))}`,
      titular: input.titular?.trim() || input.nome.trim() || 'Titular',
      faturaAberta: 0,
    }
    set({ financeCards: [...get().financeCards, card] })
    return card
  },

  removeFinanceCard: (cardId) =>
  {
    hapticLight()
    set({
      financeCards: get().financeCards.filter((c) => c.id !== cardId),
    })
  },

  moveTaskBucket: async (taskId, bucket, isGuest) =>
  {
    const due = dueDateForBucket(bucket)
    set({
      tasks: get().tasks.map((t) =>
        t.id === taskId ? { ...t, dataVencimento: due } : t,
      ),
    })
    useGamificationStore.getState().logEvent(
      'decision',
      'Tarefa movida',
      `${taskId} → ${bucket}`,
    )
    if (useLocal(isGuest) || taskId.startsWith('local-')) return
    await updateTarefaDue(taskId, due)
  },

  importFinanceRows: async (rows, isGuest) =>
  {
    let n = 0
    for (const row of rows)
    {
      const tx: FinanceTx = {
        id: `imp-${Date.now()}-${n}`,
        titulo: row.descricao,
        valor: row.valor,
        categoria: (row.categoria as FinanceCategory) || 'outros',
        data: row.data,
        tipo: row.tipo,
      }
      if (useLocal(isGuest))
      {
        set({ finance: [tx, ...get().finance] })
      }
      else
      {
        try
        {
          const saved = await addDespesa({
            titulo: row.descricao,
            valor: row.valor,
            data: row.data,
            tipo: row.tipo,
            categoria: (row.categoria as FinanceCategory) || 'outros',
          })
          set({ finance: [saved, ...get().finance] })
        }
        catch
        {
          set({ finance: [tx, ...get().finance] })
        }
      }
      n += 1
    }
    return n
  },

  addFinanceGoal: (titulo, meta) =>
  {
    const goal: FinanceGoal = {
      id: Date.now(),
      titulo: titulo.trim(),
      meta,
      atual: 0,
    }
    set({ financeGoals: [goal, ...get().financeGoals] })
  },

  addContaFixa: async (input) =>
  {
    const nome = input.nome.trim()
    if (!nome || !(input.valor > 0))
    {
      return { ok: false, error: 'Informe nome e valor da conta fixa' }
    }
    const dia = input.diaVencimento ?? new Date().getDate()
    if (useLocal(input.isGuest))
    {
      const fixa: ContaFixa = {
        id: Date.now(),
        nome,
        valor: input.valor,
        diaVencimento: dia,
        categoria: input.categoria || 'outros',
        ativa: true,
      }
      set({ contasFixas: [...get().contasFixas, fixa] })
      return { ok: true, id: fixa.id }
    }
    try
    {
      const saved = await insertContaFixa({
        nome,
        valor: input.valor,
        diaVencimento: dia,
        categoria: input.categoria,
      })
      set({ contasFixas: [...get().contasFixas, saved] })
      return { ok: true, id: saved.id }
    }
    catch (e)
    {
      return { ok: false, error: e instanceof Error ? e.message : 'Erro ao salvar fixa' }
    }
  },

  patchContaFixa: async (id, patch, isGuest) =>
  {
    const current = get().contasFixas.find((c) => c.id === id)
    if (!current) return { ok: false, error: 'Conta fixa não encontrada' }
    const next: ContaFixa = { ...current, ...patch }
    set({
      contasFixas: get().contasFixas.map((c) => (c.id === id ? next : c)),
    })
    if (useLocal(isGuest)) return { ok: true }
    try
    {
      await updateContaFixa(id, {
        nome: next.nome,
        valor: next.valor,
        diaVencimento: next.diaVencimento,
        categoria: next.categoria,
        ativa: next.ativa,
      })
      return { ok: true }
    }
    catch (e)
    {
      return { ok: false, error: e instanceof Error ? e.message : 'Erro ao atualizar fixa' }
    }
  },

  markContaAPagar: async (id, paga, isGuest) =>
  {
    hapticLight()
    set({
      contasAPagar: get().contasAPagar.map((b) =>
        b.id === id ? { ...b, status: paga ? 'paga' : 'aberta' } : b,
      ),
    })
    if (paga) useActivityStore.getState().markAction('finance')
    if (useLocal(isGuest)) return
    try
    {
      await updateContaAPagarStatus(id, paga)
    }
    catch
    {
      /* tabela pode não existir; estado local permanece */
    }
  },

  addCardSpend: async (cardId, valor, titulo, isGuest, opts) =>
  {
    const card = get().financeCards.find((c) => c.id === cardId)
    const label = titulo.trim() || 'Compra'
    const tagged = card ? `[${card.nome}] ${label}` : label
    const data = opts?.data || new Date().toISOString().slice(0, 10)
    const categoria = opts?.categoria ?? 'compras'
    const somarFatura = opts?.somarFatura !== false
    if (somarFatura)
    {
      const nextCards = get().financeCards.map((c) =>
      {
        if (c.id !== cardId) return c
        return { ...c, faturaAberta: (c.faturaAberta ?? 0) + valor }
      })
      set({ financeCards: nextCards })
    }
    if (useLocal(isGuest))
    {
      const tx: FinanceTx = {
        id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        titulo: tagged,
        valor,
        categoria,
        data,
        tipo: 'despesa',
        cardId,
        formaPagamento: 'cartao',
        folderId: opts?.folderId,
      }
      set({ finance: [tx, ...get().finance] })
      useGamificationStore.getState().logEvent('xp', 'Gasto no cartão', tagged)
      return { ok: true }
    }
    const res = await get().addExpenseFromText(`${tagged} ${valor}`, isGuest, {
      categoria,
      data,
      formaPagamento: 'cartao',
      cardId,
      folderId: opts?.folderId,
    })
    if (res.ok)
    {
      const first = get().finance[0]
      if (first && !first.cardId)
      {
        set({
          finance: get().finance.map((t, i) =>
            i === 0 ? { ...t, cardId, titulo: tagged, formaPagamento: 'cartao' } : t,
          ),
        })
      }
    }
    return res
  },

  payCardInvoice: async (cardId, isGuest) =>
  {
    const card = get().financeCards.find((c) => c.id === cardId)
    if (!card) return { ok: false, error: 'Cartão não encontrado' }
    const ym = new Date().toISOString().slice(0, 7)
    const key = invoicePaidKey(cardId, ym)
    if (useDuePaidStore.getState().isPaid(key))
    {
      return { ok: false, error: 'Fatura deste mês já foi paga' }
    }
    const fromCard = card.faturaAberta ?? 0
    const fromTxs = get().finance
      .filter((t) => t.tipo === 'despesa' && t.cardId === cardId && String(t.data).startsWith(ym))
      .reduce((a, t) => a + t.valor, 0)
    const aberto = fromCard > 0 ? fromCard : fromTxs
    if (!(aberto > 0))
    {
      return { ok: false, error: 'Nada a pagar nesta fatura' }
    }
    const res = await get().addExpenseFromText(
      `Fatura ${card.nome} ${aberto}`,
      isGuest,
      { categoria: 'outros', formaPagamento: 'debito' },
    )
    if (!res.ok) return res
    get().updateFinanceCard(cardId, { faturaAberta: 0 })
    useDuePaidStore.getState().setPaid(key, true)
    return { ok: true }
  },

  patchTaskNotes: (taskId, notes) =>
  {
    const current = get().tasks.find((t) => t.id === taskId)
    if (!current) return
    set({
      tasks: get().tasks.map((t) =>
        t.id === taskId ? { ...t, anotacao: notes } : t,
      ),
    })
    if (notes.trim())
    {
      useActivityStore.getState().markAction('note')
    }
    if (taskId.startsWith('local-') || !supabaseConfigured) return
    void patchTarefa(taskId, { notas_locais: notes || null })
  },

  patchTask: async (taskId, patch, isGuest) =>
  {
    const current = get().tasks.find((t) => t.id === taskId)
    if (!current) return
    const next: MobileTask = { ...current, ...patch }
    set({
      tasks: get().tasks.map((t) => (t.id === taskId ? next : t)),
    })
    if (next.status === 'done' && current.status !== 'done')
    {
      useGamificationStore.getState().grantXp(12, 'Tarefa concluída', current.titulo)
      useGamificationStore.getState().unlockIf('first_task')
      useActivityStore.getState().markAction('task')
    }
    if (useLocal(isGuest) || taskId.startsWith('local-')) return

    let due = next.dataVencimento
    if (due && next.horaMinutos != null)
    {
      const h = Math.floor(next.horaMinutos / 60)
      const m = next.horaMinutos % 60
      due = `${due}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
    }
    await patchTarefa(taskId, {
      titulo: next.titulo,
      notas_locais: next.anotacao || null,
      prioridade: next.prioridade,
      estimativa_minutos: next.estimativaMinutos,
      data_vencimento: due,
    })
    if (next.status !== current.status)
    {
      await persistTaskStatus(taskId, next.status)
    }
  },

  removeTask: async (taskId, isGuest) =>
  {
    const current = get().tasks.find((t) => t.id === taskId)
    if (!current) return
    // Feitas fica no histórico — só tira da lista o que ainda está aberto
    if (current.status === 'done') return
    set({ tasks: get().tasks.filter((t) => t.id !== taskId) })
    if (useLocal(isGuest) || taskId.startsWith('local-')) return
    try
    {
      await archiveTarefa(taskId)
    }
    catch
    {
      set({ tasks: [current, ...get().tasks] })
    }
  },

  addChecklistItem: async (taskId, texto, isGuest) =>
  {
    const label = texto.trim()
    if (!label) return
    const localItem = { id: `c-${Date.now()}`, texto: label, feito: false }
    set({
      tasks: get().tasks.map((t) =>
        t.id === taskId ? { ...t, checklist: [...t.checklist, localItem] } : t,
      ),
    })
    if (useLocal(isGuest) || taskId.startsWith('local-')) return
    try
    {
      const saved = await insertSubtarefa(taskId, label)
      set({
        tasks: get().tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                checklist: t.checklist.map((c) => (c.id === localItem.id ? saved : c)),
              }
            : t,
        ),
      })
    }
    catch
    {
      /* item local permanece */
    }
  },

  addMedicamento: async (nome, horario, isGuest) =>
  {
    if (useLocal(isGuest))
    {
      set({
        medicamentos: [
          ...get().medicamentos,
          { id: Date.now(), nome, horario, tomado: false },
        ],
      })
      return {}
    }
    try
    {
      const saved = await insertMedicamento(nome, horario)
      set({ medicamentos: [...get().medicamentos, saved] })
      return {}
    }
    catch (e)
    {
      return { error: e instanceof Error ? e.message : 'Falha ao salvar' }
    }
  },

  removeMedicamento: async (id, isGuest) =>
  {
    set({ medicamentos: get().medicamentos.filter((m) => m.id !== id) })
    if (useLocal(isGuest)) return
    try
    {
      await deleteMedicamento(id)
    }
    catch
    {
      /* local já atualizado */
    }
  },
}))
