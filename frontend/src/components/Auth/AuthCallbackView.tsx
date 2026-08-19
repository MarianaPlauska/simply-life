import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { applySessionToStore } from '../../lib/authProfile'
import { resolvePostAuthPath } from '../../lib/postAuthRoute'
import { useTaskStore } from '../../store/useTaskStore'

export function AuthCallbackView()
{
  const navigate = useNavigate()
  const login = useTaskStore((s) => s.login)
  const { t } = useTranslation()
  const [error, setError] = useState('')

  useEffect(() =>
  {
    let cancelled = false
    let finished = false

    const finish = async () =>
    {
      if (finished || cancelled) return

      const { data: { session }, error: sessionErr } = await supabase.auth.getSession()
      if (cancelled) return

      if (sessionErr || !session)
      {
        setError(sessionErr?.message || t('login.error_google'))
        return
      }

      const { getPendingTotpFactorId } = await import('../../lib/mfaAssurance')
      if (await getPendingTotpFactorId())
      {
        setError('Esta conta exige 2FA. Entre com e-mail e senha para informar o código.')
        await supabase.auth.signOut()
        return
      }

      finished = true
      const prevId = useTaskStore.getState().userId
      await applySessionToStore(session, login)
      if (prevId !== session.user.id)
      {
        useTaskStore.getState().resetWorkspacePrefsState()
      }
      await useTaskStore.getState().fetchWorkspacePrefs()
      toast.success(t('login.success_login'))
      const path = await resolvePostAuthPath()
      navigate(path, { replace: true })
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) =>
    {
      if (event === 'SIGNED_IN' && session)
      {
        void finish()
      }
    })

    // PKCE pode demorar um instante para trocar o code
    const timer = window.setTimeout(() => void finish(), 400)

    return () =>
    {
      cancelled = true
      window.clearTimeout(timer)
      subscription.unsubscribe()
    }
  }, [login, navigate, t])

  return (
    <div className="relative h-screen w-screen bg-fundo sl-ruled-bg flex items-center justify-center">
      <div className="sl-panel p-10 text-center max-w-sm mx-4">
        {!error ? (
          <>
            <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-4" />
            <p className="text-sm text-ink-muted">{t('login.oauth_processing')}</p>
          </>
        ) : (
          <>
            <XCircle className="w-8 h-8 text-urgente mx-auto mb-4" />
            <p className="text-sm text-ink-muted mb-5">{error}</p>
            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="text-sm text-accent hover:text-accent-hover transition-colors"
            >
              {t('login.back_to_login')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
