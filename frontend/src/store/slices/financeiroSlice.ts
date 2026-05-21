// slice financeiro — despesas, transações, orçamento via supabase
import type { StateCreator } from 'zustand'
import type { Despesa, Transaction, BudgetLimit, Category, FinancialGoal, VirtualCard } from '../storeTypes'
import { supabase } from '../../lib/supabase'

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
  addCard: (card: Omit<VirtualCard, 'id'>) => void
  removeCard: (id: string) => void
  toggleCardStatus: (id: string) => void
  updateCardLimit: (id: string, limite: number) => void
}

export const createFinanceiroSlice: StateCreator<FinanceiroSlice, [], [], FinanceiroSlice> = (set) => ({
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
  cards: [
    {
      id: 'card_1',
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
      id: 'card_2',
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
  ],

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
        transactions: (data || []).map((d: any) =>
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
        set((s) => ({
          transactions: [
            {
              ...data,
              descricao: t.descricao,
              data: data.data_gasto,
              tipo: t.tipo,
              card_id: t.card_id,
            },
            ...s.transactions,
          ]
        }))
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
    supabase.from('despesas').delete().eq('id', id).then(() => {})
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
        const mapped = data.map((b: any) => ({
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
    const { error } = await supabase.from('fin_metas').update({ valor_atual: valor }).eq('id', id)
    if (error) throw error
    set((s) => ({
      financialGoals: s.financialGoals.map((g) => g.id === id ? { ...g, valor_atual: valor, concluida: valor >= g.valor_alvo } : g)
    }))
  },

  addCard: (card) =>
  {
    set((s) =>
    {
      const newCard = {
        ...card,
        id: 'card_' + Date.now(),
      }
      return {
        cards: [...s.cards, newCard]
      }
    })
  },

  removeCard: (id) =>
  {
    set((s) =>
    {
      return {
        cards: s.cards.filter((c) => c.id !== id)
      }
    })
  },

  toggleCardStatus: (id) =>
  {
    set((s) =>
    {
      return {
        cards: s.cards.map((c) => c.id === id ? { ...c, status: (c.status === 'ativo' ? 'bloqueado' : 'ativo') } : c)
      }
    })
  },

  updateCardLimit: (id, limite) =>
  {
    set((s) =>
    {
      return {
        cards: s.cards.map((c) => c.id === id ? { ...c, limite } : c)
      }
    })
  },
})
