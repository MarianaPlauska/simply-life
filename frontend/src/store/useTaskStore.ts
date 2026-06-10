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
import { createRelatoriosSlice, type RelatoriosSlice } from './slices/relatoriosSlice';
import { createOnboardingSlice, type OnboardingSlice } from './slices/onboardingSlice';
import { createInboxSlice, type InboxSlice } from './slices/inboxSlice';
import { createNewsSlice, type NewsSlice } from './slices/newsSlice';
import { createContasFixasSlice, type ContasFixasSlice } from './slices/contasFixasSlice';
import { createGamificacaoSlice, type GamificacaoSlice } from './slices/gamificacaoSlice';
import { createOrionExecutionSlice, type OrionExecutionSlice } from './slices/orionExecutionSlice';
import { createOrionStreakSlice, type OrionStreakSlice } from './slices/orionStreakSlice';
import { createOrionTaskMetaSlice, type OrionTaskMetaSlice } from './slices/orionTaskMetaSlice';
import { createOrionZenFocusSlice, type OrionZenFocusSlice } from './slices/orionZenFocusSlice';
import { createOrionOrchestrationSlice, type OrionOrchestrationSlice } from './slices/orionOrchestrationSlice';
import { createOrionAchievementSlice, type OrionAchievementSlice } from './slices/orionAchievementSlice';

// re-exporta types para compatibilidade
export type { ActiveView, Anotacao, TimerConfig, Category, Despesa, Medicamento, UserProfile, AccessibilitySettings, Transaction, VirtualCard, ContaFixa, BudgetLimit, FinancialGoal, HabitoDiario, SessaoTreino, Notificacao, HabitoResumo, CalendarEvent, PalavraChave, ProcessarMensagemResult, FocusPhase, FocusState, GamificacaoProfile, DashboardResumo } from './storeTypes';
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
  OrionExecutionSlice &
  OrionStreakSlice &
  OrionTaskMetaSlice &
  OrionZenFocusSlice &
  OrionOrchestrationSlice &
  OrionAchievementSlice;

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
      ...createOrionExecutionSlice(...a),
      ...createOrionStreakSlice(...a),
      ...createOrionTaskMetaSlice(...a),
      ...createOrionZenFocusSlice(...a),
      ...createOrionOrchestrationSlice(...a),
      ...createOrionAchievementSlice(...a),
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
        userId: state.userId,
        onboardingSteps: state.onboardingSteps,
        onboardingDismissed: state.onboardingDismissed,
        cards: state.cards,
        contasFixas: state.contasFixas,
        streakCount: state.streakCount,
        lastActiveDate: state.lastActiveDate,
        hasCompletedTaskToday: state.hasCompletedTaskToday,
        streakFreezes: state.streakFreezes,
        focusMinutesByDate: state.focusMinutesByDate,
        taskLastMovedAt: state.taskLastMovedAt,
        taskEstimates: state.taskEstimates,
        taskElapsedSeconds: state.taskElapsedSeconds,
        dailyScoreCap: state.dailyScoreCap,
        personalVelocityFactor: state.personalVelocityFactor,
        velocitySamplesByTag: state.velocitySamplesByTag,
      }),
      onRehydrateStorage: () => () =>
      {
        // supabase auth gerencia sessão automaticamente
      },
    }
  )
);