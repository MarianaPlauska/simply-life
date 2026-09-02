import { create } from 'zustand'

export type CaptureKind = 'dump' | 'task' | 'expense' | 'note'

type CaptureState = {
  open: boolean
  kind: CaptureKind
  openCapture: (kind?: CaptureKind) => void
  closeCapture: () => void
  setKind: (kind: CaptureKind) => void
}

export const useCaptureStore = create<CaptureState>((set) => ({
  open: false,
  kind: 'dump',
  openCapture: (kind = 'dump') => set({ open: true, kind }),
  closeCapture: () => set({ open: false }),
  setKind: (kind) => set({ kind }),
}))
