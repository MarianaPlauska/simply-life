// store/slices/relatoriosSlice.ts — Estado para Relatórios & Analytics
import type { StateCreator } from 'zustand';
import { apiFetch } from '../api';

// ── Types ────────────────────────────────────────────────────

export interface TrendPoint {
  label: string;
  valor: number;
}

export interface RankingItem {
  nome: string;
  valor: number;
  posicao: number;
  cor: string;
}

export interface PeriodStats {
  periodo_label: string;
  inicio: string;
  fim: string;
  tarefas_criadas: number;
  tarefas_concluidas: number;
  tarefas_pendentes: number;
  taxa_conclusao_pct: number;
  sessoes_foco: number;
  minutos_foco_total: number;
  xp_ganho: number;
  media_minutos_por_sessao: number;
  habitos_completados: number;
  habitos_total_registros: number;
  habitos_taxa_pct: number;
  humor_medio: number;
  registros_humor: number;
  despesas_total: number;
  despesas_count: number;
  streak_atual: number;
  score_eficiencia: number;
  tarefas_por_dia: Record<string, number>;
  foco_por_dia: Record<string, number>;
}

export interface AnalyticsReport {
  periodo_atual: PeriodStats;
  periodo_anterior: PeriodStats | null;
  variacao_pct: Record<string, number>;
  tendencia_tarefas: TrendPoint[];
  tendencia_foco: TrendPoint[];
  tendencia_score: TrendPoint[];
  ranking_dias_semana: RankingItem[];
  top_categorias_tarefa: RankingItem[];
  total_tarefas_concluidas: number;
  total_minutos_foco: number;
  total_xp: number;
  membro_desde: string;
}

export interface DashboardReportCard {
  score_semana: number;
  score_mes: number;
  variacao_score_semana: number;
  tarefas_concluidas_semana: number;
  minutos_foco_semana: number;
  xp_semana: number;
  streak_atual: number;
  tendencia_score: TrendPoint[];
  top_dia: RankingItem | null;
}

// ── Slice ────────────────────────────────────────────────────

export interface RelatoriosSlice {
  // state
  relatorioSemanal: AnalyticsReport | null;
  relatorioMensal: AnalyticsReport | null;
  relatorioResumo: DashboardReportCard | null;
  relatoriosLoading: boolean;
  relatoriosPeriodo: 'semanal' | 'mensal';

  // actions
  fetchRelatorioSemanal: () => Promise<void>;
  fetchRelatorioMensal: () => Promise<void>;
  fetchRelatorioResumo: () => Promise<void>;
  setRelatoriosPeriodo: (p: 'semanal' | 'mensal') => void;
}

export const createRelatoriosSlice: StateCreator<RelatoriosSlice, [], [], RelatoriosSlice> = (set) => ({
  relatorioSemanal: null,
  relatorioMensal: null,
  relatorioResumo: null,
  relatoriosLoading: false,
  relatoriosPeriodo: 'semanal',

  fetchRelatorioSemanal: async () => {
    set({ relatoriosLoading: true });
    try {
      const res = await apiFetch('/relatorios/semanal');
      if (res.ok) {
        const data = await res.json();
        set({ relatorioSemanal: data });
      }
    } finally {
      set({ relatoriosLoading: false });
    }
  },

  fetchRelatorioMensal: async () => {
    set({ relatoriosLoading: true });
    try {
      const res = await apiFetch('/relatorios/mensal');
      if (res.ok) {
        const data = await res.json();
        set({ relatorioMensal: data });
      }
    } finally {
      set({ relatoriosLoading: false });
    }
  },

  fetchRelatorioResumo: async () => {
    try {
      const res = await apiFetch('/relatorios/resumo');
      if (res.ok) {
        const data = await res.json();
        set({ relatorioResumo: data });
      }
    } catch {
      // silent — card é opcional
    }
  },

  setRelatoriosPeriodo: (p) => set({ relatoriosPeriodo: p }),
});
