// tela de redefinição de senha — quando o user clica no link do email de recuperação
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Lock, Eye, EyeOff, Zap, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { AxelLoader } from '../ui/AxelLoader'

export function ResetPasswordView ()
{
  const navigate = useNavigate()
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const [checking, setChecking] = useState(true)

  // supabase injeta a sessão via hash fragment quando o user clica no link do email
  useEffect(() =>
  {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) =>
    {
      if (event === 'PASSWORD_RECOVERY')
      {
        setHasSession(true)
        setChecking(false)
      }
    })

    // fallback — checa se já tem sessão
    supabase.auth.getSession().then(({ data: { session } }) =>
    {
      if (session) setHasSession(true)
      setChecking(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) =>
  {
    e.preventDefault()
    if (!senha.trim() || senha.length < 6)
    {
      toast.error('A senha precisa ter no mínimo 6 caracteres')
      return
    }
    if (senha !== confirmar)
    {
      toast.error('As senhas não coincidem')
      return
    }

    setLoading(true)
    try
    {
      const { error } = await supabase.auth.updateUser({ password: senha })
      if (error) throw new Error(error.message)
      setSuccess(true)
      toast.success('Senha atualizada com sucesso!')
      setTimeout(() => navigate('/login', { replace: true }), 2500)
    }
    catch (err)
    {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar senha'
      toast.error(msg)
    }
    finally
    {
      setLoading(false)
    }
  }

  if (checking)
  {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <AxelLoader />
      </div>
    )
  }

  if (success)
  {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <div className="text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Senha atualizada!</h2>
          <p className="text-sm text-zinc-400">Redirecionando para o login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-screen bg-zinc-900 overflow-hidden flex items-center justify-center">
      {/* grid de fundo */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        aria-hidden="true"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/[0.06] backdrop-blur-sm mb-4 shadow-[0_0_40px_rgba(139,92,246,0.06)]">
            <Zap className="w-8 h-8 text-violet-400" aria-hidden="true" />
          </div>
          <h1 className="text-[26px] font-bold text-white tracking-tight">Redefinir Senha</h1>
          <p className="text-[13px] text-zinc-500 mt-1.5 tracking-wide">
            {hasSession ? 'Escolha uma nova senha para sua conta' : 'Link inválido ou expirado'}
          </p>
        </div>

        {hasSession ? (
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/[0.07] rounded-2xl p-8 shadow-2xl shadow-black/40">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* nova senha */}
              <div className="space-y-1.5">
                <label className="block text-[12px] font-medium text-zinc-400">Nova senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    autoFocus
                    className="w-full bg-zinc-800/50 border border-zinc-700/40 rounded-xl pl-10 pr-10 py-3
                               text-[13px] text-white placeholder:text-zinc-600
                               focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 focus:outline-none
                               transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* confirmar */}
              <div className="space-y-1.5">
                <label className="block text-[12px] font-medium text-zinc-400">Confirmar senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    placeholder="Repita a senha"
                    className="w-full bg-zinc-800/50 border border-zinc-700/40 rounded-xl pl-10 pr-4 py-3
                               text-[13px] text-white placeholder:text-zinc-600
                               focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 focus:outline-none
                               transition-all"
                  />
                </div>
              </div>

              {/* indicador de força */}
              {senha.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        senha.length >= 8 ? 'w-full bg-emerald-500' :
                        senha.length >= 6 ? 'w-2/3 bg-amber-500' :
                        'w-1/3 bg-red-500'
                      }`}
                    />
                  </div>
                  <span className={`text-[10px] ${
                    senha.length >= 8 ? 'text-emerald-400' :
                    senha.length >= 6 ? 'text-amber-400' :
                    'text-red-400'
                  }`}>
                    {senha.length >= 8 ? 'Forte' : senha.length >= 6 ? 'Ok' : 'Fraca'}
                  </span>
                </div>
              )}

              {/* match check */}
              {confirmar.length > 0 && senha !== confirmar && (
                <p className="text-[11px] text-red-400/80 inline-flex items-center gap-1">
                  <AlertCircle size={14} strokeWidth={1.5} className="shrink-0" />
                  As senhas não coincidem
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !senha.trim() || !confirmar.trim()}
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold
                           transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar nova senha'
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/[0.07] rounded-2xl p-8 shadow-2xl shadow-black/40 text-center space-y-4">
            <p className="text-[13px] text-zinc-400">
              Este link de recuperação não é válido ou já expirou.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
            >
              Voltar para o Login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
