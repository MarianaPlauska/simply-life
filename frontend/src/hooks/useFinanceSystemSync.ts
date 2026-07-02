import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { syncFinanceDueNotifications } from '../lib/financeDueNotifications'
import { syncFinanceDailyBrief } from '../lib/financeDailyBriefSync'
import { dismissNotificacoesRuido } from '../lib/dismissNotificacoesRuido'
import {
  buildAutoPostTransaction,
  isContaFixaDueToday,
  isContaFixaSatisfiedThisMonth,
} from '../lib/financeRecurringPost'
import {
  buildAutoPostReceitaRecorrente,
  isReceitaRecorrenteDueToday,
  isReceitaRecorrentePostedThisMonth,
} from '../lib/financeRecurringIncomePost'
import { useTaskStore } from '../store/useTaskStore'
import { supabase } from '../lib/supabase'

const SINO_DESTAQUE_MS = 6000

/** Sincroniza finanças ao entrar no sistema — alertas, fixas, receitas e resumo diário */
export function useFinanceSystemSync(): void
{
  const syncingRef = useRef(false)

  const fetchTransactions = useTaskStore((s) => s.fetchTransactions)
  const fetchContasFixas = useTaskStore((s) => s.fetchContasFixas)
  const fetchCards = useTaskStore((s) => s.fetchCards)
  const fetchReservedBills = useTaskStore((s) => s.fetchReservedBills)
  const fetchRecurringIncomes = useTaskStore((s) => s.fetchRecurringIncomes)
  const fetchCategories = useTaskStore((s) => s.fetchCategories)
  const fetchBudgets = useTaskStore((s) => s.fetchBudgets)
  const fetchCashAccount = useTaskStore((s) => s.fetchCashAccount)
  const fetchBillSettlements = useTaskStore((s) => s.fetchBillSettlements)
  const fetchNotificacoes = useTaskStore((s) => s.fetchNotificacoes)
  const addTransaction = useTaskStore((s) => s.addTransaction)
  const pulseSino = useTaskStore((s) => s.pulseSino)

  useEffect(() =>
  {
    let cancelled = false

    const run = async () =>
    {
      if (syncingRef.current) return
      syncingRef.current = true

      try
      {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session || cancelled) return

        await Promise.all([
          fetchTransactions(),
          fetchContasFixas(),
          fetchCards(),
          fetchReservedBills(),
          fetchRecurringIncomes(),
          fetchCategories(),
          fetchBudgets(),
          fetchCashAccount(),
          fetchBillSettlements(),
        ])

        if (cancelled) return

        const state = useTaskStore.getState()
        const ref = new Date()
        const postedFixas: string[] = []
        const postedReceitas: string[] = []

        for (const conta of state.contasFixas)
        {
          if (!isContaFixaDueToday(conta, ref)) continue
          if (isContaFixaSatisfiedThisMonth(conta, state.transactions, state.billSettlements ?? [], ref)) continue

          try
          {
            await addTransaction(buildAutoPostTransaction({ conta, ref }))
            postedFixas.push(conta.nome)
          }
          catch (e)
          {
            console.warn('Auto-post conta fixa ignorado:', conta.nome, e)
          }
        }

        for (const item of state.recurringIncomes)
        {
          if (!isReceitaRecorrenteDueToday(item, ref)) continue
          if (isReceitaRecorrentePostedThisMonth(item.id, state.transactions, ref)) continue

          try
          {
            await addTransaction(buildAutoPostReceitaRecorrente(item, ref))
            postedReceitas.push(item.titulo)
          }
          catch (e)
          {
            console.warn('Auto-post receita ignorado:', item.titulo, e)
          }
        }

        if (postedFixas.length > 0 && !cancelled)
        {
          const label = postedFixas.length === 1 ? postedFixas[0] : `${postedFixas.length} contas fixas`
          toast.info(`Axel lançou ${label} — vencimento de hoje`, { duration: 4500 })
        }

        if (postedReceitas.length > 0 && !cancelled)
        {
          const label = postedReceitas.length === 1 ? postedReceitas[0] : `${postedReceitas.length} receitas`
          toast.success(`Axel registrou ${label} no caixa`, { duration: 4500 })
        }

        const fresh = useTaskStore.getState()

        const dueResult = await syncFinanceDueNotifications({
          transactions: fresh.transactions,
          contasFixas: fresh.contasFixas,
          cards: fresh.cards,
          reservedBills: fresh.reservedBills,
        })

        await syncFinanceDailyBrief({
          transactions: fresh.transactions,
          saldoInicial: fresh.cashAccount.saldo_inicial,
          reservedBills: fresh.reservedBills,
          contasFixas: fresh.contasFixas,
          cards: fresh.cards,
          categories: fresh.categories,
          budgetLimits: fresh.budgetLimits,
        })

        if (cancelled) return

        await fetchNotificacoes()

        const dismissed = await dismissNotificacoesRuido(useTaskStore.getState().notificacoes)
        if (dismissed > 0 && !cancelled)
        {
          await fetchNotificacoes()
        }

        if (dueResult.created > 0)
        {
          pulseSino(SINO_DESTAQUE_MS)
        }
      }
      finally
      {
        syncingRef.current = false
      }
    }

    void run()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) =>
    {
      if (event === 'SIGNED_IN') void run()
    })

    return () =>
    {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [
    fetchTransactions,
    fetchContasFixas,
    fetchCards,
    fetchReservedBills,
    fetchRecurringIncomes,
    fetchCategories,
    fetchBudgets,
    fetchCashAccount,
    fetchBillSettlements,
    fetchNotificacoes,
    addTransaction,
    pulseSino,
  ])
}
