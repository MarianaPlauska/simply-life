import { create } from 'zustand'
import {
  resolveDashboardWidgets,
  toggleWidgetSelection,
  type DashboardWidgetId,
} from '../lib/dashboardWidgets'
import {
  DEFAULT_WORKSPACE_PREFS,
  loadEmailKeywords,
  loadRadarKeywords,
  loadWorkspacePrefs,
  saveEmailKeywords,
  savePinnedModules,
  saveWorkspacePrefs,
  addRadarKeyword,
  removeRadarKeyword,
  type RadarKeyword,
  type WorkspacePrefs,
} from '../lib/sync/prefs'

type PrefsState = {
  loaded: boolean
  prefs: WorkspacePrefs
  keywords: string[]
  radar: RadarKeyword[]
  hydrate: () => Promise<WorkspacePrefs>
  patch: (next: Partial<WorkspacePrefs>) => Promise<void>
  setWidgets: (ids: DashboardWidgetId[]) => Promise<void>
  toggleWidget: (id: DashboardWidgetId) => Promise<void>
  setKeywords: (words: string[]) => Promise<void>
  addKeyword: (word: string) => Promise<void>
  removeKeyword: (word: string) => Promise<void>
  addRadar: (termo: string) => Promise<void>
  removeRadar: (id: number) => Promise<void>
  togglePin: (moduleId: string) => Promise<void>
  reset: () => void
}

export const usePrefsStore = create<PrefsState>((set, get) => ({
  loaded: false,
  prefs: DEFAULT_WORKSPACE_PREFS,
  keywords: [],
  radar: [],

  reset: () =>
  {
    set({
      loaded: false,
      prefs: DEFAULT_WORKSPACE_PREFS,
      keywords: [],
      radar: [],
    })
  },

  hydrate: async () =>
  {
    const [prefs, keywords, radar] = await Promise.all([
      loadWorkspacePrefs(),
      loadEmailKeywords(),
      loadRadarKeywords(),
    ])
    set({ prefs, keywords, radar, loaded: true })
    return prefs
  },

  patch: async (next) =>
  {
    const prefs = await saveWorkspacePrefs({ ...get().prefs, ...next })
    set({ prefs })
  },

  setWidgets: async (ids) =>
  {
    await get().patch({ dashboard_quick_widgets: ids })
  },

  toggleWidget: async (id) =>
  {
    const current = resolveDashboardWidgets(
      get().prefs.dashboard_quick_widgets,
      get().prefs.dashboard_priority,
    )
    await get().patch({ dashboard_quick_widgets: toggleWidgetSelection(current, id) })
  },

  setKeywords: async (words) =>
  {
    set({ keywords: words })
    await saveEmailKeywords(words)
  },

  addKeyword: async (word) =>
  {
    const termo = word.trim().toLowerCase()
    if (!termo) return
    const next = get().keywords.includes(termo) ? get().keywords : [...get().keywords, termo]
    await get().setKeywords(next)
  },

  removeKeyword: async (word) =>
  {
    await get().setKeywords(get().keywords.filter((k) => k !== word))
  },

  addRadar: async (termo) =>
  {
    const row = await addRadarKeyword(termo.trim().toLowerCase())
    if (row) set((s) => ({ radar: [...s.radar, row] }))
  },

  removeRadar: async (id) =>
  {
    await removeRadarKeyword(id)
    set((s) => ({ radar: s.radar.filter((r) => r.id !== id) }))
  },

  togglePin: async (moduleId) =>
  {
    if (moduleId === 'dashboard') return
    const current = get().prefs.pinned_modules
    const has = current.includes(moduleId)
    const next = has
      ? current.filter((m) => m !== moduleId)
      : [...current, moduleId].slice(0, 6)
    await get().patch({ pinned_modules: next })
    await savePinnedModules(next)
  },
}))
