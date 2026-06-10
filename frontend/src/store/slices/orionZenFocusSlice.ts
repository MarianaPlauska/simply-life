import type { StateCreator } from 'zustand'

// Modo Foco Absoluto — canvas zen sem chrome do app

export interface OrionZenFocusSlice
{
  zenFocusActive: boolean
  zenFocusTaskId: number | null
  setZenFocusActive: (active: boolean, taskId?: number | null) => void
}

export const createOrionZenFocusSlice: StateCreator<
  OrionZenFocusSlice,
  [],
  [],
  OrionZenFocusSlice
> = (set) => ({
  zenFocusActive: false,
  zenFocusTaskId: null,

  setZenFocusActive: (active, taskId = null) =>
  {
    set({
      zenFocusActive: active,
      zenFocusTaskId: active ? taskId ?? null : null,
    })
  },
})
