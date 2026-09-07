import { create } from 'zustand'
import type { ContasSubTab, FinanceMainTab } from '../components/finance/financeNav'

type Focus = {
  tab: FinanceMainTab
  contasSub: ContasSubTab
}

type State = {
  pending: Focus | null
  openContas: (sub: ContasSubTab) => void
  consume: () => Focus | null
}

export const useFinanceFocusStore = create<State>((set, get) => ({
  pending: null,
  openContas: (sub) => set({ pending: { tab: 'contas', contasSub: sub } }),
  consume: () =>
  {
    const hit = get().pending
    set({ pending: null })
    return hit
  },
}))
