import { isoMonthsFrom, localTodayIso } from './dates'
import type { ContaAPagar, ContaFixa, FinanceCard } from './financeAccounts'
import type { MobileTask } from './tasks'

/** Contas entram no Kanban nesta janela; no vencimento ficam presas até pagar. */
export const BILL_KANBAN_HORIZON_DAYS = 5

export function calendarDaysBetween(fromIso: string, toIso: string): number
{
  const a = new Date(`${fromIso.slice(0, 10)}T12:00:00`)
  const b = new Date(`${toIso.slice(0, 10)}T12:00:00`)
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

export function nextRecurringDueIso(diaVencimento: number, today: string): string
{
  const thisMonth = dueDateInMonth(today, diaVencimento)
  if (thisMonth >= today) return thisMonth
  return dueDateInMonth(isoMonthsFrom(today, 1), diaVencimento)
}

function billWindow(
  dueIso: string,
  dayIso: string,
  today: string,
): { ok: boolean; locked: boolean; daysLeft: number }
{
  const daysLeft = calendarDaysBetween(dayIso, dueIso)
  const overdue = dueIso < today
  if (overdue)
  {
    return { ok: dayIso === today, locked: true, daysLeft }
  }
  if (daysLeft < 0 || daysLeft > BILL_KANBAN_HORIZON_DAYS)
  {
    return { ok: false, locked: false, daysLeft }
  }
  return { ok: true, locked: dueIso === dayIso, daysLeft }
}

/** Alta prioridade com prazo no dia (ou atrasada) fica no topo até concluir. */
export function isTaskPinnedToDay(
  task: MobileTask,
  dayIso: string,
  today = localTodayIso(),
): boolean
{
  if (task.status === 'done') return false
  if (task.prioridade !== 1) return false
  const due = task.dataVencimento?.slice(0, 10) ?? null
  if (due === dayIso) return true
  if (dayIso === today && (!due || due <= today)) return true
  return false
}

export function sortByDayTime(a: MobileTask, b: MobileTask): number
{
  const ha = a.horaMinutos ?? 24 * 60
  const hb = b.horaMinutos ?? 24 * 60
  if (ha !== hb) return ha - hb
  return a.titulo.localeCompare(b.titulo, 'pt-BR')
}

/** Vencimento civil no mês de `iso`, com dia 31 caindo no último dia do mês. */
export function dueDateInMonth(iso: string, diaVencimento: number): string
{
  const y = Number(iso.slice(0, 4))
  const m = Number(iso.slice(5, 7))
  const last = new Date(y, m, 0).getDate()
  const day = Math.min(Math.max(1, diaVencimento || 1), last)
  return `${iso.slice(0, 7)}-${String(day).padStart(2, '0')}`
}

export function monthPaidKey(
  kind: 'fixa' | 'cartao',
  id: string | number,
  iso: string,
): string
{
  return `${kind}:${id}:${iso.slice(0, 7)}`
}

export type DayDueBill = {
  key: string
  kind: 'fixa' | 'apagar' | 'cartao'
  sourceId: string | number
  titulo: string
  valor: number
  detalhe: string
  dueIso: string
  daysLeft: number
  locked: boolean
}

function pushBill(
  out: DayDueBill[],
  bill: Omit<DayDueBill, 'daysLeft' | 'locked' | 'detalhe'> & { detalhe: string },
  dueIso: string,
  dayIso: string,
  today: string,
)
{
  const win = billWindow(dueIso, dayIso, today)
  if (!win.ok) return
  const when =
    win.locked && dueIso < today
      ? 'Atrasada · prioridade até pagar'
      : win.locked
        ? 'Vence hoje · prioridade até pagar'
        : win.daysLeft === 1
          ? 'Vence amanhã'
          : `Vence em ${win.daysLeft} dias`
  out.push({
    ...bill,
    dueIso,
    daysLeft: win.daysLeft,
    locked: win.locked,
    detalhe: `${bill.detalhe} · ${when}`,
  })
}

/** Contas no Kanban: entram 5 dias antes; no vencimento não saem da prioridade até pagar. */
export function billsDueOnIso(
  dayIso: string,
  fixas: ContaFixa[],
  bills: ContaAPagar[],
  cards: FinanceCard[],
  isMonthPaid: (key: string) => boolean,
  today = localTodayIso(),
): DayDueBill[]
{
  const out: DayDueBill[] = []

  for (const fixa of fixas)
  {
    if (!fixa.ativa) continue
    const dueIso = nextRecurringDueIso(fixa.diaVencimento, today)
    const key = monthPaidKey('fixa', fixa.id, dueIso)
    if (isMonthPaid(key)) continue
    pushBill(
      out,
      {
        key,
        kind: 'fixa',
        sourceId: fixa.id,
        titulo: fixa.nome,
        valor: fixa.valor,
        detalhe: `Fixa · dia ${fixa.diaVencimento}`,
      },
      dueIso,
      dayIso,
      today,
    )
  }

  for (const bill of bills)
  {
    if (bill.status !== 'aberta') continue
    const dueIso = bill.vencimento.slice(0, 10)
    pushBill(
      out,
      {
        key: `apagar:${bill.id}`,
        kind: 'apagar',
        sourceId: bill.id,
        titulo: bill.titulo,
        valor: bill.valor,
        detalhe: 'A pagar',
      },
      dueIso,
      dayIso,
      today,
    )
  }

  for (const card of cards)
  {
    if (card.status !== 'ativo') continue
    if ((card.faturaAberta ?? 0) <= 0) continue
    const dueIso = nextRecurringDueIso(card.diaVencimento, today)
    const key = monthPaidKey('cartao', card.id, dueIso)
    if (isMonthPaid(key)) continue
    pushBill(
      out,
      {
        key,
        kind: 'cartao',
        sourceId: card.id,
        titulo: `Fatura ${card.nome}`,
        valor: card.faturaAberta ?? 0,
        detalhe: `Cartão · dia ${card.diaVencimento}`,
      },
      dueIso,
      dayIso,
      today,
    )
  }

  return out.sort((a, b) =>
  {
    if (a.locked !== b.locked) return a.locked ? -1 : 1
    return a.daysLeft - b.daysLeft
  })
}
