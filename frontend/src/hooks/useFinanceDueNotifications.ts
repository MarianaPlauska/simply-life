import { useEffect } from 'react'
import { syncFinanceDueNotifications } from '../lib/financeDueNotifications'
import { dismissBill } from '../lib/financeBillDismiss'
import { useTaskStore } from '../store/useTaskStore'

/** Re-sincroniza alertas de vencimento quando dados financeiros mudam (ex.: aba Finanças) */
export function useFinanceDueNotifications(enabled = true): void
{
  const transactions = useTaskStore((s) => s.transactions)
  const contasFixas = useTaskStore((s) => s.contasFixas)
  const cards = useTaskStore((s) => s.cards)
  const reservedBills = useTaskStore((s) => s.reservedBills)
  const fetchNotificacoes = useTaskStore((s) => s.fetchNotificacoes)
  const pulseSino = useTaskStore((s) => s.pulseSino)

  useEffect(() =>
  {
    if (!enabled) return

    let cancelled = false

    const sync = async () =>
    {
      const result = await syncFinanceDueNotifications({
        transactions,
        contasFixas,
        cards,
        reservedBills,
      })

      if (cancelled) return

      await fetchNotificacoes()

      if (result.created > 0)
      {
        pulseSino()
      }
    }

    void sync()
    return () => { cancelled = true }
  }, [enabled, transactions, contasFixas, cards, reservedBills, fetchNotificacoes, pulseSino])
}

export function dismissDueBill(billId: string): void
{
  dismissBill(billId)
}
