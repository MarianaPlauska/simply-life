// store/slices/relatoriosSlice.ts - relatórios via supabase
import type { StateCreator } from 'zustand'
import { supabase } from '../../lib/supabase'

// ── Types ────────────────────────────────────────────────────

export interface TrendPoint
{
  label: string
  valor: number
}

export interface RankingItem
{
  nome: string
  valor: number
  posicao: number
  cor: string
}

export interface PeriodStats
{
  periodo_label: string
  inicio: string
  fim: string
  tarefas_criadas: number
  tarefas_concluidas: number
  tarefas_pendentes: number
  taxa_conclusao_pct: number
  sessoes_foco: number
  minutos_foco_total: number
  xp_ganho: number
  media_minutos_por_sessao: number
  habitos_completados: number
  habitos_total_registros: number
  habitos_taxa_pct: number
  humor_medio: number
  registros_humor: number
  despesas_total: number
  despesas_count: number
  streak_atual: number
  score_eficiencia: number
  tarefas_por_dia: Record<string, number>
  foco_por_dia: Record<string, number>
}

export interface AnalyticsReport
{
  periodo_atual: PeriodStats
  periodo_anterior: PeriodStats | null
  variacao_pct: Record<string, number>
  tendencia_tarefas: TrendPoint[]
  tendencia_foco: TrendPoint[]
  tendencia_score: TrendPoint[]
  ranking_dias_semana: RankingItem[]
  top_categorias_tarefa: RankingItem[]
  total_tarefas_concluidas: number
  total_minutos_foco: number
  total_xp: number
  membro_desde: string
}

export interface DashboardReportCard
{
  score_semana: number
  score_mes: number
  variacao_score_semana: number
  tarefas_concluidas_semana: number
  minutos_foco_semana: number
  xp_semana: number
  streak_atual: number
  tendencia_score: TrendPoint[]
  top_dia: RankingItem | null
}

// ── Slice ────────────────────────────────────────────────────

export interface RelatoriosSlice
{
  relatorioSemanal: AnalyticsReport | null
  relatorioMensal: AnalyticsReport | null
  relatorioResumo: DashboardReportCard | null
  relatoriosLoading: boolean
  relatoriosPeriodo: 'semanal' | 'mensal'

  fetchRelatorioSemanal: () => Promise<void>
  fetchRelatorioMensal: () => Promise<void>
  fetchRelatorioResumo: () => Promise<void>
  setRelatoriosPeriodo: (p: 'semanal' | 'mensal') => void
}

// helper: calcula stats básicos a partir das tarefas do período
async function fetchPeriodStats(inicio: string, fim: string): Promise<PeriodStats | null>
{
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  try
  {
    const { data: tarefas } = await supabase
      .from('tarefas_unificadas')
      .select('id, status, created_at')
      .gte('created_at', inicio)
      .lte('created_at', fim)
      .is('deletado_em', null)

    const { data: sessoes } = await supabase
      .from('sessoes_foco')
      .select('duracao_minutos')
      .gte('created_at', inicio)
      .lte('created_at', fim)

    const { data: despesas } = await supabase
      .from('despesas')
      .select('valor')
      .gte('data_gasto', inicio)
      .lte('data_gasto', fim)

    const tList = tarefas || []
    const sList = sessoes || []
    const dList = despesas || []
    const concluidas = tList.filter((t) => t.status === 'concluida').length
    const criadas = tList.length
    const minFoco = sList.reduce((s, x) => s + (x.duracao_minutos || 0), 0)
    const despTotal = dList.reduce((s, x) => s + (x.valor || 0), 0)

    return {
      periodo_label: `${inicio} - ${fim}`,
      inicio,
      fim,
      tarefas_criadas: criadas,
      tarefas_concluidas: concluidas,
      tarefas_pendentes: criadas - concluidas,
      taxa_conclusao_pct: criadas > 0 ? Math.round((concluidas / criadas) * 100) : 0,
      sessoes_foco: sList.length,
      minutos_foco_total: minFoco,
      xp_ganho: 0,
      media_minutos_por_sessao: sList.length > 0 ? Math.round(minFoco / sList.length) : 0,
      habitos_completados: 0,
      habitos_total_registros: 0,
      habitos_taxa_pct: 0,
      humor_medio: 0,
      registros_humor: 0,
      despesas_total: despTotal,
      despesas_count: dList.length,
      streak_atual: 0,
      score_eficiencia: criadas > 0 ? Math.round((concluidas / criadas) * 100) : 0,
      tarefas_por_dia: {},
      foco_por_dia: {},
    }
  }
  catch { return null }
}

export const createRelatoriosSlice: StateCreator<RelatoriosSlice, [], [], RelatoriosSlice> = (set) => ({
  relatorioSemanal: null,
  relatorioMensal: null,
  relatorioResumo: null,
  relatoriosLoading: false,
  relatoriosPeriodo: 'semanal',

  fetchRelatorioSemanal: async () =>
  {
    set({ relatoriosLoading: true })
    try
    {
      const hoje = new Date()
      const inicio = new Date(hoje.getTime() - 7 * 86400000).toISOString().split('T')[0]
      const fim = hoje.toISOString().split('T')[0]
      const stats = await fetchPeriodStats(inicio, fim)
      if (stats)
      {
        set({
          relatorioSemanal: {
            periodo_atual: stats,
            periodo_anterior: null,
            variacao_pct: {},
            tendencia_tarefas: [],
            tendencia_foco: [],
            tendencia_score: [],
            ranking_dias_semana: [],
            top_categorias_tarefa: [],
            total_tarefas_concluidas: stats.tarefas_concluidas,
            total_minutos_foco: stats.minutos_foco_total,
            total_xp: stats.xp_ganho,
            membro_desde: '',
          },
        })
      }
    }
    finally { set({ relatoriosLoading: false }) }
  },

  fetchRelatorioMensal: async () =>
  {
    set({ relatoriosLoading: true })
    try
    {
      const hoje = new Date()
      const inicio = new Date(hoje.getTime() - 30 * 86400000).toISOString().split('T')[0]
      const fim = hoje.toISOString().split('T')[0]
      const stats = await fetchPeriodStats(inicio, fim)
      if (stats)
      {
        set({
          relatorioMensal: {
            periodo_atual: stats,
            periodo_anterior: null,
            variacao_pct: {},
            tendencia_tarefas: [],
            tendencia_foco: [],
            tendencia_score: [],
            ranking_dias_semana: [],
            top_categorias_tarefa: [],
            total_tarefas_concluidas: stats.tarefas_concluidas,
            total_minutos_foco: stats.minutos_foco_total,
            total_xp: stats.xp_ganho,
            membro_desde: '',
          },
        })
      }
    }
    finally { set({ relatoriosLoading: false }) }
  },

  fetchRelatorioResumo: async () =>
  {
    try
    {
      const hoje = new Date()
      const inicio = new Date(hoje.getTime() - 7 * 86400000).toISOString().split('T')[0]
      const fim = hoje.toISOString().split('T')[0]
      const stats = await fetchPeriodStats(inicio, fim)
      if (stats)
      {
        set({
          relatorioResumo: {
            score_semana: stats.score_eficiencia,
            score_mes: 0,
            variacao_score_semana: 0,
            tarefas_concluidas_semana: stats.tarefas_concluidas,
            minutos_foco_semana: stats.minutos_foco_total,
            xp_semana: stats.xp_ganho,
            streak_atual: stats.streak_atual,
            tendencia_score: [],
            top_dia: null,
          },
        })
      }
    }
    catch { /* silent */ }
  },

  setRelatoriosPeriodo: (p) => set({ relatoriosPeriodo: p }),
})
