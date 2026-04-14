// slice de tarefas — crud, subtarefas e labels
import type { StateCreator } from 'zustand';
import type { TarefaUnificada, Label, Subtarefa } from '../../types';
import { API, authHeaders } from '../api';

export interface TarefasSlice {
  tarefas: TarefaUnificada[];
  isLoading: boolean;
  error: string | null;
  labels: Label[];
  fetchTarefas: () => Promise<void>;
  createTarefa: (titulo: string, notas?: string) => Promise<void>;
  updateTarefa: (id: number, dados: { titulo?: string; status?: string; notas_locais?: string }) => Promise<void>;
  deleteTarefa: (id: number) => Promise<void>;
  moveTask: (taskId: number, newStatus: string) => void;
  fetchLabels: () => Promise<void>;
  createLabel: (nome: string, cor?: string) => Promise<void>;
  deleteLabel: (id: number) => Promise<void>;
  createSubtarefa: (tarefaId: number, titulo: string) => Promise<void>;
  updateSubtarefa: (id: number, dados: Partial<Subtarefa>) => Promise<void>;
  deleteSubtarefa: (id: number, tarefaId: number) => Promise<void>;
  addLabelToTarefa: (tarefaId: number, labelId: number) => Promise<void>;
  removeLabelFromTarefa: (tarefaId: number, labelId: number) => Promise<void>;
}

export const createTarefasSlice: StateCreator<TarefasSlice, [], [], TarefasSlice> = (set, get) => ({
  tarefas: [],
  isLoading: false,
  error: null,
  labels: [] as Label[],

  fetchTarefas: async () =>
  {
    set({ isLoading: true, error: null });
    try
    {
      const res = await fetch(`${API}/tarefas`, { headers: authHeaders() });
      if ( !res.ok ) throw new Error('falha ao buscar tarefas');
      const data = await res.json();
      set({ tarefas: data.tarefas, isLoading: false });
    }
    catch (e)
    {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  createTarefa: async (titulo, notas) =>
  {
    try
    {
      const res = await fetch(`${API}/tarefas`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ titulo, notas_locais: notas || null }),
      });
      if ( !res.ok ) throw new Error('falha ao criar tarefa');
      const data = await res.json();
      set((s) => ({ tarefas: [data.tarefa, ...s.tarefas] }));
    }
    catch (e) { console.error('createTarefa:', e); }
  },

  updateTarefa: async (id, dados) =>
  {
    try
    {
      const res = await fetch(`${API}/tarefas/${id}`, {
        method: 'PATCH', headers: authHeaders(),
        body: JSON.stringify(dados),
      });
      if ( !res.ok ) throw new Error('falha ao atualizar tarefa');
      const data = await res.json();
      set((s) => ({
        tarefas: s.tarefas.map((t) => (t.id === id ? { ...t, ...data.tarefa } : t)),
      }));
    }
    catch (e) { console.error('updateTarefa:', e); }
  },

  deleteTarefa: async (id) =>
  {
    try
    {
      const res = await fetch(`${API}/tarefas/${id}`, { method: 'DELETE', headers: authHeaders() });
      if ( !res.ok ) throw new Error('falha ao deletar tarefa');
      set((s) => ({ tarefas: s.tarefas.filter((t) => t.id !== id) }));
    }
    catch (e) { console.error('deleteTarefa:', e); }
  },

  moveTask: (taskId, newStatus) =>
  {
    set((s) => ({
      tarefas: s.tarefas.map((t) =>
        t.id === taskId ? { ...t, status: newStatus as TarefaUnificada['status'] } : t
      ),
    }));
    fetch(`${API}/tarefas/${taskId}`, {
      method: 'PATCH', headers: authHeaders(),
      body: JSON.stringify({ status: newStatus }),
    }).catch((e) => console.error('moveTask sync:', e));
  },

  // ── labels ──
  fetchLabels: async () =>
  {
    try
    {
      const res = await fetch(`${API}/labels`, { headers: authHeaders() });
      if ( !res.ok ) return;
      const data = await res.json();
      set({ labels: data });
    }
    catch (e) { console.error('fetchLabels:', e); }
  },

  createLabel: async (nome, cor = '#8b5cf6') =>
  {
    try
    {
      const res = await fetch(`${API}/labels`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ nome, cor }),
      });
      if ( res.ok )
      {
        const nova = await res.json();
        set((s) => ({ labels: [...s.labels, nova] }));
      }
    }
    catch (e) { console.error('createLabel:', e); }
  },

  deleteLabel: async (id) =>
  {
    try
    {
      const res = await fetch(`${API}/labels/${id}`, { method: 'DELETE', headers: authHeaders() });
      if ( res.ok ) set((s) => ({ labels: s.labels.filter((l) => l.id !== id) }));
    }
    catch (e) { console.error('deleteLabel:', e); }
  },

  // ── subtarefas ──
  createSubtarefa: async (tarefaId, titulo) =>
  {
    try
    {
      const res = await fetch(`${API}/tarefas/${tarefaId}/subtarefas`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ titulo }),
      });
      if ( res.ok )
      {
        const nova = await res.json();
        set((s) => ({
          tarefas: s.tarefas.map((t) =>
            t.id === tarefaId ? { ...t, subtarefas: [...(t.subtarefas || []), nova] } : t
          ),
        }));
      }
    }
    catch (e) { console.error('createSubtarefa:', e); }
  },

  updateSubtarefa: async (id, dados) =>
  {
    try
    {
      const res = await fetch(`${API}/subtarefas/${id}`, {
        method: 'PATCH', headers: authHeaders(),
        body: JSON.stringify(dados),
      });
      if ( res.ok )
      {
        const updated = await res.json();
        set((s) => ({
          tarefas: s.tarefas.map((t) => ({
            ...t,
            subtarefas: (t.subtarefas || []).map((sub) =>
              sub.id === id ? { ...sub, ...updated } : sub
            ),
          })),
        }));
      }
    }
    catch (e) { console.error('updateSubtarefa:', e); }
  },

  deleteSubtarefa: async (id, tarefaId) =>
  {
    try
    {
      const res = await fetch(`${API}/subtarefas/${id}`, { method: 'DELETE', headers: authHeaders() });
      if ( res.ok )
      {
        set((s) => ({
          tarefas: s.tarefas.map((t) =>
            t.id === tarefaId
              ? { ...t, subtarefas: (t.subtarefas || []).filter((sub) => sub.id !== id) }
              : t
          ),
        }));
      }
    }
    catch (e) { console.error('deleteSubtarefa:', e); }
  },

  addLabelToTarefa: async (tarefaId, labelId) =>
  {
    try
    {
      const res = await fetch(`${API}/tarefas/${tarefaId}/labels/${labelId}`, {
        method: 'POST', headers: authHeaders(),
      });
      if ( res.ok ) get().fetchTarefas();
    }
    catch (e) { console.error('addLabelToTarefa:', e); }
  },

  removeLabelFromTarefa: async (tarefaId, labelId) =>
  {
    try
    {
      const res = await fetch(`${API}/tarefas/${tarefaId}/labels/${labelId}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      if ( res.ok )
      {
        set((s) => ({
          tarefas: s.tarefas.map((t) =>
            t.id === tarefaId
              ? { ...t, labels: (t.labels || []).filter((l) => l.id !== labelId) }
              : t
          ),
        }));
      }
    }
    catch (e) { console.error('removeLabelFromTarefa:', e); }
  },
});
