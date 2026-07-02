import type { NewTransactionModalMode } from '../../lib/newTransactionModalMode';
import { DEFAULT_NEW_TX_MODAL_MODE } from '../../lib/newTransactionModalMode';
import type { StateCreator } from 'zustand';
import type { ActiveView, TimerConfig, AccessibilitySettings, ColorScheme } from '../storeTypes';
import { applyColorScheme } from '../../utils/applyColorScheme';

/** Dashboard fixo + até 2 atalhos no header */
export function normalizePinnedModules(modules: string[]): string[]
{
  const migrated = modules.map((m) => (m === 'foco' ? 'saude' : m));
  const extras = migrated.filter((m) => m !== PINNED_DASHBOARD_ID).slice(0, MAX_PINNED_MODULES - 1);
  return [PINNED_DASHBOARD_ID, ...extras];
}

export const MAX_PINNED_MODULES = 3;
export const PINNED_DASHBOARD_ID = 'dashboard';

export const PINNABLE_VIEWS: { id: string; label: string }[] = [
  { id: 'kanban', label: 'Kanban' },
  { id: 'saude', label: 'Saúde' },
  { id: 'financeiro', label: 'Finanças' },
  { id: 'anotacoes', label: 'Anotações' },
  { id: 'calendario', label: 'Calendário' },
  { id: 'superhuman', label: 'Foco Superhumano' },
  { id: 'inteligencia', label: 'Inbox IA' },
  { id: 'configuracoes', label: 'Configurações' },
];

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
  /** Drawer lateral Novo lançamento (gasto / receita / investimento) */
  isNewTransactionModalOpen: boolean;
  newTransactionModalMode: NewTransactionModalMode;
  isCommandPaletteOpen: boolean;
  isAxelAskOpen: boolean;
  timerConfig: TimerConfig;
  interactionScore: Record<string, number>;
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  scoreDiario: number;
  pinnedModules: string[];
  accessibility: AccessibilitySettings;
  keywords: string[];
  setActiveView: (view: ActiveView) => void;
  setQuickCaptureOpen: (isOpen: boolean) => void;
  setFinanceQuickCaptureOpen: (isOpen: boolean) => void;
  setFinanceQuickCaptureSeed: (text: string) => void;
  setNewTransactionModalOpen: (isOpen: boolean, mode?: NewTransactionModalMode) => void;
  setCommandPaletteOpen: (isOpen: boolean) => void;
  setAxelAskOpen: (isOpen: boolean) => void;
  setTimerConfig: (key: keyof TimerConfig, value: number) => void;
  registerInteraction: (moduleId: string) => void;
  toggleSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
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
  isNewTransactionModalOpen: false,
  newTransactionModalMode: DEFAULT_NEW_TX_MODAL_MODE,
  isCommandPaletteOpen: false,
  isAxelAskOpen: false,
  timerConfig: { pomodoroTime: 25, shortBreak: 5, longBreak: 15 },
  interactionScore: {},
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  scoreDiario: 0,
  pinnedModules: normalizePinnedModules(['dashboard', 'kanban']),
  accessibility: {
    fontSize: 18,
    highContrast: false,
    reducedMotion: false,
    focusVisible: true,
    soundFeedback: false,
    keyboardShortcuts: true,
    colorScheme: 'light',
  },
  keywords: [] as string[],

  setActiveView: (view) => set({ activeView: view }),
  setQuickCaptureOpen: (isOpen) => set({ isQuickCaptureOpen: isOpen }),
  setFinanceQuickCaptureOpen: (isOpen) => set({ isFinanceQuickCaptureOpen: isOpen }),
  setFinanceQuickCaptureSeed: (text) => set({ financeQuickCaptureSeed: text }),
  setNewTransactionModalOpen: (isOpen, mode) =>
    set({
      isNewTransactionModalOpen: isOpen,
      newTransactionModalMode: isOpen
        ? (mode ?? get().newTransactionModalMode)
        : DEFAULT_NEW_TX_MODAL_MODE,
    }),
  setCommandPaletteOpen: (isOpen) => set({ isCommandPaletteOpen: isOpen }),
  setAxelAskOpen: (isOpen) => set({ isAxelAskOpen: isOpen }),

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
    if (moduleId === PINNED_DASHBOARD_ID) return;
    set((state) =>
    {
      const has = state.pinnedModules.includes(moduleId);
      if (has)
      {
        return {
          pinnedModules: normalizePinnedModules(
            state.pinnedModules.filter((m) => m !== moduleId),
          ),
        };
      }
      if (state.pinnedModules.length >= MAX_PINNED_MODULES)
      {
        return state;
      }
      return {
        pinnedModules: normalizePinnedModules([...state.pinnedModules, moduleId]),
      };
    });
  },

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),

  toggleColorScheme: () =>
  {
    const order: ColorScheme[] = ['light', 'dark']
    const current = get().accessibility.colorScheme
    const idx = order.indexOf(current)
    const next = order[(idx + 1) % order.length]
    set((state) => ({
      accessibility: { ...state.accessibility, colorScheme: next },
    }))
    applyColorScheme(next)
  },

  setAccessibility: (key, value) =>
  {
    set((state) => ({
      accessibility: { ...state.accessibility, [key]: value },
    }));
    if (key === 'fontSize') document.documentElement.style.fontSize = `${value}px`;
    if (key === 'highContrast') document.documentElement.classList.toggle('high-contrast', value as boolean);
    if (key === 'reducedMotion') document.documentElement.classList.toggle('reduce-motion', value as boolean);
    if (key === 'focusVisible') document.documentElement.classList.toggle('focus-enhanced', value as boolean);
    if (key === 'colorScheme') applyColorScheme(value as ColorScheme);
  },

  setKeywords: (keywords) => set({ keywords }),
  sinoDestaqueAte: 0,
  pulseSino: (durationMs = 6000) =>
  {
    set({ sinoDestaqueAte: Date.now() + durationMs });
  },
});
