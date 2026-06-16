import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'

interface ForgotPasswordModalProps
{
  initialEmail: string
  onClose: () => void
}

export function ForgotPasswordModal({ initialEmail, onClose }: ForgotPasswordModalProps)
{
  const [forgotEmail, setForgotEmail] = useState(initialEmail)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () =>
  {
    if (!forgotEmail.trim())
    {
      toast.error('Digite seu email')
      return
    }

    setLoading(true)
    try
    {
      const { error: err } = await supabase.auth.resetPasswordForEmail(
        forgotEmail.trim(),
        { redirectTo: `${window.location.origin}/reset-password` },
      )
      if (err) throw new Error(err.message)
      toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.', { duration: 6000 })
      onClose()
    }
    catch (err)
    {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar email'
      toast.error(msg)
    }
    finally
    {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-fundo/90 backdrop-blur-[2px]">
      <div className="sl-panel sl-login-glow p-8 w-full max-w-sm mx-4">
        <h2 className="text-lg font-display text-ink mb-1">Recuperar senha</h2>
        <p className="text-[13px] text-ink-muted mb-5">
          Digite seu email e enviaremos um link para redefinir sua senha.
        </p>
        <input
          type="email"
          value={forgotEmail}
          onChange={(e) => setForgotEmail(e.target.value)}
          placeholder="seu@email.com"
          className="w-full px-4 py-3 rounded-sl bg-chrome border border-line text-ink text-sm placeholder:text-ink-muted focus:border-accent focus:outline-none transition-colors"
          autoFocus
        />
        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-sl border border-line text-sm text-ink-muted hover:text-ink transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={loading || !forgotEmail.trim()}
            className="flex-1 py-2.5 rounded-sl bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar link'}
          </button>
        </div>
      </div>
    </div>
  )
}
