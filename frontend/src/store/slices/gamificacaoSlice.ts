// slice de gamificação — rpg, xp, conquistas, e quests do Jarvis
import type { StateCreator } from 'zustand'
import { supabase } from '../../lib/supabase'

export interface UserStats
{
  id: string;
  level: number;
  xp_foco: number;
  xp_vitalidade: number;
  xp_estabilidade: number;
  streak_saude: number;
  streak_foco: number;
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
  checkAndUnlockAchievements: () => Promise<void>;
  generateQuestsForToday: () => Promise<void>;
  incrementQuestProgress: (tituloContendo: string, valor: number) => Promise<void>;
}

export const createGamificacaoSlice: StateCreator<GamificacaoSlice, [], [], GamificacaoSlice> = (set, get) => ({
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
        toast.success(`⚡ LEVEL UP! Você subiu para o Nível ${newLevel}! 🎉`, {
          description: 'Seus atributos e reputação no Jarvis aumentaram.',
        })
      }

      // Verifica conquistas após ganhar XP
      await get().checkAndUnlockAchievements()
    }
    catch (e) { console.error('addXP:', e) }
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
        const novasDiarias = [
          {
            tipo: 'diaria',
            titulo: 'Tomar um medicamento pendente',
            recompensa_xp: 20,
            progresso: 0,
            meta: 1,
            concluida: false,
          },
          {
            tipo: 'diaria',
            titulo: 'Concluir 1 tarefa do Kanban',
            recompensa_xp: 15,
            progresso: 0,
            meta: 1,
            concluida: false,
          },
          {
            tipo: 'diaria',
            titulo: 'Registrar 1 movimentação financeira',
            recompensa_xp: 15,
            progresso: 0,
            meta: 1,
            concluida: false,
          },
        ]

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
              if (titleLower.includes('medicamento')) modulo = 'saude'
              else if (titleLower.includes('financeira') || titleLower.includes('50/30/20')) modulo = 'financeiro'

              await get().addXP(modulo, q.recompensa_xp)

              const { toast } = await import('sonner')
              toast.success(`Quest Concluída: "${q.titulo}"! 🎉`, {
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
            toast.success(`🏆 Conquista Desbloqueada: "${m.titulo}"!`, {
              description: m.descricao,
            })
          }
        }
      }
    }
    catch (e) { console.error('checkAndUnlockAchievements:', e) }
  },
})
