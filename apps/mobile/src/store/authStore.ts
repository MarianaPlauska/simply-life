import { create } from 'zustand'
import { Platform, Linking } from 'react-native'
import {
  buildAuthCallbackUrl,
  buildResetPasswordUrl,
  getPendingTotpFactorId,
  parseAuthCallbackParams,
  verifyTotpCode,
} from '@simply-life/shared'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { appOrigin } from '../lib/appOrigin'
import { unregisterExpoPushAsync } from '../lib/pushRegister'

type AuthState = {
  ready: boolean
  sessionEmail: string | null
  userId: string | null
  isGuest: boolean
  isAdmin: boolean
  mfaPendingFactorId: string | null
  setReady: (v: boolean) => void
  enterGuest: () => void
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error?: string; needsMfa?: boolean }>
  verifyMfa: (code: string) => Promise<{ error?: string }>
  signUp: (
    email: string,
    password: string,
    nome?: string,
  ) => Promise<{ error?: string; needsConfirm?: boolean }>
  resetPassword: (email: string) => Promise<{ error?: string }>
  updatePassword: (password: string) => Promise<{ error?: string }>
  signInWithGoogle: () => Promise<{ error?: string }>
  completeSessionFromUrl: (href: string) => Promise<{ error?: string; recovery?: boolean }>
  applySession: () => Promise<{ error?: string; needsMfa?: boolean }>
  signOut: () => Promise<void>
  hydrate: () => Promise<void>
  refreshAdminFlag: () => Promise<void>
}

const FOUNDER_ADMIN_EMAILS = new Set([
  'marianaplauska.c@gmail.com',
  'marianaplauska.cf@gmail.com',
])

async function loadIsAdmin(userId: string): Promise<boolean>
{
  try
  {
    const { data: rpcAdmin, error: rpcError } = await supabase.rpc('is_admin_user')
    if (!rpcError && rpcAdmin === true)
    {
      return true
    }
  }
  catch
  {
    /* RPC ainda não migrada */
  }

  try
  {
    const { data } = await supabase
      .from('user_public_cards')
      .select('is_admin')
      .eq('user_id', userId)
      .maybeSingle()
    if (data?.is_admin)
    {
      return true
    }
  }
  catch
  {
    /* cartão público indisponível */
  }

  try
  {
    const email = (await supabase.auth.getUser()).data.user?.email?.toLowerCase()
    if (email && FOUNDER_ADMIN_EMAILS.has(email))
    {
      return true
    }
  }
  catch
  {
    /* sessão ausente */
  }

  return false
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ready: false,
  sessionEmail: null,
  userId: null,
  isGuest: false,
  isAdmin: false,
  mfaPendingFactorId: null,

  setReady: (v) => set({ ready: v }),

  enterGuest: () =>
  {
    set({
      isGuest: true,
      userId: 'guest_mobile',
      sessionEmail: 'convidado@simply-life.app',
      isAdmin: false,
      mfaPendingFactorId: null,
      ready: true,
    })
  },

  applySession: async () =>
  {
    const { data } = await supabase.auth.getSession()
    const user = data.session?.user
    if (!user) return { error: 'Sessão ausente' }

    const factorId = await getPendingTotpFactorId(supabase as never)
    if (factorId)
    {
      set({
        mfaPendingFactorId: factorId,
        isGuest: false,
        userId: user.id,
        sessionEmail: user.email ?? null,
        isAdmin: false,
        ready: true,
      })
      return { needsMfa: true }
    }

    const admin = await loadIsAdmin(user.id)
    set({
      isGuest: false,
      userId: user.id,
      sessionEmail: user.email ?? null,
      isAdmin: admin,
      mfaPendingFactorId: null,
      ready: true,
    })
    return {}
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
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) return { error: error.message }
    return get().applySession()
  },

  verifyMfa: async (code) =>
  {
    const factorId = get().mfaPendingFactorId
    if (!factorId) return { error: 'Nenhum desafio 2FA pendente' }
    const result = await verifyTotpCode(supabase as never, factorId, code)
    if (!result.ok) return { error: result.message }
    const uid = get().userId
    const admin = uid ? await loadIsAdmin(uid) : false
    set({ mfaPendingFactorId: null, isAdmin: admin })
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
      return get().applySession()
    }
    return { needsConfirm: true }
  },

  resetPassword: async (email) =>
  {
    if (!supabaseConfigured)
    {
      return { error: 'Recuperação indisponível no modo offline.' }
    }
    const redirectTo = buildResetPasswordUrl(appOrigin())
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    })
    if (error) return { error: error.message }
    return {}
  },

  updatePassword: async (password) =>
  {
    if (!supabaseConfigured) return { error: 'Indisponível offline' }
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return { error: error.message }
    return {}
  },

  signInWithGoogle: async () =>
  {
    if (!supabaseConfigured) return { error: 'Google indisponível offline' }
    const redirectTo = buildAuthCallbackUrl(appOrigin(), '/auth/callback')
    // skipBrowserRedirect: controlamos a navegação e podemos explicar 400 de redirect
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    })
    if (error)
    {
      const hint =
        /redirect|allowlist|not allowed|invalid request/i.test(error.message)
          ? ` Cadastre esta URL em Authentication → URL Configuration → Redirect URLs: ${redirectTo}`
          : ''
      return { error: `${error.message}.${hint}` }
    }
    if (!data?.url)
    {
      return {
        error:
          `URL do Google indisponível. Confira se o provider Google está ativo e se ${redirectTo} está nas Redirect URLs do Supabase.`,
      }
    }

    // Preflight: authorize 400 = redirect fora da allowlist ou Google desligado
    try
    {
      const probe = await fetch(data.url, { method: 'GET', redirect: 'manual' })
      if (probe.status === 400 || probe.status === 401 || probe.status === 403)
      {
        return {
          error:
            `Google OAuth recusado (${probe.status}). No Supabase → Authentication → URL Configuration, adicione: ${redirectTo} (e o Site URL). Ative o provider Google.`,
        }
      }
    }
    catch
    {
      // CORS em alguns ambientes — segue para o redirect normal
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined')
    {
      window.location.assign(data.url)
    }
    else
    {
      await Linking.openURL(data.url)
    }
    return {}
  },

  completeSessionFromUrl: async (href) =>
  {
    if (!supabaseConfigured) return { error: 'Supabase não configurado' }
    const params = parseAuthCallbackParams(href)
    if (params.error)
    {
      return { error: 'Autorização cancelada ou recusada.' }
    }

    if (params.code)
    {
      const { error } = await supabase.auth.exchangeCodeForSession(params.code)
      if (error) return { error: error.message }
    }
    else if (params.accessToken && params.refreshToken)
    {
      const { error } = await supabase.auth.setSession({
        access_token: params.accessToken,
        refresh_token: params.refreshToken,
      })
      if (error) return { error: error.message }
    }
    else
    {
      const { data } = await supabase.auth.getSession()
      if (!data.session) return { error: 'Código de autorização ausente.' }
    }

    const applied = await get().applySession()
    if (applied.error) return applied
    return {
      ...applied,
      recovery: params.type === 'recovery',
    }
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
      isAdmin: false,
      mfaPendingFactorId: null,
      ready: true,
    })
  },

  refreshAdminFlag: async () =>
  {
    const uid = get().userId
    if (!uid || get().isGuest) return
    const admin = await loadIsAdmin(uid)
    set({ isAdmin: admin })
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
        await get().applySession()
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
