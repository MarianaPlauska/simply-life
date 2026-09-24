import { create } from 'zustand'
import {
  addDaysIso,
  localTodayIso,
  replanBoard,
  type BoardMove,
  type ReplanTrigger,
} from '@simply-life/shared'
import { readLocalJson, writeLocalJson } from '../lib/localJsonStore'
import { orchestratorContextNow } from '../lib/orchestratorContext'
import { insertDecisionEvents, markBatchUndone } from '../lib/sync/decisionLog'
import { useDataStore } from './dataStore'
import { useAuthStore } from './authStore'
import { useNeuroStore } from './neuroStore'

const KEY = 'simply-life-board-replan-v1'
const PIN_DAYS = 7
const MEMORY_DAYS = 7
const MAX_MEMORY = 200

export type ReplanBatch = {
  id: string
  trigger: ReplanTrigger
  at: string
  moves: BoardMove[]
  /** ids já desfeitos neste lote */
  undone: string[]
  /** dias que seguem acima do tempo livre */
  stillOverloaded: number
}

type Memory = {
  /** último dia (local) em que a rodada da manhã rodou */
  lastMorning: string | null
  /** tarefas travadas: o Axel não mexe até a data */
  pinned: Record<string, string>
  /** o que o Axel moveu: se a data mudou depois, foi o usuário → trava */
  axelMoved: Record<string, { to: string; at: string }>
  /** dia → aceito até (o usuário desfez um adiamento daquele dia) */
  acceptedOverload: Record<string, string>
  lastBatch: ReplanBatch | null
}

const EMPTY: Memory = { lastMorning: null, pinned: {}, axelMoved: {}, acceptedOverload: {}, lastBatch: null }

type State = Memory & {
  hydrated: boolean
  running: boolean
  /** lote visível no aviso (null = aviso fechado) */
  visibleBatchId: string | null
  /** modo previsível: movimentos sugeridos esperando o ok da pessoa */
  proposal: ReplanBatch | null
  applyProposal: () => Promise<void>
  dismissProposal: () => void
  /** aviso rápido quando a rodada manual não mexeu em nada */
  notice: string | null
  hydrate: () => Promise<void>
  run: (trigger: ReplanTrigger) => Promise<ReplanBatch | null>
  undoBatch: () => Promise<void>
  undoMove: (taskId: string) => Promise<void>
  dismiss: () => void
  unpin: (taskId: string) => void
}

/** Aplica o lote: muda as datas, lembra o que o Axel moveu, mostra o aviso e registra. */
async function applyBatch(
  batch: ReplanBatch,
  nextMem: Memory,
  set: (partial: Partial<State>) => void,
): Promise<void>
{
  const isGuest = useAuthStore.getState().isGuest
  const patchTask = useDataStore.getState().patchTask
  for (const m of batch.moves)
  {
    await patchTask(m.taskId, { dataVencimento: m.to }, isGuest)
    nextMem.axelMoved = { ...nextMem.axelMoved, [m.taskId]: { to: m.to, at: batch.at } }
  }
  nextMem.lastBatch = batch
  set({ ...nextMem, visibleBatchId: batch.id })
  persist(nextMem)
  if (!isGuest)
  {
    void insertDecisionEvents(batch.moves.map((m) => ({
      taskId: m.taskId,
      kind: m.kind,
      rationale: m.reason,
      batchId: batch.id,
      trigger: batch.trigger,
      from: m.from,
      to: m.to,
    })))
  }
}

function batchId(): string
{
  // uuid v4 simples (batch_id é UUID no banco)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) =>
  {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function persist(s: Memory): void
{
  void writeLocalJson(KEY, {
    lastMorning: s.lastMorning,
    pinned: s.pinned,
    axelMoved: s.axelMoved,
    acceptedOverload: s.acceptedOverload,
    lastBatch: s.lastBatch,
  })
}

/** Limpa travas vencidas e detecta quando o usuário mexeu no que o Axel moveu. */
function reconcile(mem: Memory): Memory
{
  const today = localTodayIso()
  const now = Date.now()
  const tasks = useDataStore.getState().tasks ?? []
  const byId = new Map(tasks.map((t) => [t.id, t]))

  const pinned: Record<string, string> = {}
  for (const [id, until] of Object.entries(mem.pinned))
  {
    if (until >= today && byId.has(id)) pinned[id] = until
  }

  const axelMoved: Record<string, { to: string; at: string }> = {}
  const entries = Object.entries(mem.axelMoved)
    .filter(([, v]) => now - new Date(v.at).getTime() < MEMORY_DAYS * 86400000)
    .sort((a, b) => (a[1].at < b[1].at ? 1 : -1))
    .slice(0, MAX_MEMORY)
  for (const [id, v] of entries)
  {
    const t = byId.get(id)
    if (!t || t.status === 'done') continue
    if ((t.dataVencimento ?? null) !== v.to)
    {
      // o usuário moveu depois do Axel: respeita a escolha
      pinned[id] = addDaysIso(today, PIN_DAYS)
      continue
    }
    axelMoved[id] = v
  }
  const acceptedOverload: Record<string, string> = {}
  for (const [day, until] of Object.entries(mem.acceptedOverload ?? {}))
  {
    if (until >= today && day >= today) acceptedOverload[day] = until
  }
  return { ...mem, pinned, axelMoved, acceptedOverload }
}

export const useBoardReplanStore = create<State>((set, get) => ({
  ...EMPTY,
  hydrated: false,
  running: false,
  visibleBatchId: null,
  notice: null,
  proposal: null,

  hydrate: async () =>
  {
    if (get().hydrated) return
    const saved = await readLocalJson<Partial<Memory>>(KEY)
    set({
      lastMorning: saved?.lastMorning ?? null,
      pinned: saved?.pinned ?? {},
      axelMoved: saved?.axelMoved ?? {},
      acceptedOverload: saved?.acceptedOverload ?? {},
      lastBatch: saved?.lastBatch ?? null,
      hydrated: true,
    })
  },

  run: async (trigger) =>
  {
    if (get().running) return null
    await get().hydrate()
    set({ running: true, notice: null })
    try
    {
      const mem = reconcile(get())
      const tasks = useDataStore.getState().tasks ?? []
      const ctx = orchestratorContextNow()
      const dayAgo = Date.now() - 86400000
      const result = replanBoard(tasks, ctx, {
        trigger,
        pinned: Object.keys(mem.pinned),
        recentlyMoved: Object.entries(mem.axelMoved)
          .filter(([, v]) => new Date(v.at).getTime() > dayAgo)
          .map(([id]) => id),
        acceptOverloadDays: Object.keys(mem.acceptedOverload),
      })

      const today = localTodayIso()
      const nextMem: Memory = {
        ...mem,
        lastMorning: trigger === 'morning' ? today : mem.lastMorning,
      }

      if (result.moves.length === 0)
      {
        set({
          ...nextMem,
          // rodada manual sem mudanças: troca o aviso antigo pelo resultado atual
          visibleBatchId: trigger === 'manual' ? null : get().visibleBatchId,
          notice: trigger === 'manual'
            ? result.overloadedDays.length
              ? 'Nada para mover sem quebrar prazos. Alguns dias seguem cheios.'
              : 'Quadro em dia: nada para mover.'
            : null,
        })
        persist(nextMem)
        return null
      }

      const batch: ReplanBatch = {
        id: batchId(),
        trigger,
        at: new Date().toISOString(),
        moves: result.moves,
        undone: [],
        stillOverloaded: result.overloadedDays.length,
      }

      // modo previsível (autismo): só propõe; nada muda sem um ok. Rodada manual = ok explícito.
      if (useNeuroStore.getState().predictableMode && trigger !== 'manual')
      {
        set({ ...nextMem, proposal: batch })
        persist(nextMem)
        return null
      }

      await applyBatch(batch, nextMem, set)
      return batch
    }
    finally
    {
      set({ running: false })
    }
  },

  applyProposal: async () =>
  {
    const proposal = get().proposal
    if (!proposal) return
    // só aplica o que continua igual desde a sugestão
    const tasks = useDataStore.getState().tasks ?? []
    const still = proposal.moves.filter((m) =>
      (tasks.find((t) => t.id === m.taskId)?.dataVencimento?.slice(0, 10) ?? null) === m.from)
    set({ proposal: null })
    if (!still.length) return
    const mem = reconcile(get())
    await applyBatch({ ...proposal, moves: still, at: new Date().toISOString() }, { ...mem }, set)
  },

  dismissProposal: () => set({ proposal: null }),

  undoMove: async (taskId) =>
  {
    const batch = get().lastBatch
    const move = batch?.moves.find((m) => m.taskId === taskId)
    if (!batch || !move || batch.undone.includes(taskId)) return
    const isGuest = useAuthStore.getState().isGuest
    const task = (useDataStore.getState().tasks ?? []).find((t) => t.id === taskId)
    // só volta se ninguém mexeu na data depois do Axel
    if (task && task.dataVencimento === move.to)
    {
      await useDataStore.getState().patchTask(taskId, { dataVencimento: move.from }, isGuest)
    }
    const { [taskId]: _removed, ...axelMoved } = get().axelMoved
    // desfez um adiamento: aquele dia cheio foi escolha sua, o Axel não alivia de novo
    const acceptedOverload = move.kind === 'deferred_load' && move.from
      ? { ...get().acceptedOverload, [move.from]: move.from }
      : get().acceptedOverload
    const next: Memory = {
      lastMorning: get().lastMorning,
      axelMoved,
      acceptedOverload,
      pinned: { ...get().pinned, [taskId]: addDaysIso(localTodayIso(), PIN_DAYS) },
      lastBatch: { ...batch, undone: [...batch.undone, taskId] },
    }
    set(next)
    persist(next)
    if (!isGuest)
    {
      void markBatchUndone(batch.id, [taskId])
      void insertDecisionEvents([{
        taskId,
        kind: 'undo',
        rationale: `Você desfez: “${move.titulo}” voltou para ${move.from ?? 'sem data'}. O Axel não mexe nela por ${PIN_DAYS} dias.`,
        batchId: batch.id,
        trigger: 'undo',
        from: move.to,
        to: move.from,
      }])
    }
  },

  undoBatch: async () =>
  {
    const batch = get().lastBatch
    if (!batch) return
    for (const m of batch.moves)
    {
      if (!get().lastBatch?.undone.includes(m.taskId)) await get().undoMove(m.taskId)
    }
    set({ visibleBatchId: null })
  },

  dismiss: () => set({ visibleBatchId: null, notice: null }),

  unpin: (taskId) =>
  {
    const { [taskId]: _removed, ...pinned } = get().pinned
    set({ pinned })
    persist({ ...get(), pinned })
  },
}))
