import { create } from 'zustand'

export type RewardPulse = {
  id: number
  title: string
  detail: string
  xp: number
}

type State = {
  pulse: RewardPulse | null
  show: (p: Omit<RewardPulse, 'id'>) => void
  clear: () => void
}

/** Recompensa imediata e pequena (aviso de rodapé), separada das conquistas em pop-up. */
export const useRewardPulseStore = create<State>((set) => ({
  pulse: null,
  show: (p) => set({ pulse: { ...p, id: Date.now() } }),
  clear: () => set({ pulse: null }),
}))
