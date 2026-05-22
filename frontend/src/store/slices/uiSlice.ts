// slice de ui — controla views, sidebar, modais, acessibilidade
import type { StateCreator } from 'zustand';
import type { ActiveView, TimerConfig, AccessibilitySettings } from '../storeTypes';

export type RealtimeStatus = 'offline' | 'connecting' | 'live' | 'error';

export interface UISlice {
  realtimeStatus: RealtimeStatus;
  setRealtimeStatus: (status: RealtimeStatus) => void;
  activeView: ActiveView;
  isQuickCaptureOpen: boolean;
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
  setCommandPaletteOpen: (isOpen: boolean) => void;
  setTimerConfig: (key: keyof TimerConfig, value: number) => void;
  registerInteraction: (moduleId: string) => void;
  toggleSidebar: () => void;
  concluirHabito: (pontos: number) => void;
  togglePin: (moduleId: string) => void;
  setAccessibility: (key: keyof AccessibilitySettings, value: boolean | number) => void;
  setKeywords: (keywords: string[]) => void;
}

export const createUISlice: StateCreator<UISlice, [], [], UISlice> = (set) => ({
  realtimeStatus: 'offline',
  setRealtimeStatus: (status) => set({ realtimeStatus: status }),
  activeView: 'dashboard',
  isQuickCaptureOpen: false,
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
  },
  keywords: [] as string[],

  setActiveView: (view) => set({ activeView: view }),
  setQuickCaptureOpen: (isOpen) => set({ isQuickCaptureOpen: isOpen }),
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

  setAccessibility: (key, value) =>
  {
    set((state) => ({
      accessibility: { ...state.accessibility, [key]: value },
    }));
    if ( key === 'fontSize' ) document.documentElement.style.fontSize = `${value}px`;
    if ( key === 'highContrast' ) document.documentElement.classList.toggle('high-contrast', value as boolean);
    if ( key === 'reducedMotion' ) document.documentElement.classList.toggle('reduce-motion', value as boolean);
  },

  setKeywords: (keywords) => set({ keywords }),
});
