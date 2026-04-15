// slice de bem-estar mental — humor, diário, weekly review, correlação
import type { StateCreator } from 'zustand';
import { apiFetch } from '../api';

// ── types ────────────────────────────────────────────────────
export interface HumorRegistro
{
  id: number;
  data: string;
  humor: number;
  emoji: string | null;
  nota: string | null;
}

export interface EntradaDiario
{
  id: number;
  data: string;
  conteudo: string;
  prompt_usado: string | null;
}

export interface WeeklyReview
{
  semana: string;
  humor_medio: number;
  registros_humor: number;
  tarefas_concluidas: number;
  tarefas_criadas: number;
  habitos_pct: number;
  despesas_total: number;
  foco_minutos: number;
  insight_ia: string;
}

export interface Correlacao
{
  insights: string[];
  dados: Array<{ habito: string; humor_medio_com: number; humor_medio_geral: number; diff_pct: number; amostras: number }>;
}

// ── interface do slice ──────────────────────────────────────
export interface BemEstarSlice
{
  // estado
  humorHoje: HumorRegistro | null;
  humorSemana: HumorRegistro[];
  humorMes: HumorRegistro[];
  entradaHoje: EntradaDiario | null;
  entradasRecentes: EntradaDiario[];
  weeklyReview: WeeklyReview | null;
  correlacao: Correlacao | null;
  promptDoDia: string;

  // actions
  registrarHumor: (humor: number, emoji: string, nota: string) => Promise<void>;
  fetchHumorHoje: () => Promise<void>;
  fetchHumorSemana: () => Promise<void>;
  fetchHumorMes: () => Promise<void>;
  criarEntradaDiario: (conteudo: string, prompt: string) => Promise<void>;
  fetchDiarioHoje: () => Promise<void>;
  fetchEntradasRecentes: (dias?: number) => Promise<void>;
  deletarEntrada: (id: number) => Promise<void>;
  fetchWeeklyReview: () => Promise<void>;
  fetchCorrelacao: () => Promise<void>;
  fetchPromptDoDia: () => Promise<void>;
}

export const createBemEstarSlice: StateCreator<BemEstarSlice, [], [], BemEstarSlice> = (set) => ({
  humorHoje: null,
  humorSemana: [],
  humorMes: [],
  entradaHoje: null,
  entradasRecentes: [],
  weeklyReview: null,
  correlacao: null,
  promptDoDia: 'Como você está se sentindo agora?',

  registrarHumor: async (humor, emoji, nota) =>
  {
    try
    {
      const res = await apiFetch('/bem-estar/humor', {
        method: 'POST',
        body: JSON.stringify({ humor, emoji, nota }),
      });
      if ( !res.ok ) throw new Error('falha');
      const data = await res.json();
      set({ humorHoje: data });
      // atualiza sparkline
      const sem = await apiFetch('/bem-estar/humor/semana');
      if ( sem.ok ) set({ humorSemana: await sem.json() });
    }
    catch (e) { console.error('registrarHumor:', e); }
  },

  fetchHumorHoje: async () =>
  {
    try
    {
      const res = await apiFetch('/bem-estar/humor/hoje');
      if ( !res.ok ) return;
      const data = await res.json();
      set({ humorHoje: data });
    }
    catch { /* offline */ }
  },

  fetchHumorSemana: async () =>
  {
    try
    {
      const res = await apiFetch('/bem-estar/humor/semana');
      if ( !res.ok ) return;
      set({ humorSemana: await res.json() });
    }
    catch { /* offline */ }
  },

  fetchHumorMes: async () =>
  {
    try
    {
      const res = await apiFetch('/bem-estar/humor/historico?dias=30');
      if ( !res.ok ) return;
      set({ humorMes: await res.json() });
    }
    catch { /* offline */ }
  },

  criarEntradaDiario: async (conteudo, prompt) =>
  {
    try
    {
      const res = await apiFetch('/bem-estar/diario', {
        method: 'POST',
        body: JSON.stringify({ conteudo, prompt_usado: prompt }),
      });
      if ( !res.ok ) throw new Error('falha');
      const data = await res.json();
      set({ entradaHoje: data });
    }
    catch (e) { console.error('criarEntradaDiario:', e); }
  },

  fetchDiarioHoje: async () =>
  {
    try
    {
      const res = await apiFetch('/bem-estar/diario/hoje');
      if ( !res.ok ) return;
      set({ entradaHoje: await res.json() });
    }
    catch { /* offline */ }
  },

  fetchEntradasRecentes: async (dias = 7) =>
  {
    try
    {
      const res = await apiFetch(`/bem-estar/diario?dias=${dias}`);
      if ( !res.ok ) return;
      set({ entradasRecentes: await res.json() });
    }
    catch { /* offline */ }
  },

  deletarEntrada: async (id) =>
  {
    set((s) => ({ entradasRecentes: s.entradasRecentes.filter((e) => e.id !== id) }));
    try { await apiFetch(`/bem-estar/diario/${id}`, { method: 'DELETE' }); }
    catch { /* offline */ }
  },

  fetchWeeklyReview: async () =>
  {
    try
    {
      const res = await apiFetch('/bem-estar/weekly-review');
      if ( !res.ok ) return;
      set({ weeklyReview: await res.json() });
    }
    catch { /* offline */ }
  },

  fetchCorrelacao: async () =>
  {
    try
    {
      const res = await apiFetch('/bem-estar/correlacao');
      if ( !res.ok ) return;
      set({ correlacao: await res.json() });
    }
    catch { /* offline */ }
  },

  fetchPromptDoDia: async () =>
  {
    try
    {
      const res = await apiFetch('/bem-estar/prompt-do-dia');
      if ( !res.ok ) return;
      const data = await res.json();
      set({ promptDoDia: data.prompt });
    }
    catch { /* offline */ }
  },
});
