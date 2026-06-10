// slice financeiro — despesas, transações, orçamento via supabase
import type { StateCreator } from 'zustand'
import type { Despesa, Transaction, BudgetLimit, Category, FinancialGoal, VirtualCard } from '../storeTypes'
import { supabase } from '../../lib/supabase'
import { evaluateRule503020Compliance } from './financeiroRule503020'

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
  runFinanceCheck: () => Promise<void>
  evaluateRule503020Compliance: () => Promise<void>
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
          const card_id = cardMatch ? cardMatch[1] : undefined
          const cleanDesc = cardMatch ? d.descricao.replace(/\s*\[card:card_\d+\]/, '').trim() : d.descricao
          return {
            ...d,
            descricao: cleanDesc,
            data: d.data_gasto,
            tipo: d.tipo || 'despesa',
            card_id,
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
        })
        .select()
        .single()
      if (error) throw error
      if (data)
      {
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
            },
            ...s.transactions,
          ]

          // Check card limit usage if card_id is set
          if (t.card_id && t.tipo === 'despesa') {
            const card = s.cards.find(c => c.id === t.card_id)
            if (card) {
              const currentSpent = newTransactions
                .filter(trans => trans.card_id === t.card_id && trans.tipo === 'despesa')
                .reduce((sum, trans) => sum + trans.valor, 0)

              const usagePct = (currentSpent / card.limite) * 100
              if (usagePct >= 80) {
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
                }).then(({ error: notifError }) => {
                  if (notifError) console.error('Limit notification insert error:', notifError)
                })
              }
            }
          }

          return { transactions: newTransactions }
        })
        await evaluateRule503020Compliance(get)
      }
    }
    catch (e)
    {
      console.error('addTransaction error:', e)
      set((s) => ({ transactions: [{ id: Date.now(), ...t }, ...s.transactions] }))
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

  fetchCategories: async () =>
  {
    try
    {
      const { data, error } = await supabase.from('fin_categorias').select('*')
      if (error) throw error
      if (data && data.length > 0) set({ categories: data })
    }
    catch { /* fallback default? */ }
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

    set((s) => ({
      budgetLimits: s.budgetLimits.some(b => b.categoria === categoria)
        ? s.budgetLimits.map((b) => b.categoria === categoria ? { ...b, limite } : b)
        : [...s.budgetLimits, { categoria, limite, categoria_id }]
    }))
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
        // If empty, let's insert default cards so they exist in database for this user
        const uid = (await supabase.auth.getUser()).data.user?.id
        if (uid)
        {
          const defaultCards: Omit<VirtualCard, 'id'>[] = [
            {
              nome: 'Assinaturas Dev',
              titular: 'MARIANA PLAUSKA',
              numero: '•••• •••• •••• 8432',
              validade: '12/31',
              cvv: '123',
              limite: 2500,
              tipo_gradiente: 'purple',
              bandeira: 'mastercard',
              status: 'ativo'
            },
            {
              nome: 'AWS & GCP Cloud',
              titular: 'MARIANA PLAUSKA',
              numero: '•••• •••• •••• 9015',
              validade: '06/30',
              cvv: '456',
              limite: 8000,
              tipo_gradiente: 'obsidian',
              bandeira: 'visa',
              status: 'ativo'
            }
          ]
          
          const insertData = defaultCards.map((c, i) => ({
            ...c,
            id: `card_${Date.now()}_${i}`,
            user_id: uid
          }))
          
          const { data: inserted, error: insertError } = await supabase
            .from('fin_cartoes')
            .insert(insertData)
            .select()
          
          if (!insertError && inserted)
          {
            set({ cards: inserted as VirtualCard[] })
          }
          else
          {
            // Fallback locally
            set({ cards: insertData as VirtualCard[] })
          }
        }
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
