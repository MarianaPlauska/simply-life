import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'

type CallbackStatus = 'processing' | 'success' | 'error'

export function GoogleCallbackView()
{
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const processGoogleCallback = useTaskStore((s) => s.processGoogleCallback)
  const completeOnboardingStep = useTaskStore((s) => s.completeOnboardingStep)
  const [status, setStatus] = useState<CallbackStatus>('processing')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() =>
  {
    const code = params.get('code')
    const state = params.get('state')
    const oauthError = params.get('error')

    if (oauthError)
    {
      setStatus('error')
      setErrorMsg('Autorização cancelada ou negada pelo Google.')
      return
    }

    if (!code)
    {
      setStatus('error')
      setErrorMsg('Código de autorização ausente.')
      return
    }

    void processGoogleCallback(code, state)
      .then((ok) =>
      {
        if (!ok)
        {
          setStatus('error')
          setErrorMsg('Não foi possível salvar a conexão.')
          return
        }

        completeOnboardingStep('connect_email')
        setStatus('success')
        window.setTimeout(() => navigate('/configuracoes'), 1500)
      })
      .catch((err: unknown) =>
      {
        setStatus('error')
        setErrorMsg(err instanceof Error ? err.message : 'Erro ao conectar Google')
      })
  }, [params, processGoogleCallback, completeOnboardingStep, navigate])

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950">
      <div className="text-center space-y-4 max-w-sm px-6">
        {status === 'processing' && (
          <>
            <Loader2 className="w-10 h-10 text-violet-400 animate-spin mx-auto" />
            <p className="text-zinc-300 text-sm">Conectando Google (Calendar + Gmail)…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <p className="text-zinc-300 text-sm">Conectado! Redirecionando para Configurações…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-10 h-10 text-red-400 mx-auto" />
            <p className="text-zinc-300 text-sm">{errorMsg}</p>
            <button
              type="button"
              onClick={() => navigate('/configuracoes')}
              className="mt-2 px-4 py-2 text-sm rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              Voltar às Configurações
            </button>
          </>
        )}
      </div>
    </div>
  )
}
