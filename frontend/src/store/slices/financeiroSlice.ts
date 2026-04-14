// slice financeiro — despesas, transações, orçamento
import type { StateCreator } from 'zustand';
import type { Despesa, Transaction, BudgetLimit } from '../storeTypes';
import { API, authHeaders } from '../api';

export interface FinanceiroSlice {
  despesas: Despesa[];
  transactions: Transaction[];
  budgetLimits: BudgetLimit[];
  fetchDespesas: () => Promise<void>;
  addDespesa: (dados: { descricao: string; categoria: string; valor: number }) => Promise<void>;
  fetchTransactions: () => Promise<void>;
  addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void>;
  removeTransaction: (id: number) => void;
  setBudgetLimit: (categoria: string, limite: number) => void;
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
      const res = await fetch(`${API}/despesas`, { headers: authHeaders() });
      if ( !res.ok ) throw new Error('falha');
      const data = await res.json();
      set({ despesas: data.despesas });
    }
    catch (e) { console.error('fetchDespesas:', e); }
  },

  addDespesa: async (dados) =>
  {
    const res = await fetch(`${API}/despesas`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify(dados),
    });
    if ( !res.ok ) throw new Error('falha');
    const data = await res.json();
    set((s) => ({ despesas: [data.despesa, ...s.despesas] }));
  },

  fetchTransactions: async () =>
  {
    try
    {
      const res = await fetch(`${API}/despesas`, { headers: authHeaders() });
      if ( !res.ok ) throw new Error('falha');
      const data = await res.json();
      set({ transactions: data.despesas.map((d: Record<string, unknown>) => ({ ...d, tipo: (d.tipo as string) || 'despesa' })) });
    }
    catch { /* offline */ }
  },

  addTransaction: async (t) =>
  {
    try
    {
      const res = await fetch(`${API}/despesas`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ descricao: t.descricao, categoria: t.categoria, valor: t.valor, data_gasto: t.data }),
      });
      if ( res.ok )
      {
        const data = await res.json();
        set((s) => ({ transactions: [{ ...data.despesa, tipo: t.tipo }, ...s.transactions] }));
      }
    }
    catch { /* offline */ }
    set((s) =>
    {
      const exists = s.transactions.some((tx) => tx.descricao === t.descricao && tx.data === t.data && tx.valor === t.valor);
      if ( exists ) return s;
      return { transactions: [{ id: Date.now(), ...t }, ...s.transactions] };
    });
  },

  removeTransaction: (id) =>
  {
    set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }));
  },

  setBudgetLimit: (categoria, limite) =>
  {
    set((s) => ({
      budgetLimits: s.budgetLimits.map((b) => b.categoria === categoria ? { ...b, limite } : b),
    }));
  },
});
