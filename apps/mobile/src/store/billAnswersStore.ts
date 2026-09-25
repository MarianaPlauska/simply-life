import { create } from 'zustand'
import { readLocalJson, writeLocalJson } from '../lib/localJsonStore'

const KEY = 'simply-life-bill-answers-v1'

/**
 * Respostas a "venceu e não foi marcada: já pagou?".
 * "Ainda não" fica lembrado por mês (AAAA-MM → ids das fixas) e a conta passa a
 * contar como a pagar na projeção. "Já paguei" usa settleFixa (lança o gasto).
 */
type State = {
  emAberto: Record<string, string[]>
  hydrated: boolean
  hydrate: () => Promise<void>
  markUnpaid: (ym: string, fixaId: string | number) => void
  clear: (ym: string, fixaId: string | number) => void
}

export const useBillAnswersStore = create<State>((set, get) => ({
  emAberto: {},
  hydrated: false,

  hydrate: async () =>
  {
    if (get().hydrated) return
    const saved = await readLocalJson<Record<string, string[]>>(KEY)
    // só guarda os últimos 3 meses
    const keep = Object.fromEntries(Object.entries(saved ?? {}).sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 3))
    set({ emAberto: keep, hydrated: true })
  },

  markUnpaid: (ym, fixaId) =>
  {
    const cur = new Set(get().emAberto[ym] ?? [])
    cur.add(String(fixaId))
    const emAberto = { ...get().emAberto, [ym]: [...cur] }
    set({ emAberto })
    void writeLocalJson(KEY, emAberto)
  },

  clear: (ym, fixaId) =>
  {
    const emAberto = { ...get().emAberto, [ym]: (get().emAberto[ym] ?? []).filter((id) => id !== String(fixaId)) }
    set({ emAberto })
    void writeLocalJson(KEY, emAberto)
  },
}))
