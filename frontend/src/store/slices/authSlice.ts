// slice de auth — login, logout, perfil via supabase auth
import type { StateCreator } from 'zustand'
import type { UserProfile } from '../storeTypes'
import { supabase } from '../../lib/supabase'

export interface AuthSlice
{
  isLoggedIn: boolean
  userProfile: UserProfile
  userId: string
  login: (email: string, nome: string, id?: string) => void
  logout: () => void
  updateProfile: (profile: Partial<UserProfile>) => void
  checkSession: () => Promise<void>
}

export const createAuthSlice: StateCreator<AuthSlice, [], [], AuthSlice> = (set) => ({
  isLoggedIn: false,
  userProfile: { nome: '', email: '', avatar: '' },
  userId: '',

  // chamado após supabase.auth.signIn* para atualizar o store
  login: (email, nome, id) =>
  {
    set({
      isLoggedIn: true,
      userId: id || '',
      userProfile: { nome: nome || email.split('@')[0], email, avatar: '' },
    })
  },

  logout: async () =>
  {
    await supabase.auth.signOut()
    set({
      isLoggedIn: false,
      userId: '',
      userProfile: { nome: '', email: '', avatar: '' },
    })
  },

  updateProfile: (profile) =>
  {
    set((state) => ({
      userProfile: { ...state.userProfile, ...profile },
    }))
  },

  // verifica se já tem sessão ativa (cookie do supabase)
  checkSession: async () =>
  {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user)
    {
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome_completo')
        .eq('id', session.user.id)
        .single()

      set({
        isLoggedIn: true,
        userId: session.user.id,
        userProfile: {
          nome: profile?.nome_completo || session.user.email?.split('@')[0] || '',
          email: session.user.email || '',
          avatar: '',
        },
      })
    }
  },
})
