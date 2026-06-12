// slice de ui — controla views, sidebar, modais, acessibilidade
import type { StateCreator } from 'zustand';
import type { ActiveView, TimerConfig, AccessibilitySettings, ColorScheme } from '../storeTypes';
import { applyColorScheme } from '../../utils/applyColorScheme';

export type RealtimeStatus = 'offline' | 'connecting' | 'live' | 'error';

export interface UISlice {
  realtimeStatus: RealtimeStatus;
  setRealtimeStatus: (status: RealtimeStatus) => void;
  /** IDs de tarefas recém-ingeridas — highlight no Kanban */
  axelIngestionHighlightIds: number[];
  pushIngestionHighlights: (ids: number[]) => void;
  clearIngestionHighlights: () => void;
  axelIngestionPolling: boolean;
  setAxelIngestionPolling: (active: boolean) => void;
  activeView: ActiveView;
  isQuickCaptureOpen: boolean;
  isFinanceQuickCaptureOpen: boolean;
  financeQuickCaptureSeed: string;
  isCommandPaletteOpen: boolean;
  timerConfig: TimerConfig;
  interactionScore: Record<string, number>;
  sidebarCollapsed: boolean;
  scoreDiario: number;
  pinnedModules: string[];
  accessibility: AccessibilitySettings;
  keywords: string[];
  setActiveView: (view: ActiveView) => void;
  setQuickCaptureOpen: (isOpen: boolean) => void;
  setFinanceQuickCaptureOpen: (isOpen: boolean) => void;
  setFinanceQuickCaptureSeed: (text: string) => void;
  setCommandPaletteOpen: (isOpen: boolean) => void;
  setTimerConfig: (key: keyof TimerConfig, value: number) => void;
  registerInteraction: (moduleId: string) => void;
  toggleSidebar: () => void;
  concluirHabito: (pontos: number) => void;
  togglePin: (moduleId: string) => void;
  setAccessibility: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K],
  ) => void;
  toggleColorScheme: () => void;
  setKeywords: (keywords: string[]) => void;
  /** Destaque temporário no sino (timestamp até quando pulsa) */
  sinoDestaqueAte: number;
  pulseSino: (durationMs?: number) => void;
}

export const createUISlice: StateCreator<UISlice, [], [], UISlice> = (set, get) => ({
  realtimeStatus: 'offline',
  setRealtimeStatus: (status) => set({ realtimeStatus: status }),
  axelIngestionHighlightIds: [],
  pushIngestionHighlights: (ids) =>
  {
    if (ids.length === 0) return;
    set((state) =>
    {
      const merged = new Set([...state.axelIngestionHighlightIds, ...ids]);
      return { axelIngestionHighlightIds: [...merged] };
    });
  },
  clearIngestionHighlights: () => set({ axelIngestionHighlightIds: [] }),
  axelIngestionPolling: false,
  setAxelIngestionPolling: (active) => set({ axelIngestionPolling: active }),
  activeView: 'dashboard',
  isQuickCaptureOpen: false,
  isFinanceQuickCaptureOpen: false,
  financeQuickCaptureSeed: '',
  isCommandPaletteOpen: false,
  timerConfig: { pomodoroTime: 25, shortBreak: 5, longBreak: 15 },
  interactionScore: {},
  sidebarCollapsed: false,
  scoreDiario: 0,
  pinnedModules: ['dashboard', 'kanban'],
  accessibility: {
    fontSize: 14,
    highContrast: false,
    reducedMotion: false,
    focusVisible: true,
    soundFeedback: false,
    keyboardShortcuts: true,
    colorScheme: 'dark',
  },
  keywords: [] as string[],

  setActiveView: (view) => set({ activeView: view }),
  setQuickCaptureOpen: (isOpen) => set({ isQuickCaptureOpen: isOpen }),
  setFinanceQuickCaptureOpen: (isOpen) => set({ isFinanceQuickCaptureOpen: isOpen }),
  setFinanceQuickCaptureSeed: (text) => set({ financeQuickCaptureSeed: text }),
  setCommandPaletteOpen: (isOpen) => set({ isCommandPaletteOpen: isOpen }),

  setTimerConfig: (key, value) =>
  {
    set((state) => ({
      timerConfig: { ...state.timerConfig, [key]: value },
    }));
  },

  registerInteraction: (moduleId) =>
  {
    set((state) => ({
      interactionScore: {
        ...state.interactionScore,
        [moduleId]: (state.interactionScore[moduleId] || 0) + 1,
      },
    }));
  },

  concluirHabito: (pontos) =>
  {
    set((state) => ({ scoreDiario: state.scoreDiario + pontos }));
  },

  togglePin: (moduleId) =>
  {
    set((state) =>
    {
      const has = state.pinnedModules.includes(moduleId);
      return {
        pinnedModules: has
          ? state.pinnedModules.filter((m) => m !== moduleId)
          : [...state.pinnedModules, moduleId],
      };
    });
  },

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  toggleColorScheme: () =>
  {
    const next: ColorScheme = get().accessibility.colorScheme === 'dark' ? 'light' : 'dark';
    set((state) => ({
      accessibility: { ...state.accessibility, colorScheme: next },
    }));
    applyColorScheme(next);
  },

  setAccessibility: (key, value) =>
  {
    set((state) => ({
      accessibility: { ...state.accessibility, [key]: value },
    }));
    if (key === 'fontSize') document.documentElement.style.fontSize = `${value}px`;
    if (key === 'highContrast') document.documentElement.classList.toggle('high-contrast', value as boolean);
    if (key === 'reducedMotion') document.documentElement.classList.toggle('reduce-motion', value as boolean);
    if (key === 'colorScheme') applyColorScheme(value as ColorScheme);
  },

  setKeywords: (keywords) => set({ keywords }),
  sinoDestaqueAte: 0,
  pulseSino: (durationMs = 6000) =>
  {
    set({ sinoDestaqueAte: Date.now() + durationMs });
  },
});
