// slice de bem-estar mental — humor, diário, weekly review via supabase
import type { StateCreator } from 'zustand'
import { supabase } from '../../lib/supabase'

// ── types ────────────────────────────────────────────────────
export interface HumorRegistro
{
  id: number
  data: string
  humor: number
  emoji: string | null
  nota: string | null
}

export interface EntradaDiario
{
  id: number
  data: string
  conteudo: string
  prompt_usado: string | null
}

export interface WeeklyReview
{
  semana: string
  humor_medio: number
  registros_humor: number
  tarefas_concluidas: number
  tarefas_criadas: number
  habitos_pct: number
  despesas_total: number
  foco_minutos: number
  insight_ia: string
}

export interface Correlacao
{
  insights: string[]
  dados: Array<{ habito: string; humor_medio_com: number; humor_medio_geral: number; diff_pct: number; amostras: number }>
}

// ── interface do slice ──────────────────────────────────────
export interface BemEstarSlice
{
  humorHoje: HumorRegistro | null
  humorSemana: HumorRegistro[]
  humorMes: HumorRegistro[]
  entradaHoje: EntradaDiario | null
  entradasRecentes: EntradaDiario[]
  weeklyReview: WeeklyReview | null
  correlacao: Correlacao | null
  promptDoDia: string

  registrarHumor: (humor: number, emoji: string, nota: string) => Promise<void>
  fetchHumorHoje: () => Promise<void>
  fetchHumorSemana: () => Promise<void>
  fetchHumorMes: () => Promise<void>
  criarEntradaDiario: (conteudo: string, prompt: string) => Promise<void>
  fetchDiarioHoje: () => Promise<void>
  fetchEntradasRecentes: (dias?: number) => Promise<void>
  deletarEntrada: (id: number) => Promise<void>
  fetchWeeklyReview: () => Promise<void>
  fetchCorrelacao: () => Promise<void>
  fetchPromptDoDia: () => Promise<void>
}

// helper — data de hoje no formato YYYY-MM-DD
function hoje(): string
{
  return new Date().toISOString().split('T')[0]
}

const PROMPTS = [
  'Como você está se sentindo agora?',
  'O que te trouxe alegria hoje?',
  'Qual foi o maior desafio de hoje?',
  'O que você aprendeu hoje?',
  'Pelo que você é grato neste momento?',
  'O que te preocupa agora?',
  'Descreva seu dia em 3 palavras.',
]

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
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid) return
      const { data, error } = await supabase
        .from('diario_humor')
        .upsert({ user_id: uid, data: hoje(), humor, emoji, nota }, { onConflict: 'user_id,data' })
        .select()
        .single()
      if (error) throw error
      set({ humorHoje: data })
      // atualiza sparkline da semana
      const seteDiasAtras = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
      const { data: semana } = await supabase
        .from('diario_humor')
        .select('*')
        .gte('data', seteDiasAtras)
        .order('data')
      if (semana) set({ humorSemana: semana })
    }
    catch (e) { console.error('registrarHumor:', e) }
  },

  fetchHumorHoje: async () =>
  {
    try
    {
      const { data } = await supabase
        .from('diario_humor')
        .select('*')
        .eq('data', hoje())
        .maybeSingle()
      set({ humorHoje: data || null })
    }
    catch { /* offline */ }
  },

  fetchHumorSemana: async () =>
  {
    try
    {
      const seteDiasAtras = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
      const { data } = await supabase
        .from('diario_humor')
        .select('*')
        .gte('data', seteDiasAtras)
        .order('data')
      set({ humorSemana: data || [] })
    }
    catch { /* offline */ }
  },

  fetchHumorMes: async () =>
  {
    try
    {
      const trintaDias = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
      const { data } = await supabase
        .from('diario_humor')
        .select('*')
        .gte('data', trintaDias)
        .order('data')
      set({ humorMes: data || [] })
    }
    catch { /* offline */ }
  },

  criarEntradaDiario: async (conteudo, prompt) =>
  {
    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid) return
      const { data, error } = await supabase
        .from('entradas_diario')
        .insert({ user_id: uid, data: hoje(), conteudo, prompt_usado: prompt })
        .select()
        .single()
      if (error) throw error
      set({ entradaHoje: data })
    }
    catch (e) { console.error('criarEntradaDiario:', e) }
  },

  fetchDiarioHoje: async () =>
  {
    try
    {
      const { data } = await supabase
        .from('entradas_diario')
        .select('*')
        .eq('data', hoje())
        .maybeSingle()
      set({ entradaHoje: data || null })
    }
    catch { /* offline */ }
  },

  fetchEntradasRecentes: async (dias = 7) =>
  {
    try
    {
      const desde = new Date(Date.now() - dias * 86400000).toISOString().split('T')[0]
      const { data } = await supabase
        .from('entradas_diario')
        .select('*')
        .gte('data', desde)
        .order('data', { ascending: false })
      set({ entradasRecentes: data || [] })
    }
    catch { /* offline */ }
  },

  deletarEntrada: async (id) =>
  {
    set((s) => ({ entradasRecentes: s.entradasRecentes.filter((e) => e.id !== id) }))
    try { await supabase.from('entradas_diario').delete().eq('id', id) }
    catch { /* offline */ }
  },

  fetchWeeklyReview: async () =>
  {
    // weekly review — calculado no client por enquanto (sem edge function)
    try
    {
      set({ weeklyReview: null })
    }
    catch { /* offline */ }
  },

  fetchCorrelacao: async () =>
  {
    // correlação humor x hábitos — calculado no client por enquanto
    try
    {
      set({ correlacao: null })
    }
    catch { /* offline */ }
  },

  fetchPromptDoDia: async () =>
  {
    // rotaciona prompt baseado no dia
    const idx = new Date().getDate() % PROMPTS.length
    set({ promptDoDia: PROMPTS[idx] })
  },
})
