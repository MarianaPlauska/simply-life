import { buildFinanceDailyBrief } from './financeDailyBrief'
import { markDailyBriefSent, wasDailyBriefSentToday } from './financeGamification'
import type {
  BudgetLimit,
  Category,
  ContaFixa,
  ReservedBill,
  Transaction,
  VirtualCard,
} from '../store/storeTypes'
import { supabase } from './supabase'

export async function syncFinanceDailyBrief(input: {
  transactions: Transaction[]
  saldoInicial: number
  reservedBills: ReservedBill[]
  contasFixas: ContaFixa[]
  cards: VirtualCard[]
  categories: Category[]
  budgetLimits: BudgetLimit[]
}): Promise<boolean>
{
  if (wasDailyBriefSentToday()) return false

  const brief = buildFinanceDailyBrief(input)
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) return false

  const { error } = await supabase.from('notificacoes').insert({
    user_id: uid,
    tipo: 'financeiro',
    titulo: `Axel · ${brief.headline}`,
    mensagem: brief.detail,
    urgencia: brief.saldoDisponivel < 0 ? 'alta' : 'normal',
    score_urgencia: brief.contasProximas > 0 ? 75 : 60,
    lida: 0,
  })

  if (error) return false

  markDailyBriefSent()
  return true
}
