// slice de tarefas — crud, subtarefas e labels
// Sprint B: usa apiFetch com cookies httpOnly + refresh automático
import type { StateCreator } from 'zustand';
import type { TarefaUnificada, Label, Subtarefa } from '../../types';
import { apiFetch } from '../api';

export interface TarefasSlice {
  tarefas: TarefaUnificada[];
  isLoading: boolean;
  error: string | null;
  labels: Label[];
  // C6: arquivo
  arquivo: TarefaUnificada[];
  arquivoLoading: boolean;
  fetchTarefas: () => Promise<void>;
  createTarefa: (titulo: string, notas?: string) => Promise<void>;
  updateTarefa: (id: number, dados: { titulo?: string; status?: string; notas_locais?: string; prioridade?: string; versao?: number }) => Promise<void>;
  deleteTarefa: (id: number) => Promise<void>;
  moveTask: (taskId: number, newStatus: string) => void;
  simularIngestao: (titulo: string) => Promise<void>;
  // C4: duplicar
  duplicateTarefa: (id: number) => Promise<void>;
  // C6: arquivo
  fetchArquivo: () => Promise<void>;
  restaurarTarefa: (id: number) => Promise<void>;
  // C3: batch
  batchMove: (ids: number[], status: string) => Promise<void>;
  batchDelete: (ids: number[]) => Promise<void>;
  batchPriority: (ids: number[], prioridade: string) => Promise<void>;
  fetchLabels: () => Promise<void>;
  createLabel: (nome: string, cor?: string) => Promise<void>;
  deleteLabel: (id: number) => Promise<void>;
  createSubtarefa: (tarefaId: number, titulo: string) => Promise<void>;
  updateSubtarefa: (id: number, dados: Partial<Subtarefa>) => Promise<void>;
  deleteSubtarefa: (id: number, tarefaId: number) => Promise<void>;
  addLabelToTarefa: (tarefaId: number, labelId: number) => Promise<void>;
  removeLabelFromTarefa: (tarefaId: number, labelId: number) => Promise<void>;
  // C8: reorder subtarefas
  reorderSubtarefas: (tarefaId: number, orderedIds: number[]) => void;
  // C7: templates
  templates: { id: number; nome: string; prioridade: string; subtarefas: string[] }[];
  fetchTemplates: () => Promise<void>;
  createTemplate: (nome: string, prioridade: string, subtarefas: string[]) => Promise<void>;
  deleteTemplate: (id: number) => Promise<void>;
  applyTemplate: (templateId: number) => Promise<void>;
}

export const createTarefasSlice: StateCreator<TarefasSlice, [], [], TarefasSlice> = (set, get) => ({
  tarefas: [],
  isLoading: false,
  error: null,
  labels: [] as Label[],
  arquivo: [],
  arquivoLoading: false,
  templates: [],

  fetchTarefas: async () =>
  {
    set({ isLoading: true, error: null });
    try
    {
      const res = await apiFetch('/tarefas');
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
      const res = await apiFetch('/tarefas', {
        method: 'POST',
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
    // E2: envia versão atual para optimistic locking
    const tarefa = get().tarefas.find((t) => t.id === id);
    const body = { ...dados, versao: tarefa?.versao };
    try
    {
      const res = await apiFetch(`/tarefas/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      if ( res.status === 409 )
      {
        // conflito de versão — recarrega tarefas
        console.warn('updateTarefa: conflito de versão, recarregando...');
        await get().fetchTarefas();
        throw new Error('Tarefa foi alterada por outra sessão');
      }
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
      const res = await apiFetch(`/tarefas/${id}`, { method: 'DELETE' });
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
    apiFetch(`/tarefas/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    }).catch((e) => console.error('moveTask sync:', e));
  },

  simularIngestao: async (titulo) =>
  {
    try
    {
      const res = await apiFetch('/webhook/ingestao', {
        method: 'POST',
        body: JSON.stringify({ plataforma: 'gmail_mock', titulo, conteudo: titulo }),
      });
      if ( res.ok ) get().fetchTarefas();
    }
    catch (e) { console.error('simularIngestao:', e); }
  },

  // ── labels ──
  fetchLabels: async () =>
  {
    try
    {
      const res = await apiFetch('/labels');
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
      const res = await apiFetch('/labels', {
        method: 'POST',
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
      const res = await apiFetch(`/labels/${id}`, { method: 'DELETE' });
      if ( res.ok ) set((s) => ({ labels: s.labels.filter((l) => l.id !== id) }));
    }
    catch (e) { console.error('deleteLabel:', e); }
  },

  // ── subtarefas ──
  createSubtarefa: async (tarefaId, titulo) =>
  {
    try
    {
      const res = await apiFetch(`/tarefas/${tarefaId}/subtarefas`, {
        method: 'POST',
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
      const res = await apiFetch(`/subtarefas/${id}`, {
        method: 'PATCH',
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
      const res = await apiFetch(`/subtarefas/${id}`, { method: 'DELETE' });
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
      const res = await apiFetch(`/tarefas/${tarefaId}/labels/${labelId}`, { method: 'POST' });
      if ( res.ok ) get().fetchTarefas();
    }
    catch (e) { console.error('addLabelToTarefa:', e); }
  },

  removeLabelFromTarefa: async (tarefaId, labelId) =>
  {
    try
    {
      const res = await apiFetch(`/tarefas/${tarefaId}/labels/${labelId}`, { method: 'DELETE' });
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

  // ── C4: duplicar tarefa ──
  duplicateTarefa: async (id) =>
  {
    try
    {
      const res = await apiFetch(`/tarefas/${id}/duplicar`, { method: 'POST' });
      if ( !res.ok ) throw new Error('falha ao duplicar');
      const data = await res.json();
      set((s) => ({ tarefas: [data.tarefa, ...s.tarefas] }));
    }
    catch (e) { console.error('duplicateTarefa:', e); }
  },

  // ── C6: arquivo ──
  fetchArquivo: async () =>
  {
    set({ arquivoLoading: true });
    try
    {
      const res = await apiFetch('/tarefas/arquivo');
      if ( !res.ok ) throw new Error('falha ao buscar arquivo');
      const data = await res.json();
      set({ arquivo: data.tarefas, arquivoLoading: false });
    }
    catch (e)
    {
      console.error('fetchArquivo:', e);
      set({ arquivoLoading: false });
    }
  },

  restaurarTarefa: async (id) =>
  {
    try
    {
      const res = await apiFetch(`/tarefas/${id}/restaurar`, { method: 'PATCH' });
      if ( !res.ok ) throw new Error('falha ao restaurar');
      const data = await res.json();
      set((s) => ({
        arquivo: s.arquivo.filter((t) => t.id !== id),
        tarefas: [data.tarefa, ...s.tarefas],
      }));
    }
    catch (e) { console.error('restaurarTarefa:', e); }
  },

  // ── C3: batch actions ──
  batchMove: async (ids, status) =>
  {
    // optimistic update
    set((s) => ({
      tarefas: s.tarefas.map((t) =>
        ids.includes(t.id) ? { ...t, status: status as TarefaUnificada['status'] } : t
      ),
    }));
    await Promise.allSettled(
      ids.map((id) => apiFetch(`/tarefas/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }))
    );
  },

  batchDelete: async (ids) =>
  {
    set((s) => ({ tarefas: s.tarefas.filter((t) => !ids.includes(t.id)) }));
    await Promise.allSettled(
      ids.map((id) => apiFetch(`/tarefas/${id}`, { method: 'DELETE' }))
    );
  },

  batchPriority: async (ids, prioridade) =>
  {
    set((s) => ({
      tarefas: s.tarefas.map((t) =>
        ids.includes(t.id) ? { ...t, prioridade: prioridade as TarefaUnificada['prioridade'] } : t
      ),
    }));
    await Promise.allSettled(
      ids.map((id) => apiFetch(`/tarefas/${id}`, { method: 'PATCH', body: JSON.stringify({ prioridade }) }))
    );
  },

  // ── C8: reorder subtarefas (local only) ──
  reorderSubtarefas: (tarefaId, orderedIds) =>
  {
    set((s) => ({
      tarefas: s.tarefas.map((t) =>
      {
        if ( t.id !== tarefaId ) return t;
        const subs = [...(t.subtarefas || [])];
        const reordered = orderedIds.map((id, idx) =>
        {
          const sub = subs.find((s) => s.id === id);
          return sub ? { ...sub, ordem: idx } : null;
        }).filter(Boolean) as typeof subs;
        return { ...t, subtarefas: reordered };
      }),
    }));
    // sync all orders to backend
    orderedIds.forEach((id, idx) =>
    {
      apiFetch(`/subtarefas/${id}`, { method: 'PATCH', body: JSON.stringify({ ordem: idx }) }).catch(() => {});
    });
  },

  // ── C7: templates ──
  fetchTemplates: async () =>
  {
    try
    {
      const res = await apiFetch('/templates');
      if ( !res.ok ) throw new Error('falha ao buscar templates');
      const data = await res.json();
      set({ templates: data });
    }
    catch (e) { console.error('fetchTemplates:', e); }
  },

  createTemplate: async (nome, prioridade, subtarefas) =>
  {
    try
    {
      const res = await apiFetch('/templates', {
        method: 'POST',
        body: JSON.stringify({ nome, prioridade, subtarefas }),
      });
      if ( !res.ok ) throw new Error('falha ao criar template');
      const data = await res.json();
      set((s) => ({ templates: [...s.templates, data] }));
    }
    catch (e) { console.error('createTemplate:', e); }
  },

  deleteTemplate: async (id) =>
  {
    set((s) => ({ templates: s.templates.filter((t) => t.id !== id) }));
    await apiFetch(`/templates/${id}`, { method: 'DELETE' }).catch(() => {});
  },

  applyTemplate: async (templateId) =>
  {
    try
    {
      const res = await apiFetch(`/templates/${templateId}/aplicar`, { method: 'POST' });
      if ( !res.ok ) throw new Error('falha ao aplicar template');
      const data = await res.json();
      set((s) => ({ tarefas: [data.tarefa, ...s.tarefas] }));
    }
    catch (e) { console.error('applyTemplate:', e); }
  },
});
