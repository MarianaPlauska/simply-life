import { useState, useCallback, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Zap, Mail, Lock, Eye, EyeOff, UserPlus, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useTaskStore } from '../../store/useTaskStore';
import { AuthInput } from '../ui/AuthInput';
import { AuthButton } from '../ui/AuthButton';
import { TabToggle } from '../ui/TabToggle';
import { supabase } from '../../lib/supabase';

/* â”€â”€ Google "G" SVG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853" />
      <path d="M5.84 14.09A6.97 6.97 0 0 1 5.47 12c0-.72.13-1.43.37-2.09V7.07H2.18A11.96 11.96 0 0 0 .96 12c0 1.94.46 3.77 1.22 5.33l2.66-3.24Z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.99 14.97.96 12 .96 7.7.96 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335" />
    </svg>
  );
}

/* â”€â”€ Spotlight hook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function useSpotlight() {
  const [pos, setPos] = useState({ x: -1000, y: -1000 });
  const raf = useRef(0);
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => setPos({ x: e.clientX, y: e.clientY }));
  }, []);
  return { pos, onMouseMove };
}

const AUTH_TABS_KEYS = [
  { value: 'login' as const, key: 'login.tab_login' },
  { value: 'register' as const, key: 'login.tab_register' },
];


export function LoginView() {
  const login = useTaskStore((s) => s.login);
  const isLoggedIn = useTaskStore((s) => s.isLoggedIn);
  const navigate = useNavigate();
  const { pos, onMouseMove } = useSpotlight();
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
    <div
      onMouseMove={onMouseMove}
      className="relative h-screen w-screen bg-zinc-900 overflow-hidden flex items-center justify-center"
    >
      {/* Spotlight */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div
          className="absolute w-[900px] h-[900px] rounded-full blur-[160px] will-change-transform"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.30) 0%, rgba(109,40,217,0.14) 40%, transparent 70%)',
            left: pos.x - 450, top: pos.y - 450,
            transition: 'left 0.35s cubic-bezier(.22,1,.36,1), top 0.35s cubic-bezier(.22,1,.36,1)',
          }}
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[200px] will-change-transform"
          style={{
            background: 'radial-gradient(circle, rgba(236,72,153,0.18) 0%, transparent 60%)',
            left: pos.x - 180, top: pos.y - 380,
            transition: 'left 0.5s cubic-bezier(.22,1,.36,1), top 0.5s cubic-bezier(.22,1,.36,1)',
          }}
        />
      </div>

      {/* Grid overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        aria-hidden="true"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/[0.06] backdrop-blur-sm mb-4 shadow-[0_0_40px_rgba(139,92,246,0.06)]">
            <Zap className="w-8 h-8 text-violet-400" aria-hidden="true" />
          </div>
          <h1 className="text-[26px] font-bold text-white tracking-tight">{t('login.title')}</h1>
          <p className="text-[13px] text-zinc-500 mt-1.5 tracking-wide">{t('login.subtitle')}</p>
        </div>

        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/[0.07] rounded-2xl p-8 shadow-2xl shadow-black/40">
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
                  className="text-zinc-600 hover:text-zinc-300 transition-colors"
                  aria-label={showPassword ? t('login.hide_password') : t('login.show_password')}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            {mode === 'register' && senhaErro && (
              <p className="text-[11px] text-amber-400/80 -mt-2">⚠️ {senhaErro}</p>
            )}

            {mode === 'register' && !senhaErro && senha.length > 0 && (
              <div className="-mt-2 flex items-center gap-2">
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

            {error && (
              <p role="alert" className="text-[12px] text-red-400/90 text-center py-1">{error}</p>
            )}

            {mode === 'login' && (
              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  onClick={() => { setForgotMode(true); setForgotEmail(email); }}
                  className="text-[11px] text-zinc-600 hover:text-violet-400 transition-colors"
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
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            <span className="text-[10px] text-zinc-600 uppercase tracking-[0.15em]">{t('login.or_continue')}</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white text-zinc-800 text-sm font-semibold hover:bg-zinc-100 transition-all duration-200 shadow-md shadow-black/10"
          >
            <GoogleLogo className="w-5 h-5" />
            {t('login.google')}
          </button>

          <button
            type="button"
            onClick={handleGuest}
            className="w-full mt-3 py-2.5 rounded-xl border border-white/[0.06] text-[13px] font-medium text-zinc-500 hover:text-white hover:border-white/[0.12] transition-all duration-300"
          >
            {t('login.guest')}
          </button>
        </div>

        {/* ── Modal de recuperação de senha ── */}
        {forgotMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-white/[0.08] rounded-2xl p-8 w-full max-w-sm mx-4 shadow-2xl">
              <h2 className="text-lg font-semibold text-white mb-1">Recuperar senha</h2>
              <p className="text-[13px] text-zinc-500 mb-5">
                Digite seu email e enviaremos um link para redefinir sua senha.
              </p>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-3 rounded-xl bg-zinc-800/60 border border-white/[0.06] text-white text-sm placeholder-zinc-600 focus:border-violet-500/40 focus:outline-none transition-colors"
                autoFocus
              />
              <div className="flex gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => setForgotMode(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/[0.06] text-sm text-zinc-500 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={forgotLoading || !forgotEmail.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {forgotLoading ? 'Enviando...' : 'Enviar link'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-4 mt-8">
          <p className="text-[11px] text-zinc-700">
            {t('login.terms_agree')}{' '}
            <span className="text-zinc-500 hover:text-violet-400 cursor-pointer transition-colors">{t('login.terms')}</span>
            {' '}{t('login.and')}{' '}
            <span className="text-zinc-500 hover:text-violet-400 cursor-pointer transition-colors">{t('login.privacy')}</span>
          </p>

          {/* seletor de idioma */}
          <button
            type="button"
            onClick={() => i18n.changeLanguage(i18n.language === 'pt-BR' ? 'en' : 'pt-BR')}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-zinc-600 hover:text-zinc-300 border border-zinc-800/40 hover:border-zinc-700 transition-all"
          >
            <Globe className="w-3 h-3" />
            {i18n.language === 'pt-BR' ? '🇧🇷 PT' : '🇺🇸 EN'}
          </button>
        </div>
      </div>
    </div>
  );
}
