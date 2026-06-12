import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { syncFinanceDueNotifications } from '../lib/financeDueNotifications'
import {
  buildAutoPostTransaction,
  isContaFixaDueToday,
  isContaFixaPostedThisMonth,
} from '../lib/financeRecurringPost'
import { useTaskStore } from '../store/useTaskStore'
import { supabase } from '../lib/supabase'

const SINO_DESTAQUE_MS = 6000

/** Sincroniza finanças ao entrar no sistema — alertas no sino + lançamento automático de fixas */
export function useFinanceSystemSync(): void
{
  const syncingRef = useRef(false)

  const fetchTransactions = useTaskStore((s) => s.fetchTransactions)
  const fetchContasFixas = useTaskStore((s) => s.fetchContasFixas)
  const fetchCards = useTaskStore((s) => s.fetchCards)
  const fetchReservedBills = useTaskStore((s) => s.fetchReservedBills)
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
      ])

      if (cancelled) return

      const state = useTaskStore.getState()
      const ref = new Date()
      const postedNames: string[] = []

      for (const conta of state.contasFixas)
      {
        if (!isContaFixaDueToday(conta, ref)) continue
        if (isContaFixaPostedThisMonth(conta.id, state.transactions, ref)) continue

        await addTransaction(buildAutoPostTransaction({ conta, ref }))
        postedNames.push(conta.nome)
      }

      if (postedNames.length > 0 && !cancelled)
      {
        const label = postedNames.length === 1
          ? postedNames[0]
          : `${postedNames.length} contas fixas`
        toast.info(`Axel lançou ${label} — vencimento de hoje`, { duration: 4500 })
      }

      const freshTx = useTaskStore.getState().transactions
      const dueResult = await syncFinanceDueNotifications({
        transactions: freshTx,
        contasFixas: state.contasFixas,
        cards: state.cards,
        reservedBills: state.reservedBills,
      })

      if (cancelled) return

      await fetchNotificacoes()

      const unreadFinance = useTaskStore.getState().notificacoes.filter(
        (n) => !n.lida && n.tipo === 'financeiro',
      ).length

      if (dueResult.created > 0 || unreadFinance > 0)
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
    fetchNotificacoes,
    addTransaction,
    pulseSino,
  ])
}
