import type { StateCreator } from 'zustand'
import type { DeadlineProposal } from '../../lib/deadlineProposal'
import {
  fetchPendingDeadlineProposals,
  resolveDeadlineProposal,
  upsertDeadlineProposals,
} from '../../lib/deadlineProposalApi'

const STORAGE_KEY = 'axel-deadline-proposals-v1'

function loadProposals(): Record<number, DeadlineProposal>
{
  try
  {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, DeadlineProposal>
    const out: Record<number, DeadlineProposal> = {}
    for (const [k, v] of Object.entries(parsed))
    {
      out[Number(k)] = v
    }
    return out
  }
  catch
  {
    return {}
  }
}

function saveProposals(data: Record<number, DeadlineProposal>): void
{
  const flat: Record<string, DeadlineProposal> = {}
  for (const [id, p] of Object.entries(data))
  {
    flat[String(id)] = p
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flat))
}

export interface AxelDeadlineProposalSlice
{
  deadlineProposals: Record<number, DeadlineProposal>
  setDeadlineProposals: (list: DeadlineProposal[]) => void
  hydrateDeadlineProposals: () => Promise<void>
  getDeadlineProposal: (taskId: number) => DeadlineProposal | null
  acceptDeadlineProposal: (taskId: number) => DeadlineProposal | null
  rejectDeadlineProposal: (taskId: number) => void
  clearDeadlineProposals: () => void
}

export const createAxelDeadlineProposalSlice: StateCreator<
  AxelDeadlineProposalSlice,
  [],
  [],
  AxelDeadlineProposalSlice
> = (set, get) => ({
  deadlineProposals: loadProposals(),

  setDeadlineProposals: (list) =>
  {
    const next: Record<number, DeadlineProposal> = { ...get().deadlineProposals }
    for (const p of list)
    {
      next[p.taskId] = p
    }
    saveProposals(next)
    set({ deadlineProposals: next })
    void upsertDeadlineProposals(list)
  },

  hydrateDeadlineProposals: async () =>
  {
    const remote = await fetchPendingDeadlineProposals()
    if (Object.keys(remote).length === 0) return

    const merged = { ...get().deadlineProposals, ...remote }
    saveProposals(merged)
    set({ deadlineProposals: merged })
  },

  getDeadlineProposal: (taskId) => get().deadlineProposals[taskId] ?? null,

  acceptDeadlineProposal: (taskId) =>
  {
    const proposal = get().deadlineProposals[taskId]
    if (!proposal) return null

    const next = { ...get().deadlineProposals }
    delete next[taskId]
    saveProposals(next)
    set({ deadlineProposals: next })
    void resolveDeadlineProposal(taskId, 'accepted')
    return proposal
  },

  rejectDeadlineProposal: (taskId) =>
  {
    const next = { ...get().deadlineProposals }
    delete next[taskId]
    saveProposals(next)
    set({ deadlineProposals: next })
    void resolveDeadlineProposal(taskId, 'rejected')
  },

  clearDeadlineProposals: () =>
  {
    saveProposals({})
    set({ deadlineProposals: {} })
  },
})
