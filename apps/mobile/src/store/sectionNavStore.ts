import { useCallback, useEffect, useState } from 'react'
import { create } from 'zustand'

/** Áreas com abas internas que a barra lateral da web mostra como subitens. */
export type SectionArea = 'kanban' | 'saude' | 'financeiro' | 'financeiroContas'

export type SectionTab = { id: string; label: string; count?: number }

type State = {
  /** aba aberta em cada área (a página e a barra lateral leem daqui) */
  active: Partial<Record<SectionArea, string>>
  /** abas visíveis de cada área, publicadas pela própria página */
  tabs: Partial<Record<SectionArea, SectionTab[]>>
  setActive: (area: SectionArea, id: string) => void
  setTabs: (area: SectionArea, tabs: SectionTab[]) => void
}

export const useSectionNavStore = create<State>((set) => ({
  active: {},
  tabs: {},
  setActive: (area, id) => set((s) => ({ active: { ...s.active, [area]: id } })),
  setTabs: (area, tabs) => set((s) => ({ tabs: { ...s.tabs, [area]: tabs } })),
}))

/** Como useState, mas guardado por área: a barra lateral consegue trocar a aba da página. */
export function useSectionState<T extends string>(area: SectionArea, initial: T | (() => T)): [T, (next: T) => void]
{
  const stored = useSectionNavStore((s) => s.active[area]) as T | undefined
  const setActive = useSectionNavStore((s) => s.setActive)
  const [fallback] = useState(initial)
  const setValue = useCallback((next: T) => setActive(area, next), [area, setActive])
  return [stored ?? fallback, setValue]
}

/** A página publica as abas que estão visíveis (módulos ligados, contadores). */
export function usePublishSectionTabs(area: SectionArea, tabs: SectionTab[]): void
{
  const setTabs = useSectionNavStore((s) => s.setTabs)
  const key = JSON.stringify(tabs.map((t) => [t.id, t.label, t.count ?? null]))
  useEffect(() =>
  {
    setTabs(area, tabs.map((t) => ({ id: t.id, label: t.label, count: t.count })))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area, key, setTabs])
}
