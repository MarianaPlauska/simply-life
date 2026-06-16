// slice de gamificação — rpg, xp, conquistas, e quests do Jarvis
import type { StateCreator } from 'zustand'
import { supabase } from '../../lib/supabase'
import type { AxelStreakSlice } from './axelStreakSlice'

type GamificacaoStore = GamificacaoSlice & Pick<AxelStreakSlice, 'hydrateOfensivaFromServer'>

export interface UserStats
{
  id: string;
  level: number;
  xp_foco: number;
  xp_vitalidade: number;
  xp_estabilidade: number;
  streak_saude: number;
  streak_foco: number;
  ofensiva_streak?: number;
  ofensiva_last_active_date?: string | null;
  ofensiva_freezes?: number;
  ofensiva_freeze_claim_month?: string | null;
  ofensiva_saved_days?: Record<string, boolean>;
  ofensiva_focus_minutes?: Record<string, number>;
  ofensiva_task_today?: boolean;
  ofensiva_wellbeing_today?: boolean;
}

export interface Achievement
{
  id: number;
  user_id: string;
  achievement_key: string;
  titulo: string;
  descricao: string;
  unlocked_at: string;
}

export interface UserQuest
{
  id: number;
  user_id: string;
  tipo: 'diaria' | 'semanal';
  titulo: string;
  recompensa_xp: number;
  progresso: number;
  meta: number;
  concluida: boolean;
  created_at: string;
}

export interface GamificacaoSlice
{
  userStats: UserStats | null;
  achievements: Achievement[];
  userQuests: UserQuest[];

  fetchGamificacaoStats: () => Promise<void>;
  fetchAchievements: () => Promise<void>;
  fetchQuests: () => Promise<void>;
  addXP: (modulo: 'foco' | 'saude' | 'financeiro', quantidade: number) => Promise<void>;
  /** Debita XP total (prioriza módulo foco) — compras na loja AXEL */
  spendXp: (amount: number) => Promise<boolean>;
  /** Conclui tarefa e converte score de urgência em XP (1:1) */
  completeTask: (taskId: number, urgencyScore: number) => Promise<void>;
  checkAndUnlockAchievements: () => Promise<void>;
  generateQuestsForToday: () => Promise<void>;
  incrementQuestProgress: (tituloContendo: string, valor: number) => Promise<void>;
}

export const createGamificacaoSlice: StateCreator<GamificacaoStore, [], [], GamificacaoSlice> = (set, get) => ({
  userStats: null,
  achievements: [],
  userQuests: [],

  fetchGamificacaoStats: async () =>
  {
    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid) return

      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('id', uid)
        .maybeSingle()

      if (error) throw error

      if (data)
      {
        set({ userStats: data })
        get().hydrateOfensivaFromServer(data)
      }
      else
      {
        // Se nao existir, cria localmente
        const fallback: UserStats = {
          id: uid,
          level: 1,
          xp_foco: 0,
          xp_vitalidade: 0,
          xp_estabilidade: 0,
          streak_saude: 0,
          streak_foco: 0,
        }
        set({ userStats: fallback })
      }
    }
    catch (e) { console.error('fetchGamificacaoStats:', e) }
  },

  fetchAchievements: async () =>
  {
    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid) return

      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', uid)

      if (error) throw error
      set({ achievements: data || [] })
    }
    catch (e) { console.error('fetchAchievements:', e) }
  },

  fetchQuests: async () =>
  {
    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid) return

      const { data, error } = await supabase
        .from('user_quests')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })

      if (error) throw error

      set({ userQuests: data || [] })
      
      // gera quests se necessário
      await get().generateQuestsForToday()
    }
    catch (e) { console.error('fetchQuests:', e) }
  },

  addXP: async (modulo, quantidade) =>
  {
    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid) return

      let stats = get().userStats
      if (!stats)
      {
        await get().fetchGamificacaoStats()
        stats = get().userStats
      }

      if (!stats) return

      let xp_f = stats.xp_foco
      let xp_v = stats.xp_vitalidade
      let xp_e = stats.xp_estabilidade

      if (modulo === 'foco') xp_f += quantidade
      else if (modulo === 'saude') xp_v += quantidade
      else if (modulo === 'financeiro') xp_e += quantidade

      // 100 XP total por nível
      const total_xp = xp_f + xp_v + xp_e
      const newLevel = Math.floor(total_xp / 100) + 1
      const leveledUp = newLevel > stats.level

      const updatedStats = {
        ...stats,
        xp_foco: xp_f,
        xp_vitalidade: xp_v,
        xp_estabilidade: xp_e,
        level: newLevel,
      }

      set({ userStats: updatedStats })

      // Persiste no Supabase
      const { error } = await supabase
        .from('user_stats')
        .upsert({
          id: uid,
          level: newLevel,
          xp_foco: xp_f,
          xp_vitalidade: xp_v,
          xp_estabilidade: xp_e,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      if (leveledUp)
      {
        const { toast } = await import('sonner')
        toast.success(`LEVEL UP — você subiu para o Nível ${newLevel}`, {
          description: 'Seus atributos e reputação no Jarvis aumentaram.',
        })
      }

      // Verifica conquistas após ganhar XP
      await get().checkAndUnlockAchievements()
    }
    catch (e) { console.error('addXP:', e) }
  },

  spendXp: async (amount) =>
  {
    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid || amount <= 0) return false

      let stats = get().userStats
      if (!stats)
      {
        await get().fetchGamificacaoStats()
        stats = get().userStats
      }
      if (!stats) return false

      const total =
        stats.xp_foco + stats.xp_vitalidade + stats.xp_estabilidade
      if (total < amount) return false

      let xp_f = stats.xp_foco
      let xp_v = stats.xp_vitalidade
      let xp_e = stats.xp_estabilidade
      let remaining = amount

      const take = (current: number): number =>
      {
        const used = Math.min(current, remaining)
        remaining -= used
        return current - used
      }

      xp_f = take(xp_f)
      if (remaining > 0) xp_v = take(xp_v)
      if (remaining > 0) xp_e = take(xp_e)

      const total_xp = xp_f + xp_v + xp_e
      const newLevel = Math.max(1, Math.floor(total_xp / 100) + 1)

      const updatedStats = {
        ...stats,
        xp_foco: xp_f,
        xp_vitalidade: xp_v,
        xp_estabilidade: xp_e,
        level: newLevel,
      }

      set({ userStats: updatedStats })

      const { error } = await supabase
        .from('user_stats')
        .upsert({
          id: uid,
          level: newLevel,
          xp_foco: xp_f,
          xp_vitalidade: xp_v,
          xp_estabilidade: xp_e,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error
      return true
    }
    catch (e)
    {
      console.error('spendXp:', e)
      return false
    }
  },

  completeTask: async (taskId, urgencyScore) =>
  {
    const xpGain = Math.max(1, Math.round(urgencyScore))
    const store = get() as GamificacaoSlice & {
      tarefas?: { id: number; status: string }[]
      updateTarefa?: (id: number, dados: { status: string }) => Promise<void>
    }

    const existing = store.tarefas?.find((t) => t.id === taskId)
    if (existing?.status === 'concluida')
    {
      return
    }

    // Tarefas reais — updateTarefa dispara recompensa com score de urgência
    if (taskId > 0 && typeof store.updateTarefa === 'function')
    {
      await store.updateTarefa(taskId, { status: 'concluida' })
      return
    }

    // Mock / preview — XP direto no store
    await get().addXP('foco', xpGain)
    const { toast } = await import('sonner')
    toast.success(`+${xpGain} XP`, {
      description: 'Score de urgência convertido em progresso',
    })
  },

  generateQuestsForToday: async () =>
  {
    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid) return

      const quests = get().userQuests
      const hojeStr = new Date().toISOString().split('T')[0]

      // Filtra diárias de hoje
      const diariasHoje = quests.filter((q) => q.tipo === 'diaria' && q.created_at.startsWith(hojeStr))

      if (diariasHoje.length === 0)
      {
        const state = get() as GamificacaoSlice & {
          medicamentos?: { tomado: boolean }[]
          habitos?: { tipo: string; progresso_atual: number; meta_diaria: number }[]
          tarefas?: { status: string }[]
          transactions?: unknown[]
        }

        const medsPendentes = (state.medicamentos || []).filter((m) => !m.tomado).length
        const agua = (state.habitos || []).find((h) => h.tipo === 'agua')
        const proteina = (state.habitos || []).find((h) => h.tipo === 'proteina')
        const tarefasAbertas = (state.tarefas || []).filter((t) => t.status !== 'concluida').length

        const novasDiarias: {
          tipo: 'diaria' | 'semanal'
          titulo: string
          recompensa_xp: number
          progresso: number
          meta: number
          concluida: boolean
        }[] = []

        if (medsPendentes > 0)
        {
          novasDiarias.push({
            tipo: 'diaria',
            titulo: 'Tomar um medicamento pendente',
            recompensa_xp: 20,
            progresso: 0,
            meta: 1,
            concluida: false,
          })
        }

        if (tarefasAbertas > 0)
        {
          novasDiarias.push({
            tipo: 'diaria',
            titulo: 'Concluir 1 tarefa do Kanban',
            recompensa_xp: 15,
            progresso: 0,
            meta: 1,
            concluida: false,
          })
        }

        if ((state.transactions || []).length === 0)
        {
          novasDiarias.push({
            tipo: 'diaria',
            titulo: 'Registrar 1 movimentação financeira',
            recompensa_xp: 15,
            progresso: 0,
            meta: 1,
            concluida: false,
          })
        }

        if (agua && agua.progresso_atual < agua.meta_diaria)
        {
          novasDiarias.push({
            tipo: 'diaria',
            titulo: 'Bater a meta de água do dia',
            recompensa_xp: 15,
            progresso: 0,
            meta: 1,
            concluida: false,
          })
        }

        if (proteina && proteina.progresso_atual < proteina.meta_diaria)
        {
          novasDiarias.push({
            tipo: 'diaria',
            titulo: 'Bater a meta de proteína do dia',
            recompensa_xp: 15,
            progresso: 0,
            meta: 1,
            concluida: false,
          })
        }

        if (novasDiarias.length === 0)
        {
          novasDiarias.push({
            tipo: 'diaria',
            titulo: 'Manter o ritmo Jarvis — registre 1 hábito de saúde',
            recompensa_xp: 10,
            progresso: 0,
            meta: 1,
            concluida: false,
          })
        }

        // Adiciona semanal se não houver semanal criada nos últimos 7 dias
        const ultimaSemanal = quests.find((q) => q.tipo === 'semanal')
        const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        
        if (!ultimaSemanal || new Date(ultimaSemanal.created_at) < seteDiasAtras)
        {
          novasDiarias.push({
            tipo: 'semanal',
            titulo: 'Bater a meta da Regra 50/30/20',
            recompensa_xp: 100,
            progresso: 0,
            meta: 1,
            concluida: false,
          })
        }

        const inserts = novasDiarias.map((n) => ({
          user_id: uid,
          ...n,
        }))

        const { data, error } = await supabase
          .from('user_quests')
          .insert(inserts)
          .select()

        if (error) throw error

        if (data)
        {
          set((s) => ({ userQuests: [...data, ...s.userQuests] }))
        }
      }
    }
    catch (e) { console.error('generateQuestsForToday:', e) }
  },

  incrementQuestProgress: async (tituloContendo, valor) =>
  {
    try
    {
      const quests = get().userQuests
      const updatedQuests = [...quests]
      let changed = false

      for (let i = 0; i < updatedQuests.length; i++)
      {
        const q = updatedQuests[i]
        if (!q.concluida && q.titulo.toLowerCase().includes(tituloContendo.toLowerCase()))
        {
          const newProgresso = Math.min(q.meta, q.progresso + valor)
          if (newProgresso !== q.progresso)
          {
            q.progresso = newProgresso
            changed = true

            if (q.progresso >= q.meta)
            {
              q.concluida = true
              
              // Determina o módulo pelo título da quest
              let modulo: 'foco' | 'saude' | 'financeiro' = 'foco'
              const titleLower = q.titulo.toLowerCase()
              if (titleLower.includes('medicamento') || titleLower.includes('água') || titleLower.includes('agua') || titleLower.includes('proteína') || titleLower.includes('proteina') || titleLower.includes('saúde') || titleLower.includes('saude') || titleLower.includes('treino')) modulo = 'saude'
              else if (titleLower.includes('financeira') || titleLower.includes('50/30/20')) modulo = 'financeiro'

              await get().addXP(modulo, q.recompensa_xp)

              const { toast } = await import('sonner')
              toast.success(`Quest concluída: "${q.titulo}"`, {
                description: `+${q.recompensa_xp} XP em ${modulo.toUpperCase()}`,
              })
            }

            // Atualiza no Supabase
            const uid = (await supabase.auth.getUser()).data.user?.id
            if (uid)
            {
              await supabase
                .from('user_quests')
                .update({ progresso: q.progresso, concluida: q.concluida })
                .eq('id', q.id)
            }
          }
        }
      }

      if (changed)
      {
        set({ userQuests: updatedQuests })
      }
    }
    catch (e) { console.error('incrementQuestProgress:', e) }
  },

  checkAndUnlockAchievements: async () =>
  {
    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid) return

      const stats = get().userStats
      if (!stats) return

      const currentKeys = get().achievements.map((a) => a.achievement_key)

      const milestones = [
        {
          key: 'primeiro_nivel',
          titulo: 'Orquestrador Iniciante',
          descricao: 'Atingiu o Nível 2 de personagem geral.',
          check: () => stats.level >= 2,
        },
        {
          key: 'super_focado',
          titulo: 'Deep Work Master',
          descricao: 'Acumulou mais de 50 XP de Foco.',
          check: () => stats.xp_foco >= 50,
        },
        {
          key: 'saude_blindada',
          titulo: 'Saúde Blindada',
          descricao: 'Acumulou mais de 50 XP de Vitalidade.',
          check: () => stats.xp_vitalidade >= 50,
        },
        {
          key: 'mestre_gastos',
          titulo: 'Mestre de Gastos',
          descricao: 'Acumulou mais de 50 XP de Estabilidade.',
          check: () => stats.xp_estabilidade >= 50,
        },
      ]

      for (const m of milestones)
      {
        if (!currentKeys.includes(m.key) && m.check())
        {
          const { data, error } = await supabase
            .from('achievements')
            .insert({
              user_id: uid,
              achievement_key: m.key,
              titulo: m.titulo,
              descricao: m.descricao,
            })
            .select()
            .single()

          if (!error && data)
          {
            set((s) => ({ achievements: [...s.achievements, data] }))
            const { toast } = await import('sonner')
            toast.success(`Conquista desbloqueada: "${m.titulo}"`, {
              description: m.descricao,
            })
          }
        }
      }
    }
    catch (e) { console.error('checkAndUnlockAchievements:', e) }
  },
})
