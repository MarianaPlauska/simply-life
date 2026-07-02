import { buildUpcomingBills } from './financeUpcomingBills'
import {
  isBillDismissed,
  markDueNotifSent,
  wasDueNotifSent,
} from './financeBillDismiss'
import type { ContaFixa, ReservedBill, Transaction, VirtualCard } from '../store/storeTypes'
import { supabase } from './supabase'

export const DUE_WINDOW_DAYS = 3

export interface FinanceDueSyncInput
{
  transactions: Transaction[]
  contasFixas: ContaFixa[]
  cards: VirtualCard[]
  reservedBills: ReservedBill[]
}

export interface FinanceDueSyncResult
{
  created: number
}

/** Insere notificações de vencimento (≤3 dias) e retorna quantas foram criadas */
export async function syncFinanceDueNotifications(
  input: FinanceDueSyncInput,
): Promise<FinanceDueSyncResult>
{
  const upcoming = buildUpcomingBills({
    contasFixas: input.contasFixas,
    cards: input.cards,
    transactions: input.transactions,
    reservedBills: input.reservedBills,
  }).filter((b) => b.daysUntil <= DUE_WINDOW_DAYS && !isBillDismissed(b.id))

  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) return { created: 0 }

  let created = 0

  for (const bill of upcoming)
  {
    if (wasDueNotifSent(bill.id)) continue

    const { data: existing } = await supabase
      .from('notificacoes')
      .select('id')
      .eq('user_id', uid)
      .eq('tipo', 'financeiro')
      .eq('lida', 0)
      .ilike('titulo', `%${bill.label}%`)
      .limit(1)

    if (existing && existing.length > 0)
    {
      markDueNotifSent(bill.id)
      continue
    }

    const urgencia = bill.daysUntil <= 1 ? 'critica' : 'alta'
    const titulo = bill.daysUntil === 0
      ? `Conta vence hoje · ${bill.label}`
      : `Conta em ${bill.daysUntil} dia(s) · ${bill.label}`

    const { error } = await supabase.from('notificacoes').insert({
      user_id: uid,
      tipo: 'financeiro',
      titulo,
      mensagem: `${bill.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} — vencimento ${bill.dueDate.split('-').reverse().join('/')}. Marque como pago em Finanças.`,
      urgencia,
      score_urgencia: bill.daysUntil === 0 ? 95 : 85,
      lida: 0,
    })

    if (!error)
    {
      markDueNotifSent(bill.id)
      created += 1
    }
  }

  return { created }
}
