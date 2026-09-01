import { create } from 'zustand'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { unregisterExpoPushAsync } from '../lib/pushRegister'

type AuthState = {
  ready: boolean
  sessionEmail: string | null
  userId: string | null
  isGuest: boolean
  setReady: (v: boolean) => void
  enterGuest: () => void
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, nome?: string) => Promise<{ error?: string; needsConfirm?: boolean }>
  resetPassword: (email: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  hydrate: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  ready: false,
  sessionEmail: null,
  userId: null,
  isGuest: false,

  setReady: (v) => set({ ready: v }),

  enterGuest: () =>
  {
    set({
      isGuest: true,
      userId: 'guest_mobile',
      sessionEmail: 'convidado@simply-life.app',
      ready: true,
    })
  },

  signIn: async (email, password) =>
  {
    if (!supabaseConfigured)
    {
      set({
        isGuest: true,
        userId: 'guest_offline',
        sessionEmail: email.trim() || 'offline@simply-life.app',
        ready: true,
      })
      return {}
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) return { error: error.message }
    set({
      isGuest: false,
      userId: data.user?.id ?? null,
      sessionEmail: data.user?.email ?? email,
      ready: true,
    })
    return {}
  },

  signUp: async (email, password, nome) =>
  {
    if (!supabaseConfigured)
    {
      set({
        isGuest: true,
        userId: 'guest_offline',
        sessionEmail: email.trim() || 'offline@simply-life.app',
        ready: true,
      })
      return {}
    }
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: nome?.trim() ? { full_name: nome.trim() } : undefined,
      },
    })
    if (error) return { error: error.message }
    if (data.session?.user)
    {
      set({
        isGuest: false,
        userId: data.session.user.id,
        sessionEmail: data.session.user.email ?? email,
        ready: true,
      })
      return {}
    }
    // Conta criada, mas email precisa de confirmação
    return { needsConfirm: true }
  },

  resetPassword: async (email) =>
  {
    if (!supabaseConfigured)
    {
      return { error: 'Recuperação indisponível no modo offline.' }
    }
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/reset-password`
        : undefined
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    })
    if (error) return { error: error.message }
    return {}
  },

  signOut: async () =>
  {
    if (supabaseConfigured)
    {
      try
      {
        await unregisterExpoPushAsync()
      }
      catch
      {
        /* push opcional */
      }
      await supabase.auth.signOut()
    }
    set({
      isGuest: false,
      userId: null,
      sessionEmail: null,
      ready: true,
    })
  },

  hydrate: async () =>
  {
    if (!supabaseConfigured)
    {
      set({ ready: true })
      return
    }
    try
    {
      const { data } = await supabase.auth.getSession()
      if (data.session?.user)
      {
        set({
          userId: data.session.user.id,
          sessionEmail: data.session.user.email ?? null,
          isGuest: false,
          ready: true,
        })
        return
      }
    }
    catch
    {
      /* offline */
    }
    set({ ready: true })
  },
}))
