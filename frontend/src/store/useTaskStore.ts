// store principal — combina todos os slices
// cada slice fica em store/slices/*.ts com ~100-150 linhas
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { normalizePinnedModules } from './slices/uiSlice';
import { overlayRememberedColorScheme, syncColorSchemeAfterRehydrate } from '../utils/themeBootstrap';
import { parseColorScheme, persistColorScheme, readDedicatedColorScheme } from '../utils/applyColorScheme';
import { localTodayIso, resetHabitosParaHoje } from '../lib/healthDayBoundary';
import { getActiveStorageUserId, getPersistStorageKey } from '../lib/userScopedStorage';

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
import { createRelatoriosSlice, type RelatoriosSlice } from './slices/relatoriosSlice';
import { createOnboardingSlice, type OnboardingSlice } from './slices/onboardingSlice';
import { createInboxSlice, type InboxSlice } from './slices/inboxSlice';
import { createNewsSlice, type NewsSlice } from './slices/newsSlice';
import { createContasFixasSlice, type ContasFixasSlice } from './slices/contasFixasSlice';
import { createGamificacaoSlice, type GamificacaoSlice } from './slices/gamificacaoSlice';
import { createAxelExecutionSlice, type AxelExecutionSlice } from './slices/axelExecutionSlice';
import { createAxelStreakSlice, type AxelStreakSlice } from './slices/axelStreakSlice';
import { createAxelTaskMetaSlice, type AxelTaskMetaSlice } from './slices/axelTaskMetaSlice';
import { createAxelZenFocusSlice, type AxelZenFocusSlice } from './slices/axelZenFocusSlice';
import { createAxelOrchestrationSlice, type AxelOrchestrationSlice } from './slices/axelOrchestrationSlice';
import { createAxelAchievementSlice, type AxelAchievementSlice } from './slices/axelAchievementSlice';
import { createAxelDeadlineProposalSlice, type AxelDeadlineProposalSlice } from './slices/axelDeadlineProposalSlice';
import { createUserPrefsSlice, type UserPrefsSlice } from './slices/userPrefsSlice';

// re-exporta types para compatibilidade
export type { ActiveView, Anotacao, TimerConfig, Category, Despesa, Medicamento, UserProfile, AccessibilitySettings, Transaction, VirtualCard, ContaFixa, BudgetLimit, RecurringIncome, FinancialGoal, HabitoDiario, SessaoTreino, Notificacao, HabitoResumo, CalendarEvent, PalavraChave, ProcessarMensagemResult, FocusPhase, FocusState, GamificacaoProfile, DashboardResumo } from './storeTypes';
export type { AnalyticsReport, DashboardReportCard, TrendPoint, RankingItem, PeriodStats } from './slices/relatoriosSlice';

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
  BemEstarSlice &
  RelatoriosSlice &
  OnboardingSlice &
  InboxSlice &
  NewsSlice &
  ContasFixasSlice &
  GamificacaoSlice &
  AxelExecutionSlice &
  AxelStreakSlice &
  AxelTaskMetaSlice &
  AxelZenFocusSlice &
  AxelOrchestrationSlice &
  AxelAchievementSlice &
  AxelDeadlineProposalSlice &
  UserPrefsSlice;

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
      ...createRelatoriosSlice(...a),
      ...createOnboardingSlice(...a),
      ...createInboxSlice(...a),
      ...createNewsSlice(...a),
      ...createContasFixasSlice(...a),
      ...createGamificacaoSlice(...a),
      ...createAxelExecutionSlice(...a),
      ...createAxelStreakSlice(...a),
      ...createAxelTaskMetaSlice(...a),
      ...createAxelZenFocusSlice(...a),
      ...createAxelOrchestrationSlice(...a),
      ...createAxelAchievementSlice(...a),
      ...createAxelDeadlineProposalSlice(...a),
      ...createUserPrefsSlice(...a),
    }),
    {
      name: 'simply-life-store',
      storage: createJSONStorage(() => ({
        getItem: () => localStorage.getItem(getPersistStorageKey(getActiveStorageUserId())),
        setItem: (_name, value) =>
        {
          localStorage.setItem(getPersistStorageKey(getActiveStorageUserId()), value)
        },
        removeItem: () =>
        {
          localStorage.removeItem(getPersistStorageKey(getActiveStorageUserId()))
        },
      })),
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
        userId: state.userId,
        onboardingSteps: state.onboardingSteps,
        onboardingDismissed: state.onboardingDismissed,
        streakCount: state.streakCount,
        lastActiveDate: state.lastActiveDate,
        hasCompletedTaskToday: state.hasCompletedTaskToday,
        hasWellbeingToday: state.hasWellbeingToday,
        streakFreezes: state.streakFreezes,
        streakSavedDays: state.streakSavedDays,
        lastMonthlyFreezeClaim: state.lastMonthlyFreezeClaim,
        focusMinutesByDate: state.focusMinutesByDate,
        taskLastMovedAt: state.taskLastMovedAt,
        taskEstimates: state.taskEstimates,
        taskElapsedSeconds: state.taskElapsedSeconds,
        dailyScoreCap: state.dailyScoreCap,
        personalVelocityFactor: state.personalVelocityFactor,
        velocitySamplesByTag: state.velocitySamplesByTag,
      }),
      merge: (persistedState, currentState) =>
      {
        if (!persistedState) return currentState
        const persisted = persistedState as Partial<typeof currentState>
        const remembered = readDedicatedColorScheme()
        const fromPersist = parseColorScheme(persisted.accessibility?.colorScheme)
        return {
          ...currentState,
          ...persisted,
          accessibility: {
            ...currentState.accessibility,
            ...persisted.accessibility,
            colorScheme: remembered ?? fromPersist ?? currentState.accessibility.colorScheme,
          },
        }
      },
      onRehydrateStorage: () => (state) =>
      {
        if (!state) return

        // Dados sensíveis vêm só do servidor — ignora legado no disco
        state.transactions = []
        state.contasFixas = []
        state.habitos = []
        state.cards = []
        state.tarefas = []
        state.medicamentos = []
        state.despesas = []
        state.reservedBills = []
        state.billSettlements = []
        overlayRememberedColorScheme(state.accessibility)
        const remembered = parseColorScheme(state.accessibility?.colorScheme)
        if (!readDedicatedColorScheme() && getActiveStorageUserId() && remembered)
        {
          persistColorScheme(remembered)
        }
        syncColorSchemeAfterRehydrate()
        if (Array.isArray(state.pinnedModules))
        {
          state.pinnedModules = normalizePinnedModules(state.pinnedModules as string[])
        }
        if (Array.isArray(state.habitos) && state.habitos.length > 0)
        {
          state.habitos = resetHabitosParaHoje(state.habitos, localTodayIso())
        }
      },
    }
  )
);