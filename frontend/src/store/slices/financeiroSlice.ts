// slice financeiro — despesas, transações, orçamento via supabase
import type { StateCreator } from 'zustand'
import type {
  Despesa,
  Transaction,
  BudgetLimit,
  CashAccountSettings,
  Category,
  FinancialGoal,
  FinancePaymentMethod,
  VirtualCard,
  ReservedBill,
  ReservedBillItem,
  RecurringIncome,
} from '../storeTypes'
import { checkBudgetAfterSpend } from '../../lib/financeCategoryBudget'
import {
  isMockRecurringIncomeId,
  loadRecurringIncomesLocal,
  persistRecurringIncomesLocal,
} from '../../lib/financeRecurringIncomeLocal'
import { toast } from 'sonner'
import { loadCashAccountLocal, persistCashAccountLocal } from '../../lib/financeCashAccount'
import {
  applySpendToBill,
  nextBillStatus,
} from '../../lib/financeReservedBills'
import { dedupeCategories, missingSeedNames } from '../../lib/financeCategoryDedupe'
import { cardLimitUsagePct, sumOpenInvoiceSpend } from '../../lib/financeCardSpend'
import {
  isMockReservedBillId,
  isMockReservedBillItemId,
  loadReservedBillsLocal,
  snapshotFromStore,
} from '../../lib/financeReservedBillsLocal'
import { supabase } from '../../lib/supabase'
import { evaluateRule503020Compliance } from './financeiroRule503020'
import {
  DEFAULT_EXPENSE_PRESETS,
  loadExpensePresets,
  persistExpensePresets,
  type ExpensePreset,
} from '../../lib/financeExpensePresets'
import { DEFAULT_CATEGORY_SEEDS } from '../../lib/financeDefaultCategories'

interface DatabaseDespesa
{
  id: number;
  descricao: string;
  categoria: string;
  categoria_id?: number;
  valor: number;
  data_gasto: string;
  tipo?: 'receita' | 'despesa';
  status_pagamento?: 'pago' | 'pendente' | 'agendado';
  fatura_reserva_id?: number;
  card_id?: string;
  forma_pagamento?: string;
}

interface DatabaseOrcamento
{
  id: number;
  categoria_id: number;
  limite: number;
}

export interface FinanceiroSlice
{
  despesas: Despesa[]
  transactions: Transaction[]
  categories: Category[]
  budgetLimits: BudgetLimit[]
  financialGoals: FinancialGoal[]
  cards: VirtualCard[]
  fetchDespesas: () => Promise<void>
  addDespesa: (dados: { descricao: string; categoria: string; valor: number }) => Promise<void>
  fetchTransactions: () => Promise<void>
  addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void>
  removeTransaction: (id: number) => void
  fetchCategories: () => Promise<void>
  seedDefaultCategories: () => Promise<void>
  addCategory: (c: Omit<Category, 'id'>) => Promise<void>
  removeCategory: (id: number) => Promise<void>
  fetchBudgets: () => Promise<void>
  setBudgetLimit: (categoria: string, limite: number, categoria_id?: number) => Promise<void>
  fetchGoals: () => Promise<void>
  addGoal: (g: Omit<FinancialGoal, 'id'>) => Promise<void>
  updateGoalProgress: (id: number, valor: number) => Promise<void>
  fetchCards: () => Promise<void>
  addCard: (card: Omit<VirtualCard, 'id'>) => Promise<void>
  removeCard: (id: string) => Promise<void>
  toggleCardStatus: (id: string) => Promise<void>
  updateCardLimit: (id: string, limite: number) => Promise<void>
  updateCardBilling: (id: string, dia_fechamento: number, dia_vencimento: number) => Promise<void>
  updateCardProfile: (
    id: string,
    patch: Partial<Pick<VirtualCard, 'nome' | 'tipo_gradiente' | 'limite' | 'dia_fechamento' | 'dia_vencimento'>>,
  ) => Promise<void>
  markTransactionPaid: (id: number) => Promise<void>
  payCardInvoice: (cardId: string) => Promise<{ ok: boolean; message: string }>
  expensePresets: ExpensePreset[]
  hydrateExpensePresets: () => void
  saveExpensePresets: (presets: ExpensePreset[] | null) => void
  cashAccount: CashAccountSettings
  reservedBills: ReservedBill[]
  reservedBillItems: ReservedBillItem[]
  fetchCashAccount: () => Promise<void>
  setCashInitialBalance: (valor: number) => Promise<void>
  setBankBalance: (valor: number) => Promise<void>
  fetchReservedBills: () => Promise<void>
  fetchReservedBillItems: () => Promise<void>
  addReservedBill: (bill: Omit<ReservedBill, 'id' | 'valor_gasto' | 'status'>) => Promise<void>
  recordBillSpend: (billId: number, valor: number) => Promise<void>
  cancelReservedBill: (id: number) => Promise<void>
  addReservedBillItem: (
    billId: number,
    item: Omit<ReservedBillItem, 'id' | 'fatura_reserva_id'>,
  ) => Promise<void>
  removeReservedBillItem: (id: number) => Promise<void>
  recurringIncomes: RecurringIncome[]
  fetchRecurringIncomes: () => Promise<void>
  addRecurringIncome: (item: Omit<RecurringIncome, 'id'>) => Promise<void>
  removeRecurringIncome: (id: number) => Promise<void>
  toggleRecurringIncome: (id: number) => Promise<void>
  runFinanceCheck: () => Promise<void>
  evaluateRule503020Compliance: () => Promise<void>
}

function notifyBudgetAlert(
  get: () => FinanceiroSlice,
  t: Omit<Transaction, 'id'>,
): void
{
  if (t.tipo !== 'despesa') return

  const state = get()
  const now = new Date()
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthTx = state.transactions.filter((tx) => tx.data.startsWith(monthKey))

  const check = checkBudgetAfterSpend(
    state.categories,
    state.budgetLimits,
    monthTx,
    t.categoria_id,
    t.valor,
  )

  if (!check || check.alert === 'ok') return

  const title = check.alert === 'over' ? 'Orçamento estourado' : 'Orçamento em alerta'
  const description = check.alert === 'over'
    ? `${check.categoryName}: ${check.pct.toFixed(0)}% do limite (R$ ${check.gastoApos.toFixed(2)} de R$ ${check.limite.toFixed(2)}).`
    : `${check.categoryName} em ${check.pct.toFixed(0)}% do limite — revise os gastos.`

  toast.warning(title, { description })
}

export const createFinanceiroSlice: StateCreator<FinanceiroSlice, [], [], FinanceiroSlice> = (set, get) => ({
  despesas: [],
  transactions: [],
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
  cards: [],
  cashAccount: loadCashAccountLocal(),
  reservedBills: [],
  reservedBillItems: [],
  recurringIncomes: loadRecurringIncomesLocal(),
  expensePresets: [...DEFAULT_EXPENSE_PRESETS],

  hydrateExpensePresets: () =>
  {
    set({ expensePresets: loadExpensePresets() })
  },

  saveExpensePresets: (presets) =>
  {
    const next = presets === null ? [...DEFAULT_EXPENSE_PRESETS] : presets
    persistExpensePresets(next)
    set({ expensePresets: next })
  },

  fetchDespesas: async () =>
  {
    try
    {
      const { data, error } = await supabase
        .from('despesas')
        .select('*')
        .order('id', { ascending: false })
      if (error) throw error
      set({ despesas: data || [] })
    }
    catch (e) { console.error('fetchDespesas:', e) }
  },

  addDespesa: async (dados) =>
  {
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid) return
    const { data, error } = await supabase
      .from('despesas')
      .insert({
        user_id: uid,
        descricao: dados.descricao,
        categoria: dados.categoria,
        valor: dados.valor,
        data_gasto: new Date().toISOString().split('T')[0],
      })
      .select()
      .single()
    if (error) throw error
    if (data) set((s) => ({ despesas: [data, ...s.despesas] }))
  },

  fetchTransactions: async () =>
  {
    try
    {
      const { data, error } = await supabase
        .from('despesas')
        .select('*')
        .order('data_gasto', { ascending: false })
      if (error) throw error
      set({
        transactions: (data || []).map((d: DatabaseDespesa) =>
        {
          const cardMatch = d.descricao?.match(/\[card:(card_\d+)\]/)
          const card_id = d.card_id ?? (cardMatch ? cardMatch[1] : undefined)
          const cleanDesc = d.descricao
            .replace(/\s*\[card:card_\d+\]/, '')
            .replace(/\s*\[fixa:\d+\]/, '')
            .replace(/\s*\[receita-recorrente:\d+\]/, '')
            .trim()
          return {
            ...d,
            descricao: cleanDesc,
            data: d.data_gasto,
            tipo: d.tipo || 'despesa',
            card_id,
            fatura_reserva_id: d.fatura_reserva_id,
            forma_pagamento: d.forma_pagamento as FinancePaymentMethod | undefined,
          }
        }),
      })
      await evaluateRule503020Compliance(get)
    }
    catch { /* offline */ }
  },

  addTransaction: async (t) =>
  {
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid)
    {
      set((s) => ({ transactions: [{ id: Date.now(), ...t }, ...s.transactions] }))
      notifyBudgetAlert(get, t)
      return
    }
    try
    {
      const descFinal = t.card_id ? `${t.descricao} [card:${t.card_id}]` : t.descricao
      const { data, error } = await supabase
        .from('despesas')
        .insert({
          user_id: uid,
          descricao: descFinal,
          categoria: t.categoria,
          categoria_id: t.categoria_id,
          valor: t.valor,
          data_gasto: t.data,
          tipo: t.tipo,
          status_pagamento: t.status_pagamento || 'pendente',
          fatura_reserva_id: t.fatura_reserva_id,
          card_id: t.card_id,
          forma_pagamento: t.forma_pagamento,
        })
        .select()
        .single()
      if (error) throw error
      if (data)
      {
        if (t.fatura_reserva_id)
        {
          await get().recordBillSpend(t.fatura_reserva_id, t.valor)
          await get().addReservedBillItem(t.fatura_reserva_id, {
            descricao: t.descricao,
            valor: t.valor,
            despesa_id: data.id,
          })
        }

        const anyGet = get() as any
        if (anyGet.addXP) await anyGet.addXP('financeiro', 10)
        if (anyGet.incrementQuestProgress) await anyGet.incrementQuestProgress('Registrar 1 movimentação', 1)

        set((s) => {
          const newTransactions = [
            {
              ...data,
              descricao: t.descricao,
              data: data.data_gasto,
              tipo: t.tipo,
              card_id: t.card_id,
              fatura_reserva_id: t.fatura_reserva_id,
              forma_pagamento: t.forma_pagamento,
            },
            ...s.transactions,
          ]

          // Alerta de limite — fatura aberta do cartão
          if (t.card_id && t.tipo === 'despesa')
          {
            const card = s.cards.find((c) => c.id === t.card_id)
            if (card)
            {
              const usagePct = cardLimitUsagePct(newTransactions, card)
              const currentSpent = sumOpenInvoiceSpend(newTransactions, card)
              if (usagePct >= 80)
              {
                const urgency = usagePct >= 95 ? 'critica' : 'normal'
                const title = usagePct >= 95 ? 'Limite de Cartão Crítico' : 'Uso de Cartão Elevado'
                const msg = usagePct >= 95
                  ? `Alerta crítico: O cartão "${card.nome}" atingiu ${usagePct.toFixed(0)}% do limite (${currentSpent.toFixed(2)} de ${card.limite.toFixed(2)}).`
                  : `Aviso: O cartão "${card.nome}" atingiu ${usagePct.toFixed(0)}% do limite (${currentSpent.toFixed(2)} de ${card.limite.toFixed(2)}).`

                supabase.from('notificacoes').insert({
                  user_id: uid,
                  tipo: 'financeiro',
                  titulo: title,
                  mensagem: msg,
                  urgencia: urgency,
                  score_urgencia: usagePct >= 95 ? 95 : 80,
                  lida: 0,
                }).then(({ error: notifError }) =>
                {
                  if (notifError) console.error('Limit notification insert error:', notifError)
                })
              }
            }
          }

          return { transactions: newTransactions }
        })
        await evaluateRule503020Compliance(get)
        notifyBudgetAlert(get, t)
      }
    }
    catch (e)
    {
      console.error('addTransaction error:', e)
      set((s) => ({ transactions: [{ id: Date.now(), ...t }, ...s.transactions] }))
      notifyBudgetAlert(get, t)
    }
  },

  removeTransaction: (id) =>
  {
    set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }))
    supabase.from('despesas').delete().eq('id', id).then(async () =>
    {
      await evaluateRule503020Compliance(get)
    })
  },

  markTransactionPaid: async (id) =>
  {
    set((s) => ({
      transactions: s.transactions.map((t) =>
        t.id === id ? { ...t, status_pagamento: 'pago' as const } : t,
      ),
    }))

    try
    {
      const { error } = await supabase
        .from('despesas')
        .update({ status_pagamento: 'pago' })
        .eq('id', id)
      if (error) throw error

      const anyGet = get() as any
      if (anyGet.addXP) await anyGet.addXP('financeiro', 8)
      if (anyGet.incrementQuestProgress)
      {
        await (anyGet.incrementQuestProgress as (t: string, v: number) => Promise<void>)(
          'movimentação',
          1,
        )
      }
    }
    catch (e)
    {
      console.error('markTransactionPaid error:', e)
    }
  },

  fetchCategories: async () =>
  {
    try
    {
      const { data, error } = await supabase.from('fin_categorias').select('*')
      if (error) throw error
      if (data && data.length > 0)
      {
        set({ categories: dedupeCategories(data) })
        return
      }
      await get().seedDefaultCategories()
    }
    catch
    {
      /* offline — mantém estado local */
    }
  },

  seedDefaultCategories: async () =>
  {
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid) return

    const { data: existing } = await supabase.from('fin_categorias').select('*')
    const current = dedupeCategories(existing ?? [])
    const toInsert = missingSeedNames(current, DEFAULT_CATEGORY_SEEDS)

    if (toInsert.length === 0)
    {
      if (current.length > 0) set({ categories: current })
      return
    }

    const rows = toInsert.map((s) => ({
      ...s,
      user_id: uid,
      grupo: s.grupo,
    }))

    const { data, error } = await supabase
      .from('fin_categorias')
      .insert(rows)
      .select()

    if (error)
    {
      console.error('seedDefaultCategories:', error)
      return
    }

    if (data) set({ categories: dedupeCategories([...current, ...data]) })
  },

  addCategory: async (c) =>
  {
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid) return
    const { data, error } = await supabase.from('fin_categorias').insert({ ...c, user_id: uid }).select().single()
    if (error) throw error
    if (data) set((s) => ({ categories: [...s.categories, data] }))
  },

  removeCategory: async (id) =>
  {
    const { error } = await supabase.from('fin_categorias').delete().eq('id', id)
    if (error) throw error
    set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }))
  },

  fetchBudgets: async () =>
  {
    try
    {
      const { data, error } = await supabase.from('fin_orcamentos').select('*')
      if (error) throw error
      if (data && data.length > 0)
      {
        const mapped = data.map((b: DatabaseOrcamento) => ({
          id: b.id,
          categoria_id: b.categoria_id,
          limite: b.limite,
          categoria: String(b.categoria_id), // Legado
        }))
        set({ budgetLimits: mapped })
      }
    }
    catch { /* use default */ }
  },

  setBudgetLimit: async (categoria, limite, categoria_id) =>
  {
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (uid && categoria_id)
    {
      const { error } = await supabase.from('fin_orcamentos').upsert({
        user_id: uid,
        categoria_id,
        limite,
      }, { onConflict: 'user_id,categoria_id' })
      if (error) console.error('setBudgetLimit db error:', error)
    }

    set((s) =>
    {
      const exists = categoria_id != null
        && s.budgetLimits.some((b) => b.categoria_id === categoria_id)

      if (exists && categoria_id != null)
      {
        return {
          budgetLimits: s.budgetLimits.map((b) =>
            b.categoria_id === categoria_id ? { ...b, limite } : b,
          ),
        }
      }

      return {
        budgetLimits: [
          ...s.budgetLimits,
          { categoria, limite, categoria_id },
        ],
      }
    })
  },

  fetchGoals: async () =>
  {
    try
    {
      const { data, error } = await supabase.from('fin_metas').select('*').order('id', { ascending: true })
      if (error) throw error
      set({ financialGoals: data || [] })
    }
    catch { /* offline */ }
  },

  addGoal: async (g) =>
  {
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid) return
    const { data, error } = await supabase.from('fin_metas').insert({ ...g, user_id: uid }).select().single()
    if (error) throw error
    if (data) set((s) => ({ financialGoals: [...s.financialGoals, data] }))
  },

  updateGoalProgress: async (id, valor) =>
  {
    const oldGoal = get().financialGoals.find((g) => g.id === id)
    const wasCompleted = oldGoal?.concluida
    const isCompletedNow = oldGoal ? valor >= oldGoal.valor_alvo : false
    const isCompleting = isCompletedNow && !wasCompleted

    const { error } = await supabase.from('fin_metas').update({ valor_atual: valor, concluida: isCompletedNow }).eq('id', id)
    if (error) throw error
    set((s) => ({
      financialGoals: s.financialGoals.map((g) => g.id === id ? { ...g, valor_atual: valor, concluida: isCompletedNow } : g)
    }))

    if (isCompleting)
    {
      const anyGet = get() as any
      if (anyGet.addXP) await anyGet.addXP('financeiro', 50)
    }
  },

  fetchCards: async () =>
  {
    try
    {
      const { data, error } = await supabase
        .from('fin_cartoes')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      
      if (data && data.length > 0)
      {
        set({ cards: data as VirtualCard[] })
      }
      else
      {
        set({ cards: [] })
      }
    }
    catch (e) { console.error('fetchCards error:', e) }
  },

  addCard: async (card) =>
  {
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid) return
    const newId = 'card_' + Date.now()
    const newCard = {
      id: newId,
      user_id: uid,
      nome: card.nome,
      titular: card.titular,
      numero: card.numero,
      validade: card.validade,
      cvv: card.cvv,
      limite: card.limite,
      dia_vencimento: card.dia_vencimento,
      dia_fechamento: card.dia_fechamento,
      tipo_gradiente: card.tipo_gradiente,
      bandeira: card.bandeira,
      status: card.status,
    }
    try
    {
      const { data, error } = await supabase
        .from('fin_cartoes')
        .insert(newCard)
        .select()
        .single()
      if (error) throw error
      if (data)
      {
        set((s) => ({ cards: [...s.cards, data as VirtualCard] }))
      }
    }
    catch (e) { console.error('addCard db error:', e) }
  },

  removeCard: async (id) =>
  {
    try
    {
      const { error } = await supabase.from('fin_cartoes').delete().eq('id', id)
      if (error) throw error
      set((s) => ({ cards: s.cards.filter((c) => c.id !== id) }))
    }
    catch (e) { console.error('removeCard db error:', e) }
  },

  toggleCardStatus: async (id) =>
  {
    let targetCard: VirtualCard | undefined
    set((s) =>
    {
      const card = s.cards.find((c) => c.id === id)
      if (card)
      {
        targetCard = { ...card, status: card.status === 'ativo' ? 'bloqueado' : 'ativo' }
        return {
          cards: s.cards.map((c) => c.id === id ? targetCard! : c)
        }
      }
      return {}
    })

    if (targetCard)
    {
      try
      {
        const { error } = await supabase
          .from('fin_cartoes')
          .update({ status: targetCard.status })
          .eq('id', id)
        if (error) throw error
      }
      catch (e) { console.error('toggleCardStatus db error:', e) }
    }
  },

  updateCardLimit: async (id, limite) =>
  {
    set((s) => ({
      cards: s.cards.map((c) => c.id === id ? { ...c, limite } : c)
    }))

    try
    {
      const { error } = await supabase
        .from('fin_cartoes')
        .update({ limite })
        .eq('id', id)
      if (error) throw error
    }
    catch (e) { console.error('updateCardLimit db error:', e) }
  },

  updateCardBilling: async (id, dia_fechamento, dia_vencimento) =>
  {
    set((s) => ({
      cards: s.cards.map((c) =>
        c.id === id ? { ...c, dia_fechamento, dia_vencimento } : c,
      ),
    }))

    try
    {
      const { error } = await supabase
        .from('fin_cartoes')
        .update({ dia_fechamento, dia_vencimento })
        .eq('id', id)
      if (error) throw error
    }
    catch (e) { console.error('updateCardBilling db error:', e) }
  },

  updateCardProfile: async (id, patch) =>
  {
    set((s) => ({
      cards: s.cards.map((c) => c.id === id ? { ...c, ...patch } : c),
    }))

    try
    {
      const { error } = await supabase
        .from('fin_cartoes')
        .update(patch)
        .eq('id', id)
      if (error) throw error
    }
    catch (e)
    {
      console.error('updateCardProfile db error:', e)
    }
  },

  payCardInvoice: async (cardId) =>
  {
    const { getBillingCycle, getInvoiceTransactions, sumInvoice } = await import('../../lib/financeCardCycle')
    const card = get().cards.find((c) => c.id === cardId)
    if (!card)
    {
      return { ok: false, message: 'Cartão não encontrado' }
    }

    const cycle = getBillingCycle(card)
    const invoiceTx = getInvoiceTransactions(get().transactions, cardId, cycle)
    const total = sumInvoice(invoiceTx)

    if (total <= 0)
    {
      return { ok: false, message: 'Fatura aberta sem compras' }
    }

    const today = new Date().toISOString().slice(0, 10)
    await get().addTransaction({
      descricao: `Pagamento fatura · ${card.nome}`,
      valor: total,
      tipo: 'despesa',
      categoria: 'cartao',
      data: today,
      status_pagamento: 'pago',
      forma_pagamento: 'pix',
    })

    return {
      ok: true,
      message: `Fatura de ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} registrada no caixa`,
    }
  },

  fetchCashAccount: async () =>
  {
    const local = loadCashAccountLocal()
    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid)
      {
        set({ cashAccount: local })
        return
      }
      const { data, error } = await supabase
        .from('fin_conta_corrente')
        .select('saldo_inicial, saldo_banco, saldo_banco_at')
        .eq('user_id', uid)
        .maybeSingle()
      if (error) throw error
      if (data)
      {
        const next: CashAccountSettings = {
          saldo_inicial: Number(data.saldo_inicial) || 0,
          saldo_banco: data.saldo_banco != null ? Number(data.saldo_banco) : null,
          saldo_banco_at: data.saldo_banco_at ?? null,
        }
        persistCashAccountLocal(next)
        set({ cashAccount: next })
      }
      else
      {
        set({ cashAccount: local })
      }
    }
    catch
    {
      set({ cashAccount: local })
    }
  },

  setCashInitialBalance: async (valor) =>
  {
    const prev = get().cashAccount
    const next: CashAccountSettings = {
      ...prev,
      saldo_inicial: Math.max(0, valor),
    }
    persistCashAccountLocal(next)
    set({ cashAccount: next })

    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid) return
      await supabase.from('fin_conta_corrente').upsert({
        user_id: uid,
        saldo_inicial: next.saldo_inicial,
        saldo_banco: next.saldo_banco ?? null,
        saldo_banco_at: next.saldo_banco_at ?? null,
        updated_at: new Date().toISOString(),
      })
    }
    catch (e) { console.error('setCashInitialBalance:', e) }
  },

  setBankBalance: async (valor) =>
  {
    const prev = get().cashAccount
    const now = new Date().toISOString()
    const next: CashAccountSettings = {
      ...prev,
      saldo_banco: Math.max(0, valor),
      saldo_banco_at: now,
    }
    persistCashAccountLocal(next)
    set({ cashAccount: next })

    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid) return

      await supabase.from('fin_conta_corrente').upsert({
        user_id: uid,
        saldo_inicial: prev.saldo_inicial,
        saldo_banco: next.saldo_banco,
        saldo_banco_at: now,
        updated_at: now,
      })

      const { recordReconciliationStreak } = await import('../../lib/financeGamification')
      const { buildReconciliationSnapshot } = await import('../../lib/financeReconciliation')
      const snap = buildReconciliationSnapshot(
        get().transactions,
        next,
        get().reservedBills,
      )
      const streak = recordReconciliationStreak(snap.alinhado)

      const anyGet = get() as any
      if (anyGet.addXP) await anyGet.addXP('financeiro', 15)
      if (anyGet.incrementQuestProgress) await anyGet.incrementQuestProgress('financeira', 1)

      const { toast } = await import('sonner')
      if (snap.alinhado)
      {
        toast.success('Saldo conferido com o banco', {
          description: streak > 1 ? `Streak de reconciliação: ${streak} dias` : '+15 XP financeiro',
        })
      }
      else if (snap.delta != null)
      {
        toast.info(snap.axelHeadline, { description: snap.axelDetail })
      }
    }
    catch (e) { console.error('setBankBalance:', e) }
  },

  fetchReservedBills: async () =>
  {
    try
    {
      const { data, error } = await supabase
        .from('fin_faturas_reservas')
        .select('*')
        .order('data_vencimento', { ascending: true })
      if (error) throw error

      const mapped = (data ?? []).map((r) => ({
        id: r.id,
        titulo: r.titulo,
        valor_alocado: Number(r.valor_alocado),
        valor_gasto: Number(r.valor_gasto),
        data_vencimento: r.data_vencimento,
        card_id: r.card_id ?? undefined,
        categoria_id: r.categoria_id ?? undefined,
        status: r.status as ReservedBill['status'],
      }))

      if (mapped.length > 0)
      {
        set({ reservedBills: mapped })
        return
      }

      set({ reservedBills: [], reservedBillItems: [] })
    }
    catch (e)
    {
      console.error('fetchReservedBills:', e)
      set({ reservedBills: [], reservedBillItems: [] })
    }
  },

  addReservedBill: async (bill) =>
  {
    const uid = (await supabase.auth.getUser()).data.user?.id
    const draft: ReservedBill = {
      id: Date.now(),
      ...bill,
      valor_gasto: 0,
      status: 'aberta',
    }

    if (!uid)
    {
      set((s) =>
      {
        const reservedBills = [...s.reservedBills, draft]
        snapshotFromStore(reservedBills, s.reservedBillItems)
        return { reservedBills }
      })
      return
    }

    const { data, error } = await supabase
      .from('fin_faturas_reservas')
      .insert({
        user_id: uid,
        titulo: bill.titulo,
        valor_alocado: bill.valor_alocado,
        valor_gasto: 0,
        data_vencimento: bill.data_vencimento,
        card_id: bill.card_id,
        categoria_id: bill.categoria_id,
        status: 'aberta',
      })
      .select()
      .single()

    if (error)
    {
      console.error('addReservedBill:', error)
      const mockDraft: ReservedBill = {
        ...draft,
        id: 900_050 + get().reservedBills.filter((b) => isMockReservedBillId(b.id)).length,
      }
      set((s) =>
      {
        const reservedBills = [...s.reservedBills, mockDraft]
        snapshotFromStore(reservedBills, s.reservedBillItems)
        return { reservedBills }
      })
      return
    }

    if (data)
    {
      set((s) => ({
        reservedBills: [...s.reservedBills, {
          id: data.id,
          titulo: data.titulo,
          valor_alocado: Number(data.valor_alocado),
          valor_gasto: 0,
          data_vencimento: data.data_vencimento,
          card_id: data.card_id ?? undefined,
          categoria_id: data.categoria_id ?? undefined,
          status: 'aberta',
        }],
      }))
    }
  },

  recordBillSpend: async (billId, valor) =>
  {
    const bill = get().reservedBills.find((b) => b.id === billId)
    if (!bill || bill.status !== 'aberta') return

    const applied = applySpendToBill(bill, valor)
    if (applied <= 0) return

    const valor_gasto = bill.valor_gasto + applied
    const status = nextBillStatus(bill, valor_gasto)

    set((s) =>
    {
      const reservedBills = s.reservedBills.map((b) =>
        b.id === billId ? { ...b, valor_gasto, status } : b,
      )
      snapshotFromStore(reservedBills, s.reservedBillItems)
      return { reservedBills }
    })

    if (isMockReservedBillId(billId)) return

    try
    {
      await supabase
        .from('fin_faturas_reservas')
        .update({ valor_gasto, status })
        .eq('id', billId)
    }
    catch (e) { console.error('recordBillSpend:', e) }
  },

  cancelReservedBill: async (id) =>
  {
    set((s) =>
    {
      const reservedBills = s.reservedBills.map((b) =>
        b.id === id ? { ...b, status: 'cancelada' as const } : b,
      )
      snapshotFromStore(reservedBills, s.reservedBillItems)
      return { reservedBills }
    })

    if (isMockReservedBillId(id)) return

    try
    {
      await supabase
        .from('fin_faturas_reservas')
        .update({ status: 'cancelada' })
        .eq('id', id)
    }
    catch (e) { console.error('cancelReservedBill:', e) }
  },

  fetchReservedBillItems: async () =>
  {
    try
    {
      const { data, error } = await supabase
        .from('fin_fatura_itens')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error

      const mapped: ReservedBillItem[] = (data ?? []).map((r) => ({
        id: r.id,
        fatura_reserva_id: r.fatura_reserva_id,
        descricao: r.descricao,
        valor: Number(r.valor),
        parcela_atual: r.parcela_atual ?? undefined,
        parcela_total: r.parcela_total ?? undefined,
        destaque: r.destaque === 'erro' ? ('erro' as const) : null,
        despesa_id: r.despesa_id ?? undefined,
        created_at: r.created_at,
      }))

      if (mapped.length > 0)
      {
        set({ reservedBillItems: mapped })
        return
      }

      const local = loadReservedBillsLocal()
      if (local?.items.length)
      {
        set({ reservedBillItems: local.items })
        return
      }

      if (get().reservedBills.length === 0)
      {
        set({ reservedBills: [], reservedBillItems: [] })
      }
    }
    catch (e)
    {
      console.error('fetchReservedBillItems:', e)
      const local = loadReservedBillsLocal()
      if (local?.items.length)
      {
        set({ reservedBillItems: local.items })
      }
    }
  },

  addReservedBillItem: async (billId, item) =>
  {
    const uid = (await supabase.auth.getUser()).data.user?.id
    const draft: ReservedBillItem = {
      id: Date.now(),
      fatura_reserva_id: billId,
      ...item,
    }

    if (!uid || isMockReservedBillId(billId))
    {
      set((s) =>
      {
        const reservedBillItems = [...s.reservedBillItems, draft]
        snapshotFromStore(s.reservedBills, reservedBillItems)
        return { reservedBillItems }
      })
      return
    }

    const { data, error } = await supabase
      .from('fin_fatura_itens')
      .insert({
        user_id: uid,
        fatura_reserva_id: billId,
        descricao: item.descricao,
        valor: item.valor,
        parcela_atual: item.parcela_atual,
        parcela_total: item.parcela_total,
        destaque: item.destaque,
        despesa_id: item.despesa_id,
      })
      .select()
      .single()

    if (error)
    {
      console.error('addReservedBillItem:', error)
      set((s) =>
      {
        const reservedBillItems = [...s.reservedBillItems, draft]
        snapshotFromStore(s.reservedBills, reservedBillItems)
        return { reservedBillItems }
      })
      return
    }

    if (data)
    {
      set((s) => ({
        reservedBillItems: [...s.reservedBillItems, {
          id: data.id,
          fatura_reserva_id: data.fatura_reserva_id,
          descricao: data.descricao,
          valor: Number(data.valor),
          parcela_atual: data.parcela_atual ?? undefined,
          parcela_total: data.parcela_total ?? undefined,
          destaque: data.destaque === 'erro' ? 'erro' : null,
          despesa_id: data.despesa_id ?? undefined,
          created_at: data.created_at,
        }],
      }))
    }
  },

  removeReservedBillItem: async (id) =>
  {
    set((s) =>
    {
      const reservedBillItems = s.reservedBillItems.filter((i) => i.id !== id)
      snapshotFromStore(s.reservedBills, reservedBillItems)
      return { reservedBillItems }
    })

    if (isMockReservedBillItemId(id)) return

    try
    {
      await supabase.from('fin_fatura_itens').delete().eq('id', id)
    }
    catch (e) { console.error('removeReservedBillItem:', e) }
  },

  fetchRecurringIncomes: async () =>
  {
    try
    {
      const { data, error } = await supabase
        .from('fin_receitas_recorrentes')
        .select('*')
        .order('id', { ascending: true })
      if (error) throw error

      if (data && data.length > 0)
      {
        set({
          recurringIncomes: data.map((r) => ({
            id: r.id,
            titulo: r.titulo,
            valor: Number(r.valor),
            dia_recebimento: r.dia_recebimento,
            categoria_id: r.categoria_id ?? undefined,
            ativa: r.ativa,
          })),
        })
        return
      }

      set({ recurringIncomes: loadRecurringIncomesLocal() })
    }
    catch (e)
    {
      console.error('fetchRecurringIncomes:', e)
      set({ recurringIncomes: loadRecurringIncomesLocal() })
    }
  },

  addRecurringIncome: async (item) =>
  {
    const uid = (await supabase.auth.getUser()).data.user?.id
    const draft: RecurringIncome = { id: Date.now(), ...item }

    if (!uid)
    {
      set((s) =>
      {
        const recurringIncomes = [...s.recurringIncomes, draft]
        persistRecurringIncomesLocal(recurringIncomes)
        return { recurringIncomes }
      })
      return
    }

    const { data, error } = await supabase
      .from('fin_receitas_recorrentes')
      .insert({
        user_id: uid,
        titulo: item.titulo,
        valor: item.valor,
        dia_recebimento: item.dia_recebimento,
        categoria_id: item.categoria_id,
        ativa: item.ativa,
      })
      .select()
      .single()

    if (error)
    {
      console.error('addRecurringIncome:', error)
      return
    }

    if (data)
    {
      set((s) => ({
        recurringIncomes: [
          ...s.recurringIncomes,
          {
            id: data.id,
            titulo: data.titulo,
            valor: Number(data.valor),
            dia_recebimento: data.dia_recebimento,
            categoria_id: data.categoria_id ?? undefined,
            ativa: data.ativa,
          },
        ],
      }))
    }
  },

  removeRecurringIncome: async (id) =>
  {
    set((s) =>
    {
      const recurringIncomes = s.recurringIncomes.filter((r) => r.id !== id)
      persistRecurringIncomesLocal(recurringIncomes)
      return { recurringIncomes }
    })

    if (isMockRecurringIncomeId(id)) return

    try
    {
      await supabase.from('fin_receitas_recorrentes').delete().eq('id', id)
    }
    catch (e) { console.error('removeRecurringIncome:', e) }
  },

  toggleRecurringIncome: async (id) =>
  {
    const current = get().recurringIncomes.find((r) => r.id === id)
    if (!current) return

    const ativa = !current.ativa

    set((s) =>
    {
      const recurringIncomes = s.recurringIncomes.map((r) =>
        r.id === id ? { ...r, ativa } : r,
      )
      persistRecurringIncomesLocal(recurringIncomes)
      return { recurringIncomes }
    })

    if (isMockRecurringIncomeId(id)) return

    try
    {
      await supabase.from('fin_receitas_recorrentes').update({ ativa }).eq('id', id)
    }
    catch (e) { console.error('toggleRecurringIncome:', e) }
  },

  runFinanceCheck: async () =>
  {
    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid) return

      const { checkVencimentosFinanceiros } = await import('../../services/activeOrchestratorService')

      // Use current cards and contasFixas from localStorage/state
      // ContasFixas are in a separate slice, so we read from Supabase directly
      const { data: contasFixas } = await supabase
        .from('fin_contas_fixas')
        .select('id, nome, valor, dia_vencimento, ativa')
        .eq('ativa', true)

      const storeCards = (await supabase
        .from('fin_cartoes')
        .select('id, nome, dia_vencimento, limite')
        .eq('status', 'ativo')).data ?? []

      const created = await checkVencimentosFinanceiros(uid, storeCards, contasFixas ?? [])

      if (created > 0)
      {
        const { toast } = await import('sonner')
        toast.info(`${created} vencimento${created > 1 ? 's' : ''} financeiro${created > 1 ? 's' : ''} detectado${created > 1 ? 's' : ''}`, {
          description: 'Tarefas criadas automaticamente no seu Kanban.',
        })
      }
    }
    catch (e) { console.error('runFinanceCheck:', e) }
  },

  evaluateRule503020Compliance: async () =>
  {
    await evaluateRule503020Compliance(get)
  },
})
