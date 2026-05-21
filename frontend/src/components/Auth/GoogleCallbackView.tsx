// callback do google oauth — placeholder até configurar provider no supabase
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

type CallbackStatus = 'processing' | 'success' | 'error'

export function GoogleCallbackView()
{
  const navigate = useNavigate()
  const [status] = useState<CallbackStatus>('error')

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950">
      <div className="text-center space-y-4">
        {status === 'processing' && (
          <>
            <Loader2 className="w-10 h-10 text-violet-400 animate-spin mx-auto" />
            <p className="text-zinc-300 text-sm">Conectando Google Calendar...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <p className="text-zinc-300 text-sm">Conectado! Redirecionando...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-10 h-10 text-red-400 mx-auto" />
            <p className="text-zinc-300 text-sm">Google OAuth será configurado em breve.</p>
            <button
              onClick={() => navigate('/')}
              className="mt-2 px-4 py-2 text-sm rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              Voltar ao Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  )
}
