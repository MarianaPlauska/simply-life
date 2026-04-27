// slice de saúde — medicamentos, hábitos, streaks via supabase
import type { StateCreator } from 'zustand'
import type { Medicamento, HabitoDiario } from '../storeTypes'
import type { HabitoStreak } from '../../types'
import { supabase } from '../../lib/supabase'

export interface SaudeSlice
{
  medicamentos: Medicamento[]
  habitos: HabitoDiario[]
  habitosStreaks: HabitoStreak[]
  fetchMedicamentos: () => Promise<void>
  addMedicamento: (med: { nome: string; horario: string }) => Promise<void>
  toggleMedicamento: (id: number) => Promise<void>
  fetchHabitos: () => Promise<void>
  addHabito: (h: { tipo: string; nome_exibicao: string; meta_diaria: number; unidade: string }) => Promise<void>
  incrementHabito: (id: number) => Promise<void>
  decrementHabito: (id: number) => Promise<void>
  deleteHabito: (id: number) => Promise<void>
  fetchHabitosStreaks: () => Promise<void>
}

export const createSaudeSlice: StateCreator<SaudeSlice, [], [], SaudeSlice> = (set) => ({
  medicamentos: [],
  habitos: [],
  habitosStreaks: [] as HabitoStreak[],

  fetchMedicamentos: async () =>
  {
    try
    {
      const { data, error } = await supabase
        .from('medicamentos')
        .select('*')
      if (error) throw error
      set({ medicamentos: (data || []).map((m) => ({ ...m, tomado: m.tomado_hoje === 1 })) })
    }
    catch (e) { console.error('fetchMedicamentos:', e) }
  },

  addMedicamento: async (med) =>
  {
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid)
    {
      set((s) => ({ medicamentos: [...s.medicamentos, { id: Date.now(), nome: med.nome, horario: med.horario, tomado: false }] }))
      return
    }
    try
    {
      const { data, error } = await supabase
        .from('medicamentos')
        .insert({ user_id: uid, nome: med.nome, horario: med.horario })
        .select()
        .single()
      if (error) throw error
      if (data) set((s) => ({ medicamentos: [...s.medicamentos, { ...data, tomado: data.tomado_hoje === 1 }] }))
    }
    catch
    {
      set((s) => ({ medicamentos: [...s.medicamentos, { id: Date.now(), nome: med.nome, horario: med.horario, tomado: false }] }))
    }
  },

  toggleMedicamento: async (id) =>
  {
    // optimistic update
    set((s) => ({
      medicamentos: s.medicamentos.map((m) => m.id === id ? { ...m, tomado: !m.tomado } : m),
    }))
    try
    {
      // busca valor atual e inverte
      const { data: current } = await supabase.from('medicamentos').select('tomado_hoje').eq('id', id).single()
      await supabase.from('medicamentos').update({ tomado_hoje: current?.tomado_hoje === 1 ? 0 : 1 }).eq('id', id)
    }
    catch
    {
      // reverte optimistic
      set((s) => ({
        medicamentos: s.medicamentos.map((m) => m.id === id ? { ...m, tomado: !m.tomado } : m),
      }))
    }
  },

  fetchHabitos: async () =>
  {
    try
    {
      const { data, error } = await supabase
        .from('habitos_diarios')
        .select('*')
      if (error) throw error
      set({ habitos: data || [] })
    }
    catch { /* offline */ }
  },

  addHabito: async (h) =>
  {
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid)
    {
      set((s) => ({ habitos: [...s.habitos, { id: Date.now(), progresso_atual: 0, ...h }] }))
      return
    }
    try
    {
      const { data, error } = await supabase
        .from('habitos_diarios')
        .insert({ user_id: uid, ...h, progresso_atual: 0 })
        .select()
        .single()
      if (error) throw error
      if (data) set((s) => ({ habitos: [...s.habitos, data] }))
    }
    catch
    {
      set((s) => ({ habitos: [...s.habitos, { id: Date.now(), progresso_atual: 0, ...h }] }))
    }
  },

  incrementHabito: async (id) =>
  {
    set((s) => ({
      habitos: s.habitos.map((h) =>
        h.id === id ? { ...h, progresso_atual: Math.min(h.progresso_atual + 1, h.meta_diaria) } : h
      ),
    }))
    try
    {
      const { data: h } = await supabase.from('habitos_diarios').select('progresso_atual, meta_diaria').eq('id', id).single()
      if (h) await supabase.from('habitos_diarios').update({ progresso_atual: Math.min(h.progresso_atual + 1, h.meta_diaria) }).eq('id', id)
    }
    catch { /* offline */ }
  },

  decrementHabito: async (id) =>
  {
    set((s) => ({
      habitos: s.habitos.map((h) =>
        h.id === id ? { ...h, progresso_atual: Math.max(h.progresso_atual - 1, 0) } : h
      ),
    }))
    try
    {
      const { data: h } = await supabase.from('habitos_diarios').select('progresso_atual').eq('id', id).single()
      if (h) await supabase.from('habitos_diarios').update({ progresso_atual: Math.max(h.progresso_atual - 1, 0) }).eq('id', id)
    }
    catch { /* offline */ }
  },

  deleteHabito: async (id) =>
  {
    set((s) => ({ habitos: s.habitos.filter((h) => h.id !== id) }))
    try { await supabase.from('habitos_diarios').delete().eq('id', id) }
    catch { /* offline */ }
  },

  fetchHabitosStreaks: async () =>
  {
    try
    {
      const { data, error } = await supabase
        .from('historico_habitos')
        .select('habito_id, data, concluido')
        .order('data', { ascending: false })
      if (error) throw error
      // agrupa por habito e calcula streak
      const streakMap = new Map<number, number>()
      if (data)
      {
        for (const row of data)
        {
          if (row.concluido === 1)
          {
            streakMap.set(row.habito_id, (streakMap.get(row.habito_id) || 0) + 1)
          }
        }
      }
      const streaks: HabitoStreak[] = Array.from(streakMap.entries()).map(([habito_id, streak_atual]) => ({
        habito_id,
        streak_atual,
        melhor_streak: streak_atual,
      }))
      set({ habitosStreaks: streaks })
    }
    catch (e) { console.error('fetchHabitosStreaks:', e) }
  },
})
