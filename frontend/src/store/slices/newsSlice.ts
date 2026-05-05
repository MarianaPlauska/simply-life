// slice de notícias e interesses do usuário
import type { StateCreator } from 'zustand'
import { supabase } from '../../lib/supabase'

export interface NewsItem
{
  id: string
  titulo: string
  resumo: string | null
  url: string
  fonte: string | null
  topico: string
  relevancia: number
  lida: boolean
  created_at: string
}

export interface UserInterest
{
  id: string
  topico: string
  ativo: boolean
  created_at: string
}

export interface NewsSlice
{
  newsItems: NewsItem[]
  userInterests: UserInterest[]
  newsLoading: boolean
  fetchNews: () => Promise<void>
  fetchInterests: () => Promise<void>
  addInterest: (topico: string) => Promise<void>
  removeInterest: (id: string) => Promise<void>
  toggleInterest: (id: string) => Promise<void>
  markNewsRead: (id: string) => Promise<void>
}

export const createNewsSlice: StateCreator<NewsSlice, [], [], NewsSlice> = (set, get) => ({
  newsItems: [],
  userInterests: [],
  newsLoading: false,

  fetchNews: async () =>
  {
    set({ newsLoading: true })
    try
    {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { set({ newsLoading: false }); return }

      const { data, error } = await supabase
        .from('news_items')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      set({ newsItems: (data || []) as NewsItem[], newsLoading: false })
    }
    catch (e)
    {
      console.error('fetchNews:', e)
      set({ newsLoading: false })
    }
  },

  fetchInterests: async () =>
  {
    try
    {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from('user_interests')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      set({ userInterests: (data || []) as UserInterest[] })
    }
    catch (e) { console.error('fetchInterests:', e) }
  },

  addInterest: async (topico) =>
  {
    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid) return

      const { data, error } = await supabase
        .from('user_interests')
        .insert({ user_id: uid, topico, ativo: true })
        .select()
        .single()

      if (error) throw error
      if (data) set((s) => ({ userInterests: [...s.userInterests, data as UserInterest] }))
    }
    catch (e) { console.error('addInterest:', e) }
  },

  removeInterest: async (id) =>
  {
    try
    {
      await supabase.from('user_interests').delete().eq('id', id)
      set((s) => ({ userInterests: s.userInterests.filter((i) => i.id !== id) }))
    }
    catch (e) { console.error('removeInterest:', e) }
  },

  toggleInterest: async (id) =>
  {
    try
    {
      const interest = get().userInterests.find((i) => i.id === id)
      if (!interest) return
      await supabase.from('user_interests').update({ ativo: !interest.ativo }).eq('id', id)
      set((s) => ({
        userInterests: s.userInterests.map((i) =>
          i.id === id ? { ...i, ativo: !i.ativo } : i
        )
      }))
    }
    catch (e) { console.error('toggleInterest:', e) }
  },

  markNewsRead: async (id) =>
  {
    try
    {
      await supabase.from('news_items').update({ lida: true }).eq('id', id)
      set((s) => ({
        newsItems: s.newsItems.map((n) => n.id === id ? { ...n, lida: true } : n)
      }))
    }
    catch (e) { console.error('markNewsRead:', e) }
  },
})
