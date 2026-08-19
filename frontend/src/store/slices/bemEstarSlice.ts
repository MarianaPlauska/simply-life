// slice de bem-estar mental — humor, diário, weekly review via supabase
import type { StateCreator } from 'zustand'
import { supabase } from '../../lib/supabase'
import { aggregateHumorByDay, ultimoRegistro } from '../../lib/moodInsights'
import { buildMoodCorrelations, buildWeeklyReview } from '../../lib/wellbeingAnalytics'
import type { AxelStreakSlice } from './axelStreakSlice'
import type { GamificacaoSlice } from './gamificacaoSlice'
import type { SaudeSlice } from './saudeSlice'
import type { TarefasSlice } from './tarefasSlice'
import type { FinanceiroSlice } from './financeiroSlice'
import type { UserPrefsSlice } from './userPrefsSlice'
import { wellbeingHiddenUntilIso } from '../../lib/axelCareRotation'
import { pickMoodCareMessage, type MoodLevel } from '../../lib/axelCareMessages'
import { AXEL_MOOD_CARE_DURATION_MS, type AxelMoodCareSession } from '../../lib/axelMoodCare'
import { isNovoDiaDeSaude, localTodayIso, writeStoredHealthDay } from '../../lib/healthDayBoundary'
import type { HabitoDiario } from '../storeTypes'

// ── types ────────────────────────────────────────────────────
export interface HumorRegistro
{
  id: number
  data: string
  humor: number
  emoji: string | null
  nota: string | null
  energia?: number | null
  contexto?: string[] | null
  created_at?: string
}

export type DiarioContexto = 'geral' | 'gasto' | 'tarefa' | 'saude' | 'lembrete' | 'carta_ontem'

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

export interface RegistrarHumorOptions
{
  energia?: number
  contexto?: string[]
}

// ── interface do slice ──────────────────────────────────────
export interface BemEstarSlice
{
  humorHoje: HumorRegistro | null
  humorHojeLista: HumorRegistro[]
  humorSemana: HumorRegistro[]
  humorMes: HumorRegistro[]
  humorSemanaAgregado: ReturnType<typeof aggregateHumorByDay>
  humorMesAgregado: ReturnType<typeof aggregateHumorByDay>
  entradaHoje: EntradaDiario | null
  entradasRecentes: EntradaDiario[]
  weeklyReview: WeeklyReview | null
  correlacao: Correlacao | null
  promptDoDia: string
  /** Mensagem do AXEL após humor — visível no dashboard por ~1 min */
  axelMoodCare: AxelMoodCareSession | null
  clearAxelMoodCare: () => void

  registrarHumor: (humor: number, emoji: string, nota: string, opts?: RegistrarHumorOptions) => Promise<HumorRegistro | null>
  atualizarHumorEntry: (id: number, partial: Partial<Pick<HumorRegistro, 'energia' | 'contexto' | 'nota'>>) => Promise<void>
  fetchHumorHoje: () => Promise<void>
  fetchHumorSemana: () => Promise<void>
  fetchHumorMes: () => Promise<void>
  fetchHumorResumo: () => Promise<void>
  criarEntradaDiario: (conteudo: string, prompt: string, contexto?: DiarioContexto) => Promise<void>
  fetchDiarioHoje: () => Promise<void>
  fetchEntradasRecentes: (dias?: number) => Promise<void>
  deletarEntrada: (id: number) => Promise<void>
  fetchWeeklyReview: () => Promise<void>
  fetchCorrelacao: () => Promise<void>
  fetchPromptDoDia: () => Promise<void>
}

function hoje(): string
{
  return localTodayIso()
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

async function refreshHumorRanges(set: (partial: Partial<BemEstarSlice> | ((s: BemEstarSlice) => Partial<BemEstarSlice>)) => void): Promise<void>
{
  const seteDiasAtras = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  const trintaDias = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

  const [{ data: semana }, { data: mes }] = await Promise.all([
    supabase.from('diario_humor').select('*').gte('data', seteDiasAtras).order('created_at'),
    supabase.from('diario_humor').select('*').gte('data', trintaDias).order('created_at'),
  ])

  set({
    humorSemana: semana || [],
    humorMes: mes || [],
    humorSemanaAgregado: aggregateHumorByDay(semana || []),
    humorMesAgregado: aggregateHumorByDay(mes || []),
  })
}

type BemEstarStore = BemEstarSlice &
  Pick<UserPrefsSlice, 'patchWorkspacePrefs' | 'workspacePrefs'> &
  Pick<AxelStreakSlice, 'focusMinutesByDate' | 'recordWellbeingForStreak'> &
  Pick<GamificacaoSlice, 'addXP' | 'incrementQuestProgress'> &
  Pick<SaudeSlice, 'habitos'> &
  Pick<TarefasSlice, 'tarefas' | 'createTarefa'> &
  Pick<FinanceiroSlice, 'transactions'>

function last7Days(): string[]
{
  const days: string[] = []
  for (let i = 0; i < 7; i++)
  {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

function computeHabitosPctSemana(
  habitos: HabitoDiario[],
  historico: Array<{ habito_id: number; data: string; concluido: number }>,
): number
{
  const core = habitos.filter((h) => h.tipo === 'agua' || h.tipo === 'sono' || h.tipo === 'proteina')
  if (core.length === 0) return 0

  const days = last7Days()
  let total = 0
  let ok = 0

  for (const day of days)
  {
    for (const h of core)
    {
      total++
      const hit = historico.some(
        (r) => r.habito_id === h.id && r.data === day && r.concluido === 1,
      )
      if (hit) ok++
    }
  }

  return total > 0 ? Math.round((ok / total) * 100) : 0
}

function sumFocoSemana(
  focusMinutesByDate: Record<string, number>,
  sessoesFoco: Array<{ duracao_minutos: number; created_at: string }>,
): number
{
  const days = new Set(last7Days())
  let total = 0

  for (const [day, min] of Object.entries(focusMinutesByDate))
  {
    if (days.has(day)) total += min
  }

  for (const s of sessoesFoco)
  {
    const day = s.created_at.slice(0, 10)
    if (days.has(day)) total += s.duracao_minutos
  }

  return total
}

function mapHumorRow(row: Record<string, unknown>): HumorRegistro
{
  return {
    id: row.id as number,
    data: String(row.data ?? ''),
    humor: Number(row.humor ?? 0),
    emoji: row.emoji != null ? String(row.emoji) : null,
    nota: row.nota != null ? String(row.nota) : null,
    energia: row.energia != null ? Number(row.energia) : null,
    contexto: Array.isArray(row.contexto) ? row.contexto.map(String) : null,
    created_at: row.created_at != null ? String(row.created_at) : undefined,
  }
}

export const createBemEstarSlice: StateCreator<BemEstarStore, [], [], BemEstarSlice> = (set, get) => ({
  humorHoje: null,
  humorHojeLista: [],
  humorSemana: [],
  humorMes: [],
  humorSemanaAgregado: [],
  humorMesAgregado: [],
  entradaHoje: null,
  entradasRecentes: [],
  weeklyReview: null,
  correlacao: null,
  promptDoDia: 'Como você está se sentindo agora?',
  axelMoodCare: null,

  clearAxelMoodCare: () => set({ axelMoodCare: null }),

  registrarHumor: async (humor, emoji, nota, opts) =>
  {
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid)
    {
      const { toast } = await import('sonner')
      toast.error('Faça login para registrar seu humor')
      return null
    }

    const dia = hoje()
    const isFirstToday = get().humorHojeLista.length === 0
    const row: Record<string, unknown> = {
      user_id: uid,
      data: dia,
      humor,
      emoji,
      nota: nota || null,
    }
    if (opts?.energia) row.energia = opts.energia
    if (opts?.contexto?.length) row.contexto = opts.contexto

    const optimisticId = -Date.now()
    const optimistic: HumorRegistro = {
      id: optimisticId,
      data: dia,
      humor,
      emoji,
      nota: nota || null,
      created_at: new Date().toISOString(),
      energia: opts?.energia ?? null,
      contexto: opts?.contexto ?? null,
    }

    // Mensagem do AXEL — some sozinha em 25s
    const moodLevelOtimista = Math.min(5, Math.max(1, humor)) as MoodLevel
    set((s) =>
    {
      const lista = [...s.humorHojeLista, optimistic]
      return {
        humorHojeLista: lista,
        humorHoje: ultimoRegistro(lista),
        axelMoodCare: {
          mood: moodLevelOtimista,
          message: pickMoodCareMessage(moodLevelOtimista),
          until: Date.now() + AXEL_MOOD_CARE_DURATION_MS,
        },
      }
    })

    try
    {
      let saved: HumorRegistro | null = null

      const inserted = await supabase
        .from('diario_humor')
        .insert(row)
        .select()
        .single()

      if (inserted.error)
      {
        // Schema antigo: 1 registro/dia — atualiza em vez de falhar
        if (inserted.error.code === '23505')
        {
          const updated = await supabase
            .from('diario_humor')
            .update({ humor, emoji, nota: nota || null, energia: opts?.energia ?? null })
            .eq('user_id', uid)
            .eq('data', dia)
            .select()
            .single()
          if (updated.error) throw updated.error
          saved = mapHumorRow(updated.data as Record<string, unknown>)
        }
        else
        {
          throw inserted.error
        }
      }
      else
      {
        saved = mapHumorRow(inserted.data as Record<string, unknown>)
      }

      if (!saved) throw new Error('Resposta vazia ao salvar humor')

      set((s) =>
      {
        const lista = s.humorHojeLista
          .filter((r) => r.id !== optimisticId)
          .concat(saved as HumorRegistro)
        return { humorHojeLista: lista, humorHoje: ultimoRegistro(lista) }
      })

      await refreshHumorRanges(set)

      get().recordWellbeingForStreak()
      const anyGet = get() as BemEstarStore
      if (anyGet.addXP) await anyGet.addXP('saude', 8)
      if (anyGet.incrementQuestProgress) await anyGet.incrementQuestProgress('bem-estar', 1)

      // Primeiro humor do dia — oculta card no dashboard por 12h (persistido no Supabase)
      if (isFirstToday && anyGet.patchWorkspacePrefs)
      {
        await anyGet.patchWorkspacePrefs({
          wellbeing_dashboard_hidden_until: wellbeingHiddenUntilIso(),
        })
      }

      return saved
    }
    catch (e)
    {
      console.error('registrarHumor:', e)
      set((s) =>
      {
        const lista = s.humorHojeLista.filter((r) => r.id !== optimisticId)
        return { humorHojeLista: lista, humorHoje: ultimoRegistro(lista), axelMoodCare: null }
      })
      const { toast } = await import('sonner')
      const msg = e && typeof e === 'object' && 'message' in e
        ? String((e as { message: string }).message)
        : 'Erro ao salvar'
      toast.error('Não foi possível registrar o humor', { description: msg })
      return null
    }
  },

  atualizarHumorEntry: async (id, partial) =>
  {
    try
    {
      const { data, error } = await supabase
        .from('diario_humor')
        .update(partial)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error

      set((s) =>
      {
        const lista = s.humorHojeLista.map((r) => (r.id === id ? { ...r, ...data } : r))
        return { humorHojeLista: lista, humorHoje: ultimoRegistro(lista) }
      })
      await refreshHumorRanges(set)
    }
    catch (e) { console.error('atualizarHumorEntry:', e) }
  },

  fetchHumorHoje: async () =>
  {
    try
    {
      const { data } = await supabase
        .from('diario_humor')
        .select('*')
        .eq('data', hoje())
        .order('created_at')
      const lista = data || []
      set({ humorHojeLista: lista, humorHoje: ultimoRegistro(lista) })
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
        .order('created_at')
      const rows = data || []
      set({ humorSemana: rows, humorSemanaAgregado: aggregateHumorByDay(rows) })
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
        .order('created_at')
      const rows = data || []
      set({ humorMes: rows, humorMesAgregado: aggregateHumorByDay(rows) })
    }
    catch { /* offline */ }
  },

  fetchHumorResumo: async () =>
  {
    try
    {
      const dia = hoje()

      if (isNovoDiaDeSaude(dia))
      {
        const anyGet = get() as BemEstarStore
        if (anyGet.patchWorkspacePrefs && anyGet.workspacePrefs.wellbeing_dashboard_hidden_until)
        {
          await anyGet.patchWorkspacePrefs({ wellbeing_dashboard_hidden_until: null })
        }
        writeStoredHealthDay(dia)
      }

      const seteDiasAtras = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
      const trintaDias = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

      const [{ data: hojeRows }, { data: semana }, { data: mes }] = await Promise.all([
        supabase.from('diario_humor').select('*').eq('data', dia).order('created_at'),
        supabase.from('diario_humor').select('*').gte('data', seteDiasAtras).order('created_at'),
        supabase.from('diario_humor').select('*').gte('data', trintaDias).order('created_at'),
      ])

      const lista = hojeRows || []
      const semanaRows = semana || []
      const mesRows = mes || []

      set({
        humorHojeLista: lista,
        humorHoje: ultimoRegistro(lista),
        humorSemana: semanaRows,
        humorMes: mesRows,
        humorSemanaAgregado: aggregateHumorByDay(semanaRows),
        humorMesAgregado: aggregateHumorByDay(mesRows),
      })
    }
    catch { /* offline */ }
  },

  criarEntradaDiario: async (conteudo, prompt, contexto = 'geral') =>
  {
    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid) return
      const promptStored = contexto !== 'geral'
        ? `[ctx:${contexto}] ${prompt}`
        : prompt
      const { data, error } = await supabase
        .from('entradas_diario')
        .insert({ user_id: uid, data: hoje(), conteudo, prompt_usado: promptStored })
        .select()
        .single()
      if (error) throw error
      set({ entradaHoje: data })
      await get().fetchEntradasRecentes(60)

      void import('../../lib/noteDatesToKanban').then(async ({ syncNoteDatesToKanban }) =>
      {
        const fromDates = await syncNoteDatesToKanban(conteudo, prompt)
        if (contexto === 'lembrete' && fromDates === 0)
        {
          const taskTitle = conteudo.trim().split('\n')[0].slice(0, 120) || 'Lembrete'
          await get().createTarefa(taskTitle, conteudo.trim())
        }
      })
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
    try
    {
      const seteDiasAtras = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]

      const [{ data: humorSemana }, { data: historico }, { data: sessoesFoco }] = await Promise.all([
        supabase.from('diario_humor').select('*').gte('data', seteDiasAtras).order('created_at'),
        supabase.from('historico_habitos').select('habito_id, data, concluido').gte('data', seteDiasAtras),
        supabase.from('sessoes_foco').select('duracao_minutos, created_at').gte('created_at', `${seteDiasAtras}T00:00:00`),
      ])

      const humorRows = humorSemana || []
      const habitosPct = computeHabitosPctSemana(get().habitos, historico || [])
      const focoMinutos = sumFocoSemana(get().focusMinutesByDate, sessoesFoco || [])

      const despesasTotal = (get().transactions || [])
        .filter((t) =>
        {
          if (t.tipo !== 'despesa') return false
          return t.data >= seteDiasAtras
        })
        .reduce((s, t) => s + t.valor, 0)

      const correlacao = buildMoodCorrelations({
        humorMes: humorRows,
        humorPorDia: aggregateHumorByDay(humorRows),
        aguaPorDia: {},
        aguaMeta: get().habitos.find((h) => h.tipo === 'agua')?.meta_diaria ?? 10,
        treinoPorDia: {},
        focoMinutosPorDia: {},
      })

      const review = buildWeeklyReview({
        humorSemana: humorRows,
        tarefas: get().tarefas,
        habitosPct,
        despesasTotal,
        focoMinutos,
        correlacaoInsights: correlacao.insights,
      })

      set({ weeklyReview: review, humorSemana: humorRows, humorSemanaAgregado: aggregateHumorByDay(humorRows) })
    }
    catch (e) { console.error('fetchWeeklyReview:', e) }
  },

  fetchCorrelacao: async () =>
  {
    try
    {
      const trintaDias = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

      const [{ data: humorMes }, { data: historico }, { data: sessoesFoco }, { data: treinos }] = await Promise.all([
        supabase.from('diario_humor').select('*').gte('data', trintaDias).order('created_at'),
        supabase.from('historico_habitos').select('habito_id, data, concluido').gte('data', trintaDias),
        supabase.from('sessoes_foco').select('duracao_minutos, created_at').gte('created_at', `${trintaDias}T00:00:00`),
        supabase.from('sessoes_treino').select('iniciado_em, concluido').gte('iniciado_em', `${trintaDias}T00:00:00`),
      ])

      const humorRows = humorMes || []
      const habitos = get().habitos
      const aguaHabito = habitos.find((h) => h.tipo === 'agua')
      const sonoHabito = habitos.find((h) => h.tipo === 'sono')
      const aguaMeta = aguaHabito?.meta_diaria ?? 10

      const aguaPorDia: Record<string, number> = {}
      const sonoPorDia: Record<string, number> = {}
      const treinoPorDia: Record<string, number> = {}
      const focoMinutosPorDia: Record<string, number> = { ...get().focusMinutesByDate }

      for (const row of historico || [])
      {
        if (aguaHabito && row.habito_id === aguaHabito.id)
        {
          aguaPorDia[row.data] = row.concluido === 1 ? aguaMeta : (aguaPorDia[row.data] ?? 0)
        }
        if (sonoHabito && row.habito_id === sonoHabito.id && row.concluido === 1)
        {
          sonoPorDia[row.data] = sonoHabito.progresso_atual || 7
        }
      }

      for (const t of treinos || [])
      {
        if (!t.concluido) continue
        const day = String(t.iniciado_em).slice(0, 10)
        treinoPorDia[day] = (treinoPorDia[day] ?? 0) + 1
      }

      for (const s of sessoesFoco || [])
      {
        const day = s.created_at.slice(0, 10)
        focoMinutosPorDia[day] = (focoMinutosPorDia[day] ?? 0) + s.duracao_minutos
      }

      const result = buildMoodCorrelations({
        humorMes: humorRows,
        humorPorDia: aggregateHumorByDay(humorRows),
        aguaPorDia,
        aguaMeta,
        treinoPorDia,
        focoMinutosPorDia,
        sonoPorDia: Object.keys(sonoPorDia).length > 0 ? sonoPorDia : undefined,
      })

      set({
        correlacao: result,
        humorMes: humorRows,
        humorMesAgregado: aggregateHumorByDay(humorRows),
      })
    }
    catch (e) { console.error('fetchCorrelacao:', e) }
  },

  fetchPromptDoDia: async () =>
  {
    const idx = new Date().getDate() % PROMPTS.length
    set({ promptDoDia: PROMPTS[idx] })
  },
})
