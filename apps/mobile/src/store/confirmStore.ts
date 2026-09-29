import { create } from 'zustand'

export type ConfirmRequest = {
  title: string
  message: string
  /** Texto do botão que confirma (padrão: Excluir) */
  confirmLabel?: string
  onConfirm: () => void
  /** neutral = decisão reversível (ex.: ligar ou tirar um módulo), sem lixeira nem vermelho */
  tone?: 'danger' | 'neutral'
  icon?: import('../ui/Icon').IconName
}

/** Pedido de confirmação aberto no diálogo do app (ConfirmDialogHost), no lugar do alert do navegador. */
export const useConfirmStore = create<{
  request: ConfirmRequest | null
  ask: (req: ConfirmRequest) => void
  close: () => void
}>((set) => ({
  request: null,
  ask: (request) => set({ request }),
  close: () => set({ request: null }),
}))
