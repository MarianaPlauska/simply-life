import {
  computeSaldoDisponivel,
  estimateNextIncomeIso,
  localTodayIso,
  type CashAccount,
  type ContaFixa,
  type FinanceCard,
  type FinanceTx,
  type HumorRegistro,
  type MobileTask,
  type OrchestratorContext,
  type OrchestratorStyle,
  type TaskPromptContext,
  type TimeLearning,
} from '@simply-life/shared'
import { timeLearningNow } from './timeLearning'
import { useDataStore } from '../store/dataStore'
import { useKanbanListsStore } from '../store/kanbanListsStore'
import { useOrchestratorPrefsStore } from '../store/orchestratorPrefsStore'
import { useCalendarStore } from '../store/calendarStore'
import { useNeuroStore } from '../store/neuroStore'

export type OrchestratorInputs = {
  tasks: MobileTask[] | null | undefined
  humor: HumorRegistro[] | null | undefined
  finance: FinanceTx[] | null | undefined
  fixas: ContaFixa[] | null | undefined
  cards: FinanceCard[] | null | undefined
  cash: CashAccount
  lists: { id: string; name: string }[]
  style: OrchestratorStyle
  capacityMinutes: number
  /** minutos ocupados pela agenda por dia */
  busyByDay?: Record<string, number>
  /** folga nas estimativas (perfil TDAH) */
  estimateFactor?: number
  learning?: TimeLearning | null
}

export type FullOrchestratorContext = OrchestratorContext & { promptCtx: TaskPromptContext }

/** Contexto do orquestrador (tarefas, humor, saldo, fixas, cartões, preferências). */
export function buildOrchestratorContext(input: OrchestratorInputs): FullOrchestratorContext
{
  const today = localTodayIso()
  const openTasks = (input.tasks ?? []).filter((t) => t.status !== 'done')
  const moodRow = [...(input.humor ?? [])].reverse().find((h) => h.data?.slice(0, 10) === today)
  const saldo = computeSaldoDisponivel(input.cash, input.finance ?? [], input.fixas ?? []).disponivel
  return {
    openTasks,
    capacityMinutes: input.capacityMinutes,
    style: input.style,
    busyByDay: input.busyByDay,
    estimateFactor: input.estimateFactor ?? 1,
    learning: input.learning ?? null,
    moodToday: moodRow?.humor ?? null,
    finance: {
      saldoDisponivel: saldo,
      fixas: input.fixas ?? [],
      cards: (input.cards ?? []).map((c) => ({ id: c.id, nome: c.nome, diaVencimento: c.diaVencimento })),
      proximaReceitaIso: estimateNextIncomeIso(input.finance ?? []),
    },
    promptCtx: {
      lists: input.lists,
      fixas: input.fixas ?? [],
      cards: input.cards ?? [],
      openTasks,
    },
  }
}

/** Mesmo contexto, lido direto dos stores (fora de componentes). */
export function orchestratorContextNow(): FullOrchestratorContext
{
  const d = useDataStore.getState()
  const prefs = useOrchestratorPrefsStore.getState()
  return buildOrchestratorContext({
    tasks: d.tasks,
    humor: d.humor,
    finance: d.finance,
    fixas: d.contasFixas,
    cards: d.financeCards,
    cash: d.cashAccount,
    lists: useKanbanListsStore.getState().lists.map((l) => ({ id: l.id, name: l.name })),
    style: prefs.style,
    capacityMinutes: prefs.capacityMinutes,
    busyByDay: useCalendarStore.getState().busyByDay(),
    estimateFactor: useNeuroStore.getState().estimateFactor,
    learning: timeLearningNow(),
  })
}
