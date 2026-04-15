// slice de saúde — medicamentos, hábitos, streaks
import type { StateCreator } from 'zustand';
import type { Medicamento, HabitoDiario } from '../storeTypes';
import type { HabitoStreak } from '../../types';
import { apiFetch } from '../api';

export interface SaudeSlice {
  medicamentos: Medicamento[];
  habitos: HabitoDiario[];
  habitosStreaks: HabitoStreak[];
  fetchMedicamentos: () => Promise<void>;
  addMedicamento: (med: { nome: string; horario: string }) => Promise<void>;
  toggleMedicamento: (id: number) => Promise<void>;
  fetchHabitos: () => Promise<void>;
  addHabito: (h: { tipo: string; nome_exibicao: string; meta_diaria: number; unidade: string }) => Promise<void>;
  incrementHabito: (id: number) => Promise<void>;
  decrementHabito: (id: number) => Promise<void>;
  deleteHabito: (id: number) => Promise<void>;
  fetchHabitosStreaks: () => Promise<void>;
}

export const createSaudeSlice: StateCreator<SaudeSlice, [], [], SaudeSlice> = (set) => ({
  medicamentos: [],
  habitos: [],
  habitosStreaks: [] as HabitoStreak[],

  fetchMedicamentos: async () =>
  {
    try
    {
      const res = await apiFetch('/medicamentos');
      if ( !res.ok ) throw new Error('falha');
      const data = await res.json();
      set({ medicamentos: data.medicamentos });
    }
    catch (e) { console.error('fetchMedicamentos:', e); }
  },

  addMedicamento: async (med) =>
  {
    try
    {
      const res = await apiFetch('/medicamentos', {
        method: 'POST',
        body: JSON.stringify({ nome: med.nome, horario: med.horario }),
      });
      if ( res.ok )
      {
        const data = await res.json();
        set((s) => ({ medicamentos: [...s.medicamentos, data.medicamento] }));
        return;
      }
    }
    catch { /* offline */ }
    set((s) => ({
      medicamentos: [...s.medicamentos, { id: Date.now(), nome: med.nome, horario: med.horario, tomado: false }],
    }));
  },

  toggleMedicamento: async (id) =>
  {
    set((s) => ({
      medicamentos: s.medicamentos.map((m) => m.id === id ? { ...m, tomado: !m.tomado } : m),
    }));
    try
    {
      await apiFetch(`/medicamentos/${id}/toggle`, { method: 'PATCH' });
    }
    catch
    {
      set((s) => ({
        medicamentos: s.medicamentos.map((m) => m.id === id ? { ...m, tomado: !m.tomado } : m),
      }));
    }
  },

  fetchHabitos: async () =>
  {
    try
    {
      const res = await apiFetch('/habitos');
      if ( !res.ok ) return;
      const data = await res.json();
      set({ habitos: data.habitos });
    }
    catch { /* offline */ }
  },

  addHabito: async (h) =>
  {
    try
    {
      const res = await apiFetch('/habitos', {
        method: 'POST',
        body: JSON.stringify(h),
      });
      if ( res.ok )
      {
        const data = await res.json();
        set((s) => ({ habitos: [...s.habitos, data.habito] }));
        return;
      }
    }
    catch { /* offline */ }
    set((s) => ({ habitos: [...s.habitos, { id: Date.now(), progresso_atual: 0, ...h }] }));
  },

  incrementHabito: async (id) =>
  {
    set((s) => ({
      habitos: s.habitos.map((h) =>
        h.id === id ? { ...h, progresso_atual: Math.min(h.progresso_atual + 1, h.meta_diaria) } : h
      ),
    }));
    try { await apiFetch(`/habitos/${id}/incrementar`, { method: 'PATCH' }); }
    catch { /* offline */ }
  },

  decrementHabito: async (id) =>
  {
    set((s) => ({
      habitos: s.habitos.map((h) =>
        h.id === id ? { ...h, progresso_atual: Math.max(h.progresso_atual - 1, 0) } : h
      ),
    }));
    try { await apiFetch(`/habitos/${id}/decrementar`, { method: 'PATCH' }); }
    catch { /* offline */ }
  },

  deleteHabito: async (id) =>
  {
    set((s) => ({ habitos: s.habitos.filter((h) => h.id !== id) }));
    try { await apiFetch(`/habitos/${id}`, { method: 'DELETE' }); }
    catch { /* offline */ }
  },

  fetchHabitosStreaks: async () =>
  {
    try
    {
      const res = await apiFetch('/habitos/streaks');
      if ( !res.ok ) return;
      const data = await res.json();
      set({ habitosStreaks: data });
    }
    catch (e) { console.error('fetchHabitosStreaks:', e); }
  },
});
