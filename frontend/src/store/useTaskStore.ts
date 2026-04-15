// store principal — combina todos os slices
// cada slice fica em store/slices/*.ts com ~100-150 linhas
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createUISlice, type UISlice } from './slices/uiSlice';
import { createAuthSlice, type AuthSlice } from './slices/authSlice';
import { createTarefasSlice, type TarefasSlice } from './slices/tarefasSlice';
import { createDashboardSlice, type DashboardSlice } from './slices/dashboardSlice';
import { createAnotacoesSlice, type AnotacoesSlice } from './slices/anotacoesSlice';
import { createFinanceiroSlice, type FinanceiroSlice } from './slices/financeiroSlice';
import { createSaudeSlice, type SaudeSlice } from './slices/saudeSlice';
import { createFocoSlice, type FocoSlice } from './slices/focoSlice';
import { createCalendarSlice, type CalendarSlice } from './slices/calendarSlice';
import { createTriagemSlice, type TriagemSlice } from './slices/triagemSlice';
import { createBuscaSlice, type BuscaSlice } from './slices/buscaSlice';
import { createBemEstarSlice, type BemEstarSlice } from './slices/bemEstarSlice';

import { setAuthToken } from './api';

// re-exporta types para compatibilidade
export type { ActiveView, Anotacao, TimerConfig, Despesa, Medicamento, UserProfile, AccessibilitySettings, Transaction, BudgetLimit, HabitoDiario, Notificacao, HabitoResumo, CalendarEvent, PalavraChave, ProcessarMensagemResult, FocusPhase, FocusState, GamificacaoProfile, DashboardResumo } from './storeTypes';

export type TaskStore =
  UISlice &
  AuthSlice &
  TarefasSlice &
  DashboardSlice &
  AnotacoesSlice &
  FinanceiroSlice &
  SaudeSlice &
  FocoSlice &
  CalendarSlice &
  TriagemSlice &
  BuscaSlice &
  BemEstarSlice;

export const useTaskStore = create<TaskStore>()(
  persist(
    (...a) => ({
      ...createUISlice(...a),
      ...createAuthSlice(...a),
      ...createTarefasSlice(...a),
      ...createDashboardSlice(...a),
      ...createAnotacoesSlice(...a),
      ...createFinanceiroSlice(...a),
      ...createSaudeSlice(...a),
      ...createFocoSlice(...a),
      ...createCalendarSlice(...a),
      ...createTriagemSlice(...a),
      ...createBuscaSlice(...a),
      ...createBemEstarSlice(...a),
    }),
    {
      name: 'simply-life-store',
      partialize: (state) => ({
        interactionScore: state.interactionScore,
        sidebarCollapsed: state.sidebarCollapsed,
        timerConfig: state.timerConfig,
        scoreDiario: state.scoreDiario,
        pinnedModules: state.pinnedModules,
        isLoggedIn: state.isLoggedIn,
        userProfile: state.userProfile,
        accessibility: state.accessibility,
        keywords: state.keywords,
        transactions: state.transactions,
        budgetLimits: state.budgetLimits,
        habitos: state.habitos,
        authToken: state.authToken,
      }),
      onRehydrateStorage: () => (state) =>
      {
        // sincroniza token com o módulo api ao restaurar do localStorage
        if ( state?.authToken ) setAuthToken(state.authToken);
      },
    }
  )
);