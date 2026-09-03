/**
 * Recarrega dados remotos após troca de conta - evita misturar cache entre usuários.
 */
import { useTaskStore } from '../store/useTaskStore'

export async function reloadRemoteUserData(): Promise<void>
{
  const s = useTaskStore.getState()
  await Promise.allSettled([
    s.fetchTransactions?.(),
    s.fetchCards?.(),
    s.fetchContasFixas?.(),
    s.fetchCategories?.(),
    s.fetchBudgets?.(),
    s.fetchGoals?.(),
    s.fetchCashAccount?.(),
    s.fetchReservedBills?.(),
    s.fetchRecurringIncomes?.(),
    s.fetchHumorResumo?.(),
    s.fetchDiarioHoje?.(),
    s.fetchEntradasRecentes?.(),
    s.fetchHabitos?.(),
    s.fetchMedicamentos?.(),
    s.fetchTarefas?.(),
    s.fetchAnotacoes?.(),
    s.fetchWorkspacePrefs?.(),
    s.fetchBillSettlements?.(),
  ])
}
