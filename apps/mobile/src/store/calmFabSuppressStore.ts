import { create } from 'zustand'

/** Esconde o FAB Acalmar quando a tela já oferece o mesmo atalho (ex.: Hoje → Cuidados). */
export const useCalmFabSuppressStore = create<{
  count: number
  acquire: () => void
  release: () => void
}>((set, get) => ({
  count: 0,
  acquire: () => set({ count: get().count + 1 }),
  release: () => set({ count: Math.max(0, get().count - 1) }),
}))
