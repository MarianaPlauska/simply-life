// slice do dashboard — resumo, notificações, preferências, ingestão
import type { StateCreator } from 'zustand';
import type { DashboardResumo, Notificacao } from '../storeTypes';
import { apiFetch } from '../api';

export interface DashboardSlice {
  dashboardResumo: DashboardResumo | null;
  dashboardLoading: boolean;
  notificacoes: Notificacao[];
  fetchDashboard: () => Promise<void>;
  fetchNotificacoes: () => Promise<void>;
  markNotificacaoRead: (id: number) => Promise<void>;
  markAllNotificacoesRead: () => Promise<void>;
  fetchPreferencias: () => Promise<void>;
  saveKeywords: (palavras: string[]) => Promise<void>;
  simularIngestao: (titulo: string) => Promise<void>;
}

// esquema anti-flood — cada fetch tem um timestamp e não refaz dentro de 2s
const _lastFetch: Record<string, number> = {};
function shouldFetch(key: string, interval = 2000): boolean
{
  const now = Date.now();
  if ( now - (_lastFetch[key] || 0) < interval ) return false;
  _lastFetch[key] = now;
  return true;
}

export const createDashboardSlice: StateCreator<DashboardSlice, [], [], DashboardSlice> = (set, get) => ({
  dashboardResumo: null,
  dashboardLoading: false,
  notificacoes: [],

  fetchDashboard: async () =>
  {
    if ( !shouldFetch('dashboard') ) return;
    set({ dashboardLoading: true });
    try
    {
      const res = await apiFetch('/dashboard/resumo');
      if ( !res.ok ) throw new Error('falha');
      const data = await res.json();
      set({ dashboardResumo: data, dashboardLoading: false });
    }
    catch (e)
    {
      console.error('fetchDashboard:', e);
      set({ dashboardLoading: false });
    }
  },

  fetchNotificacoes: async () =>
  {
    if ( !shouldFetch('notificacoes') ) return;
    try
    {
      const res = await apiFetch('/notificacoes');
      if ( !res.ok ) throw new Error('falha');
      const data = await res.json();
      set({ notificacoes: data });
    }
    catch (e) { console.error('fetchNotificacoes:', e); }
  },

  markNotificacaoRead: async (id) =>
  {
    try
    {
      await apiFetch(`/notificacoes/${id}/lida`, { method: 'PATCH' });
      set({ notificacoes: get().notificacoes.map(n => n.id === id ? { ...n, lida: true } : n) });
    }
    catch (e) { console.error('markNotificacaoRead:', e); }
  },

  markAllNotificacoesRead: async () =>
  {
    try
    {
      await apiFetch('/notificacoes/marcar-todas-lidas', { method: 'PATCH' });
      set({ notificacoes: get().notificacoes.map(n => ({ ...n, lida: true })) });
    }
    catch (e) { console.error('markAllNotificacoesRead:', e); }
  },

  fetchPreferencias: async () =>
  {
    if ( !shouldFetch('preferencias') ) return;
    try
    {
      const res = await apiFetch('/preferencias');
      if ( !res.ok ) return;
      const data = await res.json();
      const kw = (data.palavras_chave_email || '').split(',').map((s: string) => s.trim()).filter(Boolean);
      // precisa do set do ui slice, mas aqui usamos cast pra acessar keywords
      (set as unknown as (fn: (s: Record<string, unknown>) => Record<string, unknown>) => void)(
        () => ({ keywords: kw })
      );
    }
    catch { /* backend offline */ }
  },

  saveKeywords: async (palavras) =>
  {
    try
    {
      (set as unknown as (fn: (s: Record<string, unknown>) => Record<string, unknown>) => void)(
        () => ({ keywords: palavras })
      );
      const res = await apiFetch('/preferencias', {
        method: 'PATCH',
        body: JSON.stringify({ palavras_chave_email: palavras.join(',') }),
      });
      if ( !res.ok ) throw new Error('falha');
      const { toast } = await import('sonner');
      toast.success('Keywords atualizadas!');
    }
    catch
    {
      const { toast } = await import('sonner');
      toast.error('Erro ao salvar keywords');
    }
  },

  simularIngestao: async (titulo) =>
  {
    try
    {
      const res = await apiFetch('/webhook/ingestao', {
        method: 'POST',
        body: JSON.stringify({ plataforma: 'gmail', titulo, conteudo: 'Conteúdo simulado para teste de triagem.' }),
      });
      if ( !res.ok ) throw new Error('falha na ingestão');
      const { toast } = await import('sonner');
      toast.success('E-mail simulado ingerido com sucesso!');
    }
    catch
    {
      const { toast } = await import('sonner');
      toast.error('Erro ao simular ingestão');
    }
  },
});
