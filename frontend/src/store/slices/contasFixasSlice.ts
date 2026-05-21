// slice de contas fixas — aluguel, luz, internet, streaming, etc.
import type { StateCreator } from 'zustand'
import type { ContaFixa } from '../storeTypes'
import { supabase } from '../../lib/supabase'

export interface ContasFixasSlice
{
  contasFixas: ContaFixa[]
  fetchContasFixas: () => Promise<void>
  addContaFixa: (conta: Omit<ContaFixa, 'id'>) => Promise<void>
  updateContaFixa: (id: number, dados: Partial<ContaFixa>) => Promise<void>
  removeContaFixa: (id: number) => Promise<void>
  toggleContaFixa: (id: number) => Promise<void>
}

export const createContasFixasSlice: StateCreator<ContasFixasSlice, [], [], ContasFixasSlice> = (set, get) => ({
  contasFixas: [],

  fetchContasFixas: async () =>
  {
    try
    {
      const { data, error } = await supabase
        .from('fin_contas_fixas')
        .select('*')
        .order('dia_vencimento', { ascending: true })
      if (error) throw error
      set({ contasFixas: data || [] })
    }
    catch (e) { console.error('fetchContasFixas:', e) }
  },

  addContaFixa: async (conta) =>
  {
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid)
    {
      set((s) => ({
        contasFixas: [...s.contasFixas, { id: Date.now(), ...conta }],
      }))
      return
    }
    try
    {
      const { data, error } = await supabase
        .from('fin_contas_fixas')
        .insert({ user_id: uid, ...conta })
        .select()
        .single()
      if (error) throw error
      if (data)
      {
        set((s) => ({ contasFixas: [...s.contasFixas, data] }))
        const { toast } = await import('sonner')
        toast.success(`Conta fixa "${conta.nome}" adicionada!`)
      }
    }
    catch (e)
    {
      console.error('addContaFixa:', e)
      set((s) => ({
        contasFixas: [...s.contasFixas, { id: Date.now(), ...conta }],
      }))
    }
  },

  updateContaFixa: async (id, dados) =>
  {
    set((s) => ({
      contasFixas: s.contasFixas.map((c) =>
        c.id === id ? { ...c, ...dados } : c
      ),
    }))
    try
    {
      await supabase
        .from('fin_contas_fixas')
        .update(dados)
        .eq('id', id)
    }
    catch (e) { console.error('updateContaFixa:', e) }
  },

  removeContaFixa: async (id) =>
  {
    set((s) => ({
      contasFixas: s.contasFixas.filter((c) => c.id !== id),
    }))
    try
    {
      await supabase
        .from('fin_contas_fixas')
        .delete()
        .eq('id', id)
      const { toast } = await import('sonner')
      toast.success('Conta fixa removida')
    }
    catch (e) { console.error('removeContaFixa:', e) }
  },

  toggleContaFixa: async (id) =>
  {
    const conta = get().contasFixas.find((c) => c.id === id)
    if (!conta) return
    const newAtiva = !conta.ativa
    set((s) => ({
      contasFixas: s.contasFixas.map((c) =>
        c.id === id ? { ...c, ativa: newAtiva } : c
      ),
    }))
    try
    {
      await supabase
        .from('fin_contas_fixas')
        .update({ ativa: newAtiva })
        .eq('id', id)
    }
    catch
    {
      // revert
      set((s) => ({
        contasFixas: s.contasFixas.map((c) =>
          c.id === id ? { ...c, ativa: !newAtiva } : c
        ),
      }))
    }
  },
})
