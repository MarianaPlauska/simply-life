/**
 * Limpa estado em memória ao trocar de conta - complementa persistência por usuário.
 */
import type { TaskStore } from './useTaskStore'
import { DEFAULT_EXPENSE_PRESETS } from '../lib/financeExpensePresets'
import { DEFAULT_WORKSPACE_PREFS } from '../lib/userWorkspacePrefs'
import {
  getActiveStorageUserId,
  migrateAllLegacyLocalKeys,
  setActiveStorageUserId,
} from '../lib/userScopedStorage'
import { loadAchievementsForUser } from './slices/axelAchievementSlice'
import { loadCashAccountLocal } from '../lib/financeCashAccount'
import { loadRecurringIncomesLocal } from '../lib/financeRecurringIncomeLocal'
import { loadExpensePresets } from '../lib/financeExpensePresets'
import { resetFinancePlannerInit } from '../hooks/useFinancePlannerInit'

export function getEmptyUserSensitiveState(): Partial<TaskStore>
{
  return {
    transactions: [],
    cards: [],
    contasFixas: [],
    habitos: [],
    despesas: [],
    categories: [],
    financialGoals: [],
    budgetLimits: [
      { categoria: 'habitacao', limite: 2500 },
      { categoria: 'alimentacao', limite: 1200 },
      { categoria: 'transporte', limite: 800 },
      { categoria: 'lazer', limite: 600 },
      { categoria: 'internet', limite: 300 },
      { categoria: 'saude', limite: 500 },
      { categoria: 'educacao', limite: 400 },
      { categoria: 'compras', limite: 500 },
    ],
    keywords: [],
    cashAccount: { saldo_inicial: 0 },
    reservedBills: [],
    reservedBillItems: [],
    recurringIncomes: [],
    expensePresets: [...DEFAULT_EXPENSE_PRESETS],
    tarefas: [],
    anotacoes: [],
    labels: [],
    medicamentos: [],
    humorHoje: null,
    humorHojeLista: [],
    humorSemana: [],
    humorMes: [],
    humorSemanaAgregado: [],
    humorMesAgregado: [],
    entradaHoje: null,
    entradasRecentes: [],
    weeklyReview: null,
    correlacao: null,
    axelMoodCare: null,
    notificacoes: [],
    newsItems: [],
    workspacePrefs: { ...DEFAULT_WORKSPACE_PREFS },
    workspacePrefsLoaded: false,
    recentAchievements: [],
  }
}

function hydrateUserLocalSlices(userId: string | null): Partial<TaskStore>
{
  if (!userId) return {}

  return {
    cashAccount: loadCashAccountLocal(userId),
    recurringIncomes: loadRecurringIncomesLocal(userId),
    expensePresets: loadExpensePresets(userId),
    recentAchievements: loadAchievementsForUser(userId),
  }
}

export async function switchUserSession(nextUserId: string | null): Promise<boolean>
{
  const { useTaskStore } = await import('./useTaskStore')
  const prevUserId = getActiveStorageUserId()
  const currentUserId = useTaskStore.getState().userId || null

  if (prevUserId === nextUserId && currentUserId === (nextUserId ?? ''))
  {
    return false
  }

  setActiveStorageUserId(nextUserId)

  resetFinancePlannerInit()

  if (nextUserId)
  {
    migrateAllLegacyLocalKeys(nextUserId)
  }

  useTaskStore.setState({
    ...getEmptyUserSensitiveState(),
    ...hydrateUserLocalSlices(nextUserId),
    userId: nextUserId ?? '',
    isLoggedIn: Boolean(nextUserId),
    userSessionReady: false,
  })

  await useTaskStore.persist.rehydrate()

  const {
    applyColorScheme,
    parseColorScheme,
    persistColorScheme,
    readDedicatedColorScheme,
  } = await import('../utils/applyColorScheme')
  const dedicated = readDedicatedColorScheme()
  const fromStore = parseColorScheme(useTaskStore.getState().accessibility.colorScheme) ?? 'dark'
  const scheme = dedicated ?? fromStore
  if (!dedicated && nextUserId)
  {
    persistColorScheme(scheme)
  }
  if (scheme !== useTaskStore.getState().accessibility.colorScheme)
  {
    useTaskStore.setState({
      accessibility: { ...useTaskStore.getState().accessibility, colorScheme: scheme },
    })
  }
  applyColorScheme(scheme)
  useTaskStore.getState().applyWorkspaceTheme()

  return true
}
