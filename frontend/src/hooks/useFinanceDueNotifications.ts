import { useEffect, useRef } from 'react'
import { syncFinanceDueNotifications } from '../lib/financeDueNotifications'
import { dismissBill } from '../lib/financeBillDismiss'
import { useTaskStore } from '../store/useTaskStore'

const SYNC_DEBOUNCE_MS = 1200

/** Re-sincroniza alertas de vencimento quando dados financeiros mudam (debounced) */
export function useFinanceDueNotifications(enabled = true): void
{
  const transactions = useTaskStore((s) => s.transactions)
  const contasFixas = useTaskStore((s) => s.contasFixas)
  const cards = useTaskStore((s) => s.cards)
  const reservedBills = useTaskStore((s) => s.reservedBills)
  const fetchNotificacoes = useTaskStore((s) => s.fetchNotificacoes)
  const pulseSino = useTaskStore((s) => s.pulseSino)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const syncingRef = useRef(false)

  useEffect(() =>
  {
    if (!enabled) return

    if (timerRef.current)
    {
      clearTimeout(timerRef.current)
    }

    let cancelled = false

    timerRef.current = setTimeout(() =>
    {
      const sync = async () =>
      {
        if (syncingRef.current) return
        syncingRef.current = true
        try
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
        finally
        {
          syncingRef.current = false
        }
      }

      void sync()
    }, SYNC_DEBOUNCE_MS)

    return () =>
    {
      cancelled = true
      if (timerRef.current)
      {
        clearTimeout(timerRef.current)
      }
    }
  }, [enabled, transactions, contasFixas, cards, reservedBills, fetchNotificacoes, pulseSino])
}

export function dismissDueBill(billId: string): void
{
  dismissBill(billId)
}
