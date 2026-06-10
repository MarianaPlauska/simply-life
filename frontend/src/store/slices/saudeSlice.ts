// slice de saúde — medicamentos, hábitos, treinos, streaks via supabase
import type { StateCreator } from 'zustand'
import type { Medicamento, HabitoDiario, HabitoDiarioConfig, SessaoTreino } from '../storeTypes'
import type { HabitoStreak } from '../../types'
import { supabase } from '../../lib/supabase'
import { isWorkoutComplete, minutesBetween } from '../../utils/workoutCompletion'

function mapHabito(row: Record<string, unknown>): HabitoDiario
{
  const cfg = row.config
  return {
    id: row.id as number,
    tipo: String(row.tipo ?? 'customizado'),
    nome_exibicao: String(row.nome_exibicao ?? ''),
    meta_diaria: Number(row.meta_diaria ?? 0),
    progresso_atual: Number(row.progresso_atual ?? 0),
    unidade: String(row.unidade ?? 'un'),
    config: (typeof cfg === 'object' && cfg !== null ? cfg : {}) as HabitoDiarioConfig,
  }
}

function mapSessao(row: Record<string, unknown>): SessaoTreino
{
  return {
    id: row.id as number,
    habito_id: row.habito_id != null ? Number(row.habito_id) : null,
    tipo_treino: String(row.tipo_treino ?? ''),
    meta_minutos: Number(row.meta_minutos ?? 30),
    iniciado_em: String(row.iniciado_em ?? ''),
    finalizado_em: row.finalizado_em ? String(row.finalizado_em) : null,
    duracao_real_min: row.duracao_real_min != null ? Number(row.duracao_real_min) : null,
    concluido: Boolean(row.concluido),
  }
}

export interface SaudeSlice
{
  medicamentos: Medicamento[]
  habitos: HabitoDiario[]
  habitosStreaks: HabitoStreak[]
  sessaoTreinoAtiva: SessaoTreino | null
  sessoesTreinoHoje: SessaoTreino[]
  fetchMedicamentos: () => Promise<void>
  addMedicamento: (med: { nome: string; horario: string }) => Promise<void>
  toggleMedicamento: (id: number) => Promise<void>
  fetchHabitos: () => Promise<void>
  addHabito: (h: {
    tipo: string
    nome_exibicao: string
    meta_diaria: number
    unidade: string
    config?: HabitoDiarioConfig
  }) => Promise<void>
  ensureHealthHabit: (preset: {
    tipo: string
    nome_exibicao: string
    meta_diaria: number
    unidade: string
    config?: HabitoDiarioConfig
  }) => Promise<HabitoDiario | null>
  updateHabitoMeta: (id: number, meta_diaria: number) => Promise<void>
  incrementHabito: (id: number) => Promise<void>
  incrementHabitoBy: (id: number, delta: number) => Promise<void>
  decrementHabito: (id: number) => Promise<void>
  deleteHabito: (id: number) => Promise<void>
  fetchHabitosStreaks: () => Promise<void>
  fetchSessaoTreinoAtiva: () => Promise<void>
  fetchSessoesTreinoHoje: () => Promise<void>
  addTreinoHabito: (tipoTreino: string, metaMinutos: number) => Promise<void>
  iniciarTreino: (habitoId: number, tipoTreino: string, metaMinutos: number) => Promise<void>
  finalizarTreino: (sessaoId: number) => Promise<void>
  runHealthCheck: () => Promise<void>
}

async function grantHabitoXp(get: () => SaudeSlice & Record<string, unknown>, tituloQuest?: string)
{
  const anyGet = get() as Record<string, unknown>
  if (anyGet.addXP) await (anyGet.addXP as (m: string, n: number) => Promise<void>)('saude', 10)
  if (tituloQuest && anyGet.incrementQuestProgress)
  {
    await (anyGet.incrementQuestProgress as (t: string, v: number) => Promise<void>)(tituloQuest, 1)
  }
}

export const createSaudeSlice: StateCreator<SaudeSlice, [], [], SaudeSlice> = (set, get) => ({
  medicamentos: [],
  habitos: [],
  habitosStreaks: [] as HabitoStreak[],
  sessaoTreinoAtiva: null,
  sessoesTreinoHoje: [],

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

      // Se marcou como tomado, remove tarefa fantasma e ganha XP
      const med = get().medicamentos.find((m) => m.id === id)
      if (med && med.tomado)
      {
        const uid = (await supabase.auth.getUser()).data.user?.id
        if (uid)
        {
          const { cleanupResolvedPhantoms } = await import('../../services/activeOrchestratorService')
          await cleanupResolvedPhantoms(uid, 'saude', id)

          // Gamificação
          const anyGet = get() as any
          if (anyGet.addXP)
          {
            const stats = anyGet.userStats
            let multiplier = 1
            let newStreak = (stats?.streak_saude || 0) + 1
            let isStreakBonus = false

            if (newStreak >= 3)
            {
              multiplier = 2
              isStreakBonus = true
              newStreak = 0 // reseta
            }

            const xpToGrant = 20 * multiplier
            await anyGet.addXP('saude', xpToGrant)

            if (isStreakBonus)
            {
              const { toast } = await import('sonner')
              toast.success('Combo Vitalidade Renovada (+40 XP)', {
                description: 'Você tomou seus medicamentos no horário por 3 dias seguidos!',
              })
            }

            // atualiza streak_saude no Supabase
            await supabase.from('user_stats').update({ streak_saude: newStreak }).eq('id', uid);
            (set as any)((s: any) => ({ userStats: s.userStats ? { ...s.userStats, streak_saude: newStreak } : null }))
          }

          // Progresso de Quests
          const incrementQuestProgress = anyGet.incrementQuestProgress
          if (incrementQuestProgress) await incrementQuestProgress('Tomar um medicamento', 1)
        }
      }
    }
    catch (e)
    {
      console.error('toggleMedicamento error:', e)
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
      set({ habitos: (data || []).map((row) => mapHabito(row as Record<string, unknown>)) })
    }
    catch { /* offline */ }
  },

  addHabito: async (h) =>
  {
    const uid = (await supabase.auth.getUser()).data.user?.id
    const payload = {
      ...h,
      config: h.config ?? {},
      progresso_atual: 0,
    }
    if (!uid)
    {
      set((s) => ({ habitos: [...s.habitos, { id: Date.now(), ...payload }] }))
      return
    }
    try
    {
      const { data, error } = await supabase
        .from('habitos_diarios')
        .insert({ user_id: uid, ...payload })
        .select()
        .single()
      if (error) throw error
      if (data) set((s) => ({ habitos: [...s.habitos, mapHabito(data as Record<string, unknown>)] }))
    }
    catch
    {
      set((s) => ({ habitos: [...s.habitos, { id: Date.now(), ...payload }] }))
    }
  },

  ensureHealthHabit: async (preset) =>
  {
    const existing = get().habitos.find((h) => h.tipo === preset.tipo)
    if (existing) return existing
    await get().addHabito(preset)
    await get().fetchHabitos()
    return get().habitos.find((h) => h.tipo === preset.tipo) ?? null
  },

  updateHabitoMeta: async (id, meta_diaria) =>
  {
    set((s) => ({
      habitos: s.habitos.map((h) => h.id === id ? { ...h, meta_diaria } : h),
    }))
    try
    {
      await supabase.from('habitos_diarios').update({ meta_diaria }).eq('id', id)
    }
    catch { /* offline */ }
  },

  incrementHabito: async (id) =>
  {
    const h = get().habitos.find((x) => x.id === id)
    const delta = h?.config?.incremento ?? 1
    await get().incrementHabitoBy(id, delta)
  },

  incrementHabitoBy: async (id, delta) =>
  {
    const before = get().habitos.find((h) => h.id === id)
    const wasDone = before ? before.progresso_atual >= before.meta_diaria : false

    set((s) => ({
      habitos: s.habitos.map((h) =>
        h.id === id
          ? { ...h, progresso_atual: Math.min(h.progresso_atual + delta, h.meta_diaria) }
          : h
      ),
    }))

    try
    {
      const { data: h } = await supabase
        .from('habitos_diarios')
        .select('progresso_atual, meta_diaria')
        .eq('id', id)
        .single()
      if (h)
      {
        const next = Math.min(h.progresso_atual + delta, h.meta_diaria)
        await supabase.from('habitos_diarios').update({ progresso_atual: next }).eq('id', id)

        const after = get().habitos.find((x) => x.id === id)
        if (after && !wasDone && after.progresso_atual >= after.meta_diaria)
        {
          const quest =
            after.tipo === 'agua' ? 'meta de água'
              : after.tipo === 'proteina' ? 'meta de proteína'
                : undefined
          await grantHabitoXp(get as () => SaudeSlice & Record<string, unknown>, quest)
        }
      }
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

  fetchSessaoTreinoAtiva: async () =>
  {
    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid)
      {
        set({ sessaoTreinoAtiva: null })
        return
      }

      const { data, error } = await supabase
        .from('sessoes_treino')
        .select('*')
        .eq('user_id', uid)
        .is('finalizado_em', null)
        .order('iniciado_em', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      set({ sessaoTreinoAtiva: data ? mapSessao(data as Record<string, unknown>) : null })
    }
    catch (e)
    {
      console.error('fetchSessaoTreinoAtiva:', e)
      set({ sessaoTreinoAtiva: null })
    }
  },

  fetchSessoesTreinoHoje: async () =>
  {
    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid)
      {
        set({ sessoesTreinoHoje: [] })
        return
      }

      const hoje = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('sessoes_treino')
        .select('*')
        .eq('user_id', uid)
        .gte('created_at', `${hoje}T00:00:00`)
        .lte('created_at', `${hoje}T23:59:59`)
        .order('iniciado_em', { ascending: false })

      if (error) throw error
      set({ sessoesTreinoHoje: (data || []).map((row) => mapSessao(row as Record<string, unknown>)) })
    }
    catch (e)
    {
      console.error('fetchSessoesTreinoHoje:', e)
    }
  },

  addTreinoHabito: async (tipoTreino, metaMinutos) =>
  {
    await get().addHabito({
      tipo: 'treino',
      nome_exibicao: tipoTreino.trim(),
      meta_diaria: 1,
      unidade: 'sessão',
      config: { meta_minutos: metaMinutos },
    })
  },

  iniciarTreino: async (habitoId, tipoTreino, metaMinutos) =>
  {
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid) return

    if (get().sessaoTreinoAtiva)
    {
      const { toast } = await import('sonner')
      toast.error('Já existe um treino em andamento.')
      return
    }

    try
    {
      const { data, error } = await supabase
        .from('sessoes_treino')
        .insert({
          user_id: uid,
          habito_id: habitoId,
          tipo_treino: tipoTreino,
          meta_minutos: metaMinutos,
        })
        .select()
        .single()

      if (error) throw error
      if (data)
      {
        const sessao = mapSessao(data as Record<string, unknown>)
        set({ sessaoTreinoAtiva: sessao })
        set((s) => ({ sessoesTreinoHoje: [sessao, ...s.sessoesTreinoHoje] }))
      }
    }
    catch (e)
    {
      console.error('iniciarTreino:', e)
      const { toast } = await import('sonner')
      toast.error('Não foi possível iniciar o treino. Rode a migration 009 no Supabase.')
    }
  },

  finalizarTreino: async (sessaoId) =>
  {
    const sessao = get().sessaoTreinoAtiva
    if (!sessao || sessao.id !== sessaoId) return

    const endIso = new Date().toISOString()
    const duracao = minutesBetween(sessao.iniciado_em, endIso)
    const completo = isWorkoutComplete(duracao, sessao.meta_minutos)

    try
    {
      const { error } = await supabase
        .from('sessoes_treino')
        .update({
          finalizado_em: endIso,
          duracao_real_min: duracao,
          concluido: completo,
        })
        .eq('id', sessaoId)

      if (error) throw error

      const updated: SessaoTreino = {
        ...sessao,
        finalizado_em: endIso,
        duracao_real_min: duracao,
        concluido: completo,
      }

      set({
        sessaoTreinoAtiva: null,
        sessoesTreinoHoje: get().sessoesTreinoHoje.map((s) =>
          s.id === sessaoId ? updated : s
        ),
      })

      const { toast } = await import('sonner')

      if (completo && sessao.habito_id)
      {
        const hab = get().habitos.find((h) => h.id === sessao.habito_id)
        if (hab && hab.progresso_atual < hab.meta_diaria)
        {
          await get().incrementHabito(hab.id)
        }
        await grantHabitoXp(get as () => SaudeSlice & Record<string, unknown>, 'treino')
        toast.success(`Treino completo! ${duracao} min (meta ${sessao.meta_minutos} min)`, {
          description: 'Jarvis registrou sua sessão como concluída.',
        })
      }
      else
      {
        toast.warning(`Treino encerrado: ${duracao} min`, {
          description: `Meta era ${sessao.meta_minutos} min (mín. 80% para contar como completo).`,
        })
      }

      await get().fetchSessoesTreinoHoje()
    }
    catch (e)
    {
      console.error('finalizarTreino:', e)
      const { toast } = await import('sonner')
      toast.error('Erro ao finalizar treino.')
    }
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
      const habitos = get().habitos;
      const streaks: HabitoStreak[] = Array.from(streakMap.entries()).map(([habito_id, streak_dias]) => {
        const habito = habitos.find(h => h.id === habito_id);
        return {
          habito_id,
          nome_exibicao: habito ? habito.nome_exibicao : `Hábito ${habito_id}`,
          streak_dias,
          ultima_data: null, // Pode ser aprimorado com a última data real do histórico
        };
      })
      set({ habitosStreaks: streaks })
    }
    catch (e) { console.error('fetchHabitosStreaks:', e) }
  },

  runHealthCheck: async () =>
  {
    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid) return

      const meds = get().medicamentos
      if (meds.length === 0) return

      const { checkMedicamentosPendentes } = await import('../../services/activeOrchestratorService')
      const created = await checkMedicamentosPendentes(uid, meds)

      if (created > 0)
      {
        const { toast } = await import('sonner')
        toast.info(`${created} medicamento${created > 1 ? 's' : ''} pendente${created > 1 ? 's' : ''} detectado${created > 1 ? 's' : ''}`, {
          description: 'Tarefas criadas automaticamente no seu Kanban.',
        })
      }
    }
    catch (e) { console.error('runHealthCheck:', e) }
  },
})
