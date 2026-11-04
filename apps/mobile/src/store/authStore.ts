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
import { apiFetch } from '../lib/apiBase'
import { unregisterExpoPushAsync } from '../lib/pushRegister'
import { stashAndClearUserLocal } from '../lib/userLocalData'

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
  verifyEmailCode: (email: string, code: string) => Promise<{ error?: string }>
  resendSignupEmail: (email: string) => Promise<{ error?: string }>
  resetPassword: (email: string) => Promise<{ error?: string }>
  verifyRecoveryInput: (email: string, rawInput: string) => Promise<{ error?: string }>
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

/** A conta de fundadora é admin mesmo se o banco ainda não marcou is_admin. */
export function isFounderEmail(email: string | null | undefined): boolean
{
  const normalized = email?.trim().toLowerCase()
  return Boolean(normalized && FOUNDER_ADMIN_EMAILS.has(normalized))
}

/** Traduz mensagens de erro do Supabase Auth (GoTrue) para PT-BR claro. */
export function translateAuthError(raw: string): string
{
  const msg = raw.trim()
  const lower = msg.toLowerCase()
  if (lower.includes('invalid login credentials') || lower.includes('invalid_credentials'))
  {
    return 'E-mail ou senha incorretos. Confira os dados ou clique em "Esqueceu a senha?".'
  }
  if (lower.includes('email not confirmed'))
  {
    return 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada e o spam.'
  }
  if (lower.includes('already registered') || lower.includes('already been registered'))
  {
    return 'Este e-mail já possui uma conta cadastrada. Tente entrar ou recuperar a senha.'
  }
  if (lower.includes('password should be at least'))
  {
    return 'A senha precisa ter no mínimo 8 caracteres.'
  }
  if (lower.includes('new password should be different'))
  {
    return 'A nova senha precisa ser diferente da senha atual.'
  }
  if (
    lower.includes('rate limit') ||
    lower.includes('only request this after') ||
    lower.includes('too many requests')
  )
  {
    return 'Muitas tentativas seguidas. Aguarde um minuto e tente novamente.'
  }
  if (
    lower.includes('expired') ||
    (lower.includes('invalid') && lower.includes('token')) ||
    lower.includes('otp_expired') ||
    lower.includes('flow_state_not_found') ||
    lower.includes('bad_code_verifier')
  )
  {
    return 'Link ou código inválido ou expirado. Solicite um novo e-mail de recuperação.'
  }
  if (lower.includes('auth session missing'))
  {
    return 'Sessão de recuperação expirada. Solicite um novo link.'
  }
  return msg
}

async function sessionEmail(): Promise<string | null>
{
  try
  {
    const { data } = await supabase.auth.getSession()
    return data.session?.user?.email?.toLowerCase() ?? null
  }
  catch
  {
    return null
  }
}

async function loadIsAdmin(userId: string): Promise<boolean>
{
  // A sessão já tem o e-mail. Não espera o banco nem um getUser que pode travar.
  const known = await sessionEmail()
  if (known && FOUNDER_ADMIN_EMAILS.has(known))
  {
    return true
  }

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

    const email = user.email ?? null
    const founder = isFounderEmail(email)
    set({
      isGuest: false,
      userId: user.id,
      sessionEmail: email,
      isAdmin: founder,
      mfaPendingFactorId: null,
      ready: true,
    })
    const admin = founder || await loadIsAdmin(user.id)
    if (get().userId === user.id) set({ isAdmin: admin })
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
    if (error) return { error: translateAuthError(error.message) }
    return get().applySession()
  },

  verifyMfa: async (code) =>
  {
    const factorId = get().mfaPendingFactorId
    if (!factorId) return { error: 'Nenhum desafio 2FA pendente' }
    const result = await verifyTotpCode(supabase as never, factorId, code)
    if (!result.ok) return { error: translateAuthError(result.message) }
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
    // por enquanto sem e-mail de confirmação: o servidor cria a conta já confirmada e entramos com a senha
    try
    {
      const res = await apiFetch('/api/axel/signup', { method: 'POST', body: { email: email.trim(), password, nome: nome?.trim() } })
      const json = await res.json().catch(() => ({})) as { ok?: boolean; error?: string; fallback?: boolean }
      if (res.ok && json.ok)
      {
        const login = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (login.error) return { error: translateAuthError(login.error.message) }
        return get().applySession()
      }
      // rota ainda não publicada ou servidor sem chave: segue o cadastro normal
      if (res.status !== 404 && !json.fallback) return { error: json.error || 'Não foi possível criar a conta.' }
    }
    catch
    {
      // sem rede para o servidor: tenta o cadastro normal
    }
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: nome?.trim() ? { full_name: nome.trim() } : undefined,
        emailRedirectTo: buildAuthCallbackUrl(appOrigin(), '/auth/callback'),
      },
    })
    if (error) return { error: translateAuthError(error.message) }
    if (data.session?.user)
    {
      return get().applySession()
    }
    return { needsConfirm: true }
  },

  verifyEmailCode: async (email, code) =>
  {
    if (!supabaseConfigured) return { error: 'Confirmação indisponível offline.' }
    const token = code.replace(/\D/g, '')
    if (token.length < 6) return { error: 'Digite os 6 números do e-mail.' }
    const signup = await supabase.auth.verifyOtp({
      email: email.trim(),
      token,
      type: 'signup',
    })
    if (signup.error)
    {
      const magic = await supabase.auth.verifyOtp({
        email: email.trim(),
        token,
        type: 'email',
      })
      if (magic.error) return { error: translateAuthError(magic.error.message) }
    }
    return get().applySession()
  },

  resendSignupEmail: async (email) =>
  {
    if (!supabaseConfigured) return { error: 'Reenvio indisponível offline.' }
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { emailRedirectTo: buildAuthCallbackUrl(appOrigin(), '/auth/callback') },
    })
    if (error) return { error: translateAuthError(error.message) }
    return {}
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
    if (error) return { error: translateAuthError(error.message) }
    return {}
  },

  verifyRecoveryInput: async (email, rawInput) =>
  {
    if (!supabaseConfigured) return { error: 'Recuperação indisponível no modo offline.' }
    const trimmed = rawInput.trim()
    if (!trimmed) return { error: 'Cole o link recebido no e-mail ou o código.' }

    // Aceita o link original do e-mail (/auth/v1/verify?token=...), a URL pós-redirect ou hash
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.includes('access_token=') ||
      trimmed.includes('token=') ||
      trimmed.includes('token_hash=') ||
      trimmed.includes('code=')
    )
    {
      const candidateUrl = trimmed.startsWith('http')
        ? trimmed
        : `https://placeholder.local/${trimmed.replace(/^[/?#]+/, '?')}`
      const params = parseAuthCallbackParams(candidateUrl)

      if (params.accessToken && params.refreshToken)
      {
        const { error } = await supabase.auth.setSession({
          access_token: params.accessToken,
          refresh_token: params.refreshToken,
        })
        if (error) return { error: translateAuthError(error.message) }
        return {}
      }

      if (params.tokenHash)
      {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: params.tokenHash,
          type: 'recovery',
        })
        if (error) return { error: translateAuthError(error.message) }
        return {}
      }

      if (params.code)
      {
        const { error } = await supabase.auth.exchangeCodeForSession(params.code)
        if (error) return { error: translateAuthError(error.message) }
        return {}
      }
    }

    // Código OTP de 6 dígitos
    if (/^\d{6,8}$/.test(trimmed) && email.trim())
    {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: trimmed,
        type: 'recovery',
      })
      if (!error) return {}
    }

    // Fallback: token_hash colado diretamente
    const { error } = await supabase.auth.verifyOtp({
      token_hash: trimmed,
      type: 'recovery',
    })
    if (error) return { error: translateAuthError(error.message) }
    return {}
  },

  updatePassword: async (password) =>
  {
    if (!supabaseConfigured) return { error: 'Indisponível offline' }
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return { error: translateAuthError(error.message) }
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
      if (error)
      {
        const { data: existing } = await supabase.auth.getSession()
        if (!existing.session) return { error: translateAuthError(error.message) }
      }
    }
    else if (params.tokenHash)
    {
      const otpType =
        params.type === 'recovery' ||
        params.type === 'signup' ||
        params.type === 'email' ||
        params.type === 'invite' ||
        params.type === 'magiclink'
          ? params.type
          : 'recovery'
      const { error } = await supabase.auth.verifyOtp({
        token_hash: params.tokenHash,
        type: otpType,
      })
      if (error)
      {
        const { data: existing } = await supabase.auth.getSession()
        if (!existing.session) return { error: translateAuthError(error.message) }
      }
    }
    else if (params.accessToken && params.refreshToken)
    {
      const { error } = await supabase.auth.setSession({
        access_token: params.accessToken,
        refresh_token: params.refreshToken,
      })
      if (error)
      {
        const { data: existing } = await supabase.auth.getSession()
        if (!existing.session) return { error: translateAuthError(error.message) }
      }
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
    const saindo = get().isGuest ? null : get().userId
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
    // conta logada: XP, elo e dias saem do aparelho (a próxima conta não herda).
    // Convidado mantém, para seguir com tudo ao criar conta.
    if (saindo) stashAndClearUserLocal(saindo)
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
    if (isFounderEmail(get().sessionEmail))
    {
      set({ isAdmin: true })
      return
    }
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
