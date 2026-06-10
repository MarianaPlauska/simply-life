import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { AlertCircle, Mail, Lock, Eye, EyeOff, UserPlus, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useTaskStore } from '../../store/useTaskStore';
import { AuthInput } from '../ui/AuthInput';
import { AuthButton } from '../ui/AuthButton';
import { TabToggle } from '../ui/TabToggle';
import { supabase } from '../../lib/supabase';

/* ── Google "G" SVG ─────────────────────────────────────────── */
function GoogleLogo({ className }: { className?: string })
{
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853" />
      <path d="M5.84 14.09A6.97 6.97 0 0 1 5.47 12c0-.72.13-1.43.37-2.09V7.07H2.18A11.96 11.96 0 0 0 .96 12c0 1.94.46 3.77 1.22 5.33l2.66-3.24Z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.99 14.97.96 12 .96 7.7.96 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335" />
    </svg>
  );
}



const AUTH_TABS_KEYS = [
  { value: 'login' as const, key: 'login.tab_login' },
  { value: 'register' as const, key: 'login.tab_register' },
];


export function LoginView() {
  const login = useTaskStore((s) => s.login);
  const isLoggedIn = useTaskStore((s) => s.isLoggedIn);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [senhaErro, setSenhaErro] = useState('');
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  /* Already authenticated â€” redirect to app */
  if (isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  /* ── submit ── */
  const handleSubmit = async (e: React.FormEvent) =>
  {
    e.preventDefault()
    if (!email.trim() || !senha.trim()) return
    if (mode === 'register' && !nome.trim()) return

    setLoading(true)
    setError('')

    try
    {
      if (mode === 'register')
      {
        // validação de senha
        if (senha.length < 6)
        {
          setSenhaErro('A senha precisa ter no mínimo 6 caracteres')
          setLoading(false)
          return
        }
        setSenhaErro('')

        // registro via supabase auth
        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password: senha,
          options: { data: { nome_completo: nome.trim() } },
        })
        if (err) throw new Error(err.message)

        // supabase retorna user mas sem session se email confirmation está ativo
        if (data.user && !data.session)
        {
          toast.info('Conta criada! Verifique seu email para confirmar.', { duration: 6000 })
          setMode('login')
          setError('')
          setLoading(false)
          return
        }

        if (data.user && data.session)
        {
          login(data.user.email || '', nome.trim(), data.user.id)
          toast.success(t('login.success_register'))
          navigate('/', { replace: true })
        }
      }
      else
      {
        // login via supabase auth
        const { data, error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: senha,
        })
        if (err) throw new Error(err.message)
        if (data.user)
        {
          // busca nome do perfil
          const { data: profile } = await supabase
            .from('profiles')
            .select('nome_completo')
            .eq('id', data.user.id)
            .single()

          login(
            data.user.email || '',
            profile?.nome_completo || data.user.email?.split('@')[0] || '',
            data.user.id,
          )
          toast.success(t('login.success_login'))
          navigate('/', { replace: true })
        }
      }
    }
    catch (err)
    {
      let msg = err instanceof Error ? err.message : t('login.error_connection')
      // traduz mensagens do supabase
      if (msg.includes('Invalid login credentials')) msg = 'Email ou senha incorretos'
      if (msg.includes('Email not confirmed')) msg = 'Confirme seu email antes de fazer login'
      if (msg.includes('already registered')) msg = 'Este email já possui uma conta'
      if (msg.includes('Password should be')) msg = 'A senha precisa ter no mínimo 6 caracteres'
      setError(msg)
      toast.error(msg)
    }
    finally
    {
      setLoading(false)
    }
  }

  // google oauth — desabilitado por enquanto
  const handleGoogle = async () =>
  {
    toast.info('Google login será configurado em breve')
  }

  // recuperação de senha via supabase
  const handleForgotPassword = async () =>
  {
    if (!forgotEmail.trim())
    {
      toast.error('Digite seu email')
      return
    }
    setForgotLoading(true)
    try
    {
      const { error: err } = await supabase.auth.resetPasswordForEmail(
        forgotEmail.trim(),
        { redirectTo: `${window.location.origin}/reset-password` }
      )
      if (err) throw new Error(err.message)
      toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.', { duration: 6000 })
      setForgotMode(false)
      setForgotEmail('')
    }
    catch (err)
    {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar email'
      toast.error(msg)
    }
    finally { setForgotLoading(false) }
  }

  // login como convidado — tenta sessão anônima, senão cria local
  const handleGuest = async () =>
  {
    try
    {
      const { data, error: err } = await supabase.auth.signInAnonymously()
      if (err) throw new Error(err.message)
      if (data.user)
      {
        login('convidado@simplylife.app', 'Convidado', data.user.id)
        toast.success(t('login.success_guest'))
        navigate('/', { replace: true })
        return
      }
    }
    catch
    {
      // fallback: sessão local sem supabase auth (modo exploração)
      const guestId = `guest_${Date.now()}`
      login('convidado@simplylife.app', 'Convidado', guestId)
      toast.success('Entrando como convidado — seus dados ficam apenas neste dispositivo')
      navigate('/', { replace: true })
    }
  }

  const isSubmitDisabled = !email.trim() || !senha.trim() || (mode === 'register' && !nome.trim());

  return (
    <div className="relative h-screen w-screen bg-fundo sl-ruled-bg overflow-hidden flex items-center justify-center">
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="mb-10 text-center">
          <p className="sl-eyebrow mb-4">Simply-Life OS</p>
          <h1 className="text-[28px] font-display text-ink leading-tight">{t('login.title')}</h1>
          <p className="text-[13px] text-ink-muted mt-2 max-w-xs mx-auto">{t('login.subtitle')}</p>
        </div>

        <div className="sl-panel p-8">
          <TabToggle
            tabs={AUTH_TABS_KEYS.map((tab) => ({ value: tab.value, label: t(tab.key) }))}
            active={mode}
            onChange={(v) => { setMode(v); setError(''); }}
          />

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <AuthInput
                id="auth-nome"
                label={t('login.name_label')}
                type="text"
                autoFocus
                required
                autoComplete="name"
                placeholder={t('login.name_placeholder')}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                icon={<UserPlus className="w-4 h-4" />}
              />
            )}

            <AuthInput
              id="auth-email"
              label={t('login.email_label')}
              type="email"
              autoFocus={mode === 'login'}
              required
              autoComplete="email"
              placeholder={t('login.email_placeholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
            />

            <AuthInput
              id="auth-senha"
              label={t('login.password_label')}
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder={mode === 'login' ? t('login.password_placeholder_login') : t('login.password_placeholder_register')}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-ink-muted hover:text-ink transition-colors"
                  aria-label={showPassword ? t('login.hide_password') : t('login.show_password')}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            {mode === 'register' && senhaErro && (
              <p className="text-[11px] text-amber-400/80 -mt-2 inline-flex items-center gap-1">
                <AlertCircle size={14} strokeWidth={1.5} className="shrink-0" />
                {senhaErro}
              </p>
            )}

            {mode === 'register' && !senhaErro && senha.length > 0 && (
              <div className="-mt-2 flex items-center gap-2">
                <div className="flex-1 h-1 rounded-sl bg-chrome overflow-hidden">
                  <div
                    className={`h-full rounded-sl transition-all ${
                      senha.length >= 8 ? 'w-full bg-concluido' :
                      senha.length >= 6 ? 'w-2/3 bg-atencao' :
                      'w-1/3 bg-urgente'
                    }`}
                  />
                </div>
                <span className={`font-mono text-[10px] ${
                  senha.length >= 8 ? 'text-concluido' :
                  senha.length >= 6 ? 'text-atencao' :
                  'text-urgente'
                }`}>
                  {senha.length >= 8 ? 'Forte' : senha.length >= 6 ? 'Ok' : 'Fraca'}
                </span>
              </div>
            )}

            {error && (
              <p role="alert" className="text-[12px] text-urgente text-center py-1">{error}</p>
            )}

            {mode === 'login' && (
              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  onClick={() => { setForgotMode(true); setForgotEmail(email); }}
                  className="text-[11px] text-ink-muted hover:text-accent transition-colors"
                >
                  {t('login.forgot_password')}
                </button>
              </div>
            )}

            <AuthButton
              loading={loading}
              disabled={isSubmitDisabled}
              label={mode === 'login' ? t('login.submit_login') : t('login.submit_register')}
              loadingLabel={mode === 'login' ? t('login.loading_login') : t('login.loading_register')}
            />
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-line" />
            <span className="font-mono text-[10px] text-ink-muted uppercase tracking-[0.14em]">{t('login.or_continue')}</span>
            <div className="flex-1 h-px bg-line" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-sl bg-elevated border border-line text-ink text-sm font-medium hover:border-ink-muted/50 transition-colors"
          >
            <GoogleLogo className="w-5 h-5" />
            {t('login.google')}
          </button>

          <button
            type="button"
            onClick={handleGuest}
            className="w-full mt-3 py-2.5 rounded-sl border border-line text-[13px] font-medium text-ink-muted hover:text-ink hover:border-ink-muted/50 transition-colors"
          >
            {t('login.guest')}
          </button>
        </div>

        {/* ── Modal de recuperação de senha ── */}
        {forgotMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-fundo/90">
            <div className="sl-panel p-8 w-full max-w-sm mx-4">
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
                  onClick={() => setForgotMode(false)}
                  className="flex-1 py-2.5 rounded-sl border border-line text-sm text-ink-muted hover:text-ink transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={forgotLoading || !forgotEmail.trim()}
                  className="flex-1 py-2.5 rounded-sl bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {forgotLoading ? 'Enviando...' : 'Enviar link'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-4 mt-8">
          <p className="text-[11px] text-ink-muted">
            {t('login.terms_agree')}{' '}
            <span className="text-ink hover:text-accent cursor-pointer transition-colors">{t('login.terms')}</span>
            {' '}{t('login.and')}{' '}
            <span className="text-ink hover:text-accent cursor-pointer transition-colors">{t('login.privacy')}</span>
          </p>

          <button
            type="button"
            onClick={() => i18n.changeLanguage(i18n.language === 'pt-BR' ? 'en' : 'pt-BR')}
            className="flex items-center gap-1 px-2 py-1 rounded-sl font-mono text-[10px] text-ink-muted hover:text-ink border border-line hover:border-ink-muted/50 transition-colors"
          >
            <Globe className="w-3 h-3" />
            {i18n.language === 'pt-BR' ? 'PT' : 'EN'}
          </button>
        </div>
      </div>
    </div>
  );
}
