import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { HeartHandshake, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { acceptPartnerInvite } from '../../lib/partnerWorkspace'
import { useTaskStore } from '../../store/useTaskStore'
import { resolvePostAuthPath } from '../../lib/postAuthRoute'

export function JoinPartnerView()
{
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const isLoggedIn = useTaskStore((s) => s.isLoggedIn)
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() =>
  {
    if (!code || !isLoggedIn) return

    let cancelled = false
    setStatus('loading')

    void acceptPartnerInvite(code).then(async (result) =>
    {
      if (cancelled) return
      if (result.ok)
      {
        setStatus('done')
        setMessage(result.message)
        toast.success(result.message)
        const path = await resolvePostAuthPath()
        window.setTimeout(() => navigate(path, { replace: true }), 1200)
      }
      else
      {
        setStatus('error')
        setMessage(result.message)
      }
    })

    return () =>
    {
      cancelled = true
    }
  }, [code, isLoggedIn, navigate])

  if (!isLoggedIn)
  {
    return (
      <div className="min-h-screen bg-fundo flex flex-col items-center justify-center px-6 text-center gap-4">
        <HeartHandshake className="w-10 h-10 text-finance" />
        <h1 className="text-lg font-display text-ink">Convite de parceiro</h1>
        <p className="text-sm text-ink-muted max-w-sm">
          Faça login ou crie sua conta para conectar as finanças com o código{' '}
          <span className="font-mono text-accent">{code}</span>.
        </p>
        <Link
          to={`/login?parceiro=${code}`}
          className="px-4 py-2.5 rounded-sl bg-accent text-white text-sm min-h-11 inline-flex items-center"
        >
          Entrar no Simply-Life
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-fundo flex flex-col items-center justify-center px-6 text-center gap-4">
      {status === 'loading' && (
        <>
          <Loader2 className="w-8 h-8 text-finance animate-spin" />
          <p className="text-sm text-ink-muted">Conectando parceiro…</p>
        </>
      )}
      {status === 'done' && (
        <>
          <HeartHandshake className="w-10 h-10 text-finance" />
          <p className="text-ink font-medium">{message}</p>
        </>
      )}
      {status === 'error' && (
        <>
          <p className="text-ink font-medium">{message}</p>
          <Link to="/financeiro?aba=orcamentos" className="text-sm text-accent underline">
            Ir para Orçamentos
          </Link>
        </>
      )}
      {status === 'idle' && (
        <Loader2 className="w-8 h-8 text-finance animate-spin" />
      )}
    </div>
  )
}
