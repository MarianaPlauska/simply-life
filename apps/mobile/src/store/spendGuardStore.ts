import { create } from 'zustand'
import type { PurchaseCheck, SpendGuardLevel } from '@simply-life/shared'
import { readLocalJson, writeLocalJson } from '../lib/localJsonStore'

const KEY = 'simply-life-spend-guard-v1'

/** Onde o aviso aparece: na raiz do app ou dentro de uma ficha aberta (Modal sobre Modal). */
export type SpendGuardHostId = 'root' | 'capture' | 'card'

export type SpendGuardRequest = {
  host: SpendGuardHostId
  titulo: string
  mensagem: string
  check: PurchaseCheck
  firme: boolean
  resolve: (salvar: boolean) => void
}

type State = {
  level: SpendGuardLevel
  hydrated: boolean
  request: SpendGuardRequest | null
  hydrate: () => Promise<void>
  setLevel: (level: SpendGuardLevel) => void
  /** abre o aviso e espera a resposta: true = salvar mesmo assim */
  ask: (req: Omit<SpendGuardRequest, 'resolve'>) => Promise<boolean>
  answer: (salvar: boolean) => void
}

const LEVELS: SpendGuardLevel[] = ['avisar', 'firme', 'desligado']

/** Aviso antes de um gasto que aperta o mês (nível escolhido em Preferências → Alertas). */
export const useSpendGuardStore = create<State>((set, get) => ({
  level: 'avisar',
  hydrated: false,
  request: null,

  hydrate: async () =>
  {
    if (get().hydrated) return
    const saved = await readLocalJson<{ level?: string }>(KEY)
    const level = LEVELS.includes(saved?.level as SpendGuardLevel) ? (saved!.level as SpendGuardLevel) : 'avisar'
    set({ level, hydrated: true })
  },

  setLevel: (level) =>
  {
    set({ level })
    void writeLocalJson(KEY, { level })
  },

  ask: (req) =>
    new Promise<boolean>((resolve) =>
    {
      // um aviso por vez: um pedido antigo sem resposta conta como "não gastar"
      get().request?.resolve(false)
      set({ request: { ...req, resolve } })
    }),

  answer: (salvar) =>
  {
    const req = get().request
    set({ request: null })
    req?.resolve(salvar)
  },
}))
