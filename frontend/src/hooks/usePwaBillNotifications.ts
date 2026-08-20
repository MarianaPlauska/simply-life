import { useEffect, useRef } from 'react'
import { buildUpcomingBills } from '../lib/financeUpcomingBills'
import { isBillDismissed } from '../lib/financeBillDismiss'
import { useTaskStore } from '../store/useTaskStore'

const PUSH_SENT_KEY = 'simply-life-pwa-bill-push-sent'
const SERVER_REGISTERED_KEY = 'simply-life-push-registered'
const WINDOW_HOURS = 48

function wasPushed(billId: string): boolean
{
  try
  {
    const raw = localStorage.getItem(PUSH_SENT_KEY)
    const map = raw ? JSON.parse(raw) as Record<string, string> : {}
    return Boolean(map[billId])
  }
  catch
  {
    return false
  }
}

function markPushed(billId: string): void
{
  try
  {
    const raw = localStorage.getItem(PUSH_SENT_KEY)
    const map = raw ? JSON.parse(raw) as Record<string, string> : {}
    map[billId] = new Date().toISOString()
    localStorage.setItem(PUSH_SENT_KEY, JSON.stringify(map))
  }
  catch { /* quota */ }
}

async function showBillNotification(title: string, body: string): Promise<void>
{
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  const reg = await navigator.serviceWorker?.ready
  if (reg?.showNotification)
  {
    await reg.showNotification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: 'simply-life-bill',
      data: { url: '/financeiro?aba=faturas' },
    })
    return
  }

  // eslint-disable-next-line no-new
  new Notification(title, { body, icon: '/pwa-192x192.png' })
}

/**
 * Fallback local quando Web Push server-side não está registrado.
 * Com VAPID + cron, o servidor envia via /api/cron/push-bills.
 */
export function usePwaBillNotifications(enabled = true): void
{
  const transactions = useTaskStore((s) => s.transactions)
  const contasFixas = useTaskStore((s) => s.contasFixas)
  const cards = useTaskStore((s) => s.cards)
  const reservedBills = useTaskStore((s) => s.reservedBills)
  const isLoggedIn = useTaskStore((s) => s.isLoggedIn)
  const ranPermission = useRef(false)

  useEffect(() =>
  {
    if (!enabled || !isLoggedIn) return
    if (typeof window === 'undefined' || !('Notification' in window)) return

    // servidor ativo — não duplicar alertas locais
    if (localStorage.getItem(SERVER_REGISTERED_KEY))
    {
      return
    }

    if (!ranPermission.current && Notification.permission === 'default')
    {
      ranPermission.current = true
      void Notification.requestPermission()
    }

    if (Notification.permission !== 'granted') return

    const upcoming = buildUpcomingBills({
      contasFixas,
      cards,
      transactions,
      reservedBills,
    }).filter((b) =>
    {
      if (isBillDismissed(b.id)) return false
      const hours = b.daysUntil * 24
      return hours <= WINDOW_HOURS
    })

    for (const bill of upcoming)
    {
      if (wasPushed(bill.id)) continue

      const title = bill.daysUntil === 0
        ? `Uma conta vence hoje`
        : `Uma conta em ${bill.daysUntil} dia(s)`
      const body = `${bill.label} — ${bill.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}. Quando fizer sentido, dá uma olhada.`

      void showBillNotification(title, body).then(() => markPushed(bill.id))
    }
  }, [enabled, isLoggedIn, transactions, contasFixas, cards, reservedBills])
}
