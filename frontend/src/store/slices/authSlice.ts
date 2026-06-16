// slice de auth — login, logout, perfil via supabase auth
import type { StateCreator } from 'zustand'
import type { UserProfile } from '../storeTypes'
import { supabase } from '../../lib/supabase'
import { getSessionWithTimeout, isLocalGuestUser } from '../../lib/authSession'
import { DEFAULT_WORKSPACE_PREFS } from '../../lib/userWorkspacePrefs'
import type { UserPrefsSlice } from './userPrefsSlice'

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

export const createAuthSlice: StateCreator<AuthSlice & UserPrefsSlice, [], [], AuthSlice> = (set, get) => ({
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
      workspacePrefs: { ...DEFAULT_WORKSPACE_PREFS },
      workspacePrefsLoaded: false,
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
    if (isLocalGuestUser(get().userId))
    {
      return
    }

    const { session, timedOut } = await getSessionWithTimeout()
    if (timedOut || !session?.user)
    {
      return
    }

    try
    {
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome_completo')
        .eq('id', session.user.id)
        .maybeSingle()

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
    catch (e)
    {
      console.error('checkSession profile:', e)
      set({
        isLoggedIn: true,
        userId: session.user.id,
        userProfile: {
          nome: session.user.email?.split('@')[0] || '',
          email: session.user.email || '',
          avatar: '',
        },
      })
    }
  },
})
