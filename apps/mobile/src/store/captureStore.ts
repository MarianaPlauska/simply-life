import { create } from 'zustand'

export type CaptureKind = 'dump' | 'task' | 'expense' | 'note'

export type CaptureOpenOpts = {
  studio?: boolean
  prioridade?: 1 | 2 | 3
  lancamento?: 'despesa' | 'receita'
}

type CaptureState = {
  open: boolean
  kind: CaptureKind
  listId: string | null
  studio: boolean
  seedPrioridade: 1 | 2 | 3 | null
  seedLancamento: 'despesa' | 'receita' | null
  openCapture: (kind?: CaptureKind, listId?: string | null, opts?: CaptureOpenOpts) => void
  closeCapture: () => void
  setKind: (kind: CaptureKind) => void
}

/** FAB: dump resumido na Home; nas outras abas, captura focada da página. */
export function captureForTab(tab: string): { kind: CaptureKind; studio: boolean }
{
  if (tab.includes('kanban')) return { kind: 'task', studio: true }
  if (tab.includes('saude')) return { kind: 'note', studio: true }
  if (tab.includes('financeiro')) return { kind: 'expense', studio: true }
  return { kind: 'dump', studio: false }
}

export function captureFabLabel(kind: CaptureKind): string
{
  if (kind === 'task') return 'Nova tarefa'
  if (kind === 'expense') return 'Novo gasto'
  if (kind === 'note') return 'Registrar humor'
  return 'Capturar'
}

export const useCaptureStore = create<CaptureState>((set) => ({
  open: false,
  kind: 'dump',
  listId: null,
  studio: false,
  seedPrioridade: null,
  seedLancamento: null,
  openCapture: (kind = 'dump', listId = null, opts) =>
    set({
      open: true,
      kind,
      listId,
      studio: opts?.studio ?? kind !== 'dump',
      seedPrioridade: opts?.prioridade ?? null,
      seedLancamento: opts?.lancamento ?? null,
    }),
  closeCapture: () =>
    set({
      open: false,
      listId: null,
      studio: false,
      seedPrioridade: null,
      seedLancamento: null,
    }),
  setKind: (kind) => set({ kind }),
}))
