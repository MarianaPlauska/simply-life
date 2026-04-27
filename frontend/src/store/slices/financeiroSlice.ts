// slice financeiro — despesas, transações, orçamento via supabase
import type { StateCreator } from 'zustand'
import type { Despesa, Transaction, BudgetLimit } from '../storeTypes'
import { supabase } from '../../lib/supabase'

export interface FinanceiroSlice
{
  despesas: Despesa[]
  transactions: Transaction[]
  budgetLimits: BudgetLimit[]
  fetchDespesas: () => Promise<void>
  addDespesa: (dados: { descricao: string; categoria: string; valor: number }) => Promise<void>
  fetchTransactions: () => Promise<void>
  addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void>
  removeTransaction: (id: number) => void
  setBudgetLimit: (categoria: string, limite: number) => void
}

export const createFinanceiroSlice: StateCreator<FinanceiroSlice, [], [], FinanceiroSlice> = (set) => ({
  despesas: [],
  transactions: [],
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
        .order('id', { ascending: false })
      if (error) throw error
      set({
        transactions: (data || []).map((d: Record<string, unknown>) => ({
          ...d,
          tipo: (d.tipo as string) || 'despesa',
        })),
      })
    }
    catch { /* offline */ }
  },

  addTransaction: async (t) =>
  {
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid)
    {
      // fallback local
      set((s) => ({ transactions: [{ id: Date.now(), ...t }, ...s.transactions] }))
      return
    }
    try
    {
      const { data, error } = await supabase
        .from('despesas')
        .insert({
          user_id: uid,
          descricao: t.descricao,
          categoria: t.categoria,
          valor: t.valor,
          data_gasto: t.data,
        })
        .select()
        .single()
      if (error) throw error
      if (data) set((s) => ({ transactions: [{ ...data, tipo: t.tipo }, ...s.transactions] }))
    }
    catch
    {
      // fallback local
      set((s) =>
      {
        const exists = s.transactions.some((tx) => tx.descricao === t.descricao && tx.data === t.data && tx.valor === t.valor)
        if (exists) return s
        return { transactions: [{ id: Date.now(), ...t }, ...s.transactions] }
      })
    }
  },

  removeTransaction: (id) =>
  {
    set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }))
    supabase.from('despesas').delete().eq('id', id).then(() => {})
  },

  setBudgetLimit: (categoria, limite) =>
  {
    set((s) => ({
      budgetLimits: s.budgetLimits.map((b) => b.categoria === categoria ? { ...b, limite } : b),
    }))
  },
})
