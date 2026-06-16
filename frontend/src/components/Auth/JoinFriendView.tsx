import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Loader2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { acceptFriendInvite } from '../../lib/friendsCircle'
import { useTaskStore } from '../../store/useTaskStore'
import { resolvePostAuthPath } from '../../lib/postAuthRoute'

export function JoinFriendView()
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

    void acceptFriendInvite(code).then(async (result) =>
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

    return () => { cancelled = true }
  }, [code, isLoggedIn, navigate])

  if (!isLoggedIn)
  {
    return (
      <div className="min-h-screen bg-fundo flex flex-col items-center justify-center px-6 text-center gap-4">
        <Users className="w-10 h-10 text-accent" />
        <h1 className="text-lg font-display text-ink">Convite ao Círculo</h1>
        <p className="text-sm text-ink-muted max-w-sm">
          Faça login ou crie sua conta para aceitar o convite{' '}
          <span className="font-mono text-accent">{code}</span>.
        </p>
        <Link
          to={`/login?join=${code}`}
          className="px-4 py-2.5 rounded-sl bg-accent text-white text-sm"
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
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <p className="text-sm text-ink-muted">Conectando ao Círculo…</p>
        </>
      )}
      {status === 'done' && (
        <>
          <Users className="w-10 h-10 text-accent" />
          <p className="text-ink font-medium">{message}</p>
        </>
      )}
      {status === 'error' && (
        <>
          <p className="text-ink font-medium">{message}</p>
          <Link to="/" className="text-sm text-accent underline">Ir ao início</Link>
        </>
      )}
      {status === 'idle' && (
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      )}
    </div>
  )
}
