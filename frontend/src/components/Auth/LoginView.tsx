import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { AlertCircle, Mail, Lock, Eye, EyeOff, UserPlus, Globe, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useTaskStore } from '../../store/useTaskStore';
import { AuthInput } from '../ui/AuthInput';
import { AuthButton } from '../ui/AuthButton';
import { TabToggle } from '../ui/TabToggle';
import { AxelLoader } from '../ui/AxelLoader';
import { getAuthCallbackUrl, supabase } from '../../lib/supabase';
import { resolvePostAuthPath } from '../../lib/postAuthRoute';
import { LoginHero } from './LoginHero';
import { ForgotPasswordModal } from './ForgotPasswordModal';

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

function translateAuthError(msg: string, t: (k: string) => string): string
{
  if (msg.includes('Invalid login credentials')) return t('login.error_login')
  if (msg.includes('Email not confirmed')) return 'Confirme seu email antes de fazer login'
  if (msg.includes('already registered') || msg.includes('already been registered')) return 'Este email já possui uma conta'
  if (msg.includes('Password should be')) return 'A senha precisa ter no mínimo 6 caracteres'
  return msg
}

export function LoginView()
{
  const login = useTaskStore((s) => s.login);
  const isLoggedIn = useTaskStore((s) => s.isLoggedIn);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Campos separados — evita vazar email/senha de login no cadastro (autofill)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginSenha, setLoginSenha] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [regNome, setRegNome] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regSenha, setRegSenha] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [senhaErro, setSenhaErro] = useState('');
  const [forgotMode, setForgotMode] = useState(false);

  const switchMode = (next: 'login' | 'register') =>
  {
    setMode(next);
    setError('');
    setSenhaErro('');
    setShowLoginPassword(false);
    setShowRegPassword(false);
    setShowRegConfirm(false);
  };

  if (isLoggedIn)
  {
    return <LoggedInRedirect />;
  }

  const finishAuth = async (session: { user: { id: string; email?: string | null } }, displayName: string, successKey: string) =>
  {
    const prevId = useTaskStore.getState().userId;
    login(session.user.email || '', displayName, session.user.id);
    if (prevId !== session.user.id)
    {
      useTaskStore.getState().resetWorkspacePrefsState();
    }
    await useTaskStore.getState().fetchWorkspacePrefs();
    toast.success(t(successKey));
    const path = await resolvePostAuthPath();
    navigate(path, { replace: true });
  };

  const handleRegister = async () =>
  {
    if (regSenha.length < 6)
    {
      setSenhaErro('A senha precisa ter no mínimo 6 caracteres');
      return;
    }
    if (regSenha !== regConfirm)
    {
      setSenhaErro(t('login.error_password_mismatch'));
      return;
    }
    setSenhaErro('');

    const { data, error: err } = await supabase.auth.signUp({
      email: regEmail.trim(),
      password: regSenha,
      options: { data: { nome_completo: regNome.trim() } },
    });
    if (err) throw new Error(err.message);

    if (data.session)
    {
      await finishAuth(data.session, regNome.trim(), 'login.success_register');
      return;
    }

    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email: regEmail.trim(),
      password: regSenha,
    });
    if (signInErr) throw new Error(signInErr.message);
    if (signInData.session)
    {
      await finishAuth(signInData.session, regNome.trim(), 'login.success_register');
    }
  };

  const handleLogin = async () =>
  {
    const { data, error: err } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginSenha,
    });
    if (err) throw new Error(err.message);
    if (!data.session) return;

    const displayName = await (async () =>
    {
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome_completo')
        .eq('id', data.session!.user.id)
        .maybeSingle();
      return profile?.nome_completo || data.user.email?.split('@')[0] || '';
    })();

    await finishAuth(data.session, displayName, 'login.success_login');
  };

  const handleSubmitLogin = async (e: React.FormEvent) =>
  {
    e.preventDefault();
    if (!loginEmail.trim() || !loginSenha.trim()) return;

    setLoading(true);
    setError('');

    try
    {
      await handleLogin();
    }
    catch (err)
    {
      const raw = err instanceof Error ? err.message : t('login.error_connection');
      const msg = translateAuthError(raw, t);
      setError(msg);
      toast.error(msg);
    }
    finally
    {
      setLoading(false);
    }
  };

  const handleSubmitRegister = async (e: React.FormEvent) =>
  {
    e.preventDefault();
    if (!regEmail.trim() || !regSenha.trim() || !regConfirm.trim() || !regNome.trim()) return;

    setLoading(true);
    setError('');

    try
    {
      await handleRegister();
    }
    catch (err)
    {
      const raw = err instanceof Error ? err.message : t('login.error_connection');
      const msg = translateAuthError(raw, t);
      setError(msg);
      toast.error(msg);
    }
    finally
    {
      setLoading(false);
    }
  };

  const handleGoogle = async () =>
  {
    setGoogleLoading(true);
    setError('');
    try
    {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getAuthCallbackUrl(),
          queryParams: { prompt: 'select_account' },
        },
      });
      if (err) throw new Error(err.message);
    }
    catch (err)
    {
      const msg = err instanceof Error ? err.message : t('login.error_google');
      setError(msg);
      toast.error(msg);
      setGoogleLoading(false);
    }
  };

  const handleGuest = async () =>
  {
    const goGuest = async (guestId: string) =>
    {
      const prevId = useTaskStore.getState().userId;
      login('convidado@simplylife.app', 'Convidado', guestId);
      if (prevId !== guestId)
      {
        useTaskStore.getState().resetWorkspacePrefsState();
      }
      await useTaskStore.getState().fetchWorkspacePrefs();
      const path = await resolvePostAuthPath();
      navigate(path, { replace: true });
    };

    try
    {
      const { data, error: err } = await supabase.auth.signInAnonymously();
      if (err) throw new Error(err.message);
      if (data.user)
      {
        toast.success(t('login.success_guest'));
        await goGuest(data.user.id);
        return;
      }
    }
    catch
    {
      toast.success('Entrando como convidado — seus dados ficam apenas neste dispositivo');
      await goGuest(`guest_${Date.now()}`);
    }
  };

  const isLoginDisabled = !loginEmail.trim() || !loginSenha.trim();
  const isRegisterDisabled = !regEmail.trim() || !regSenha.trim() || !regConfirm.trim() || !regNome.trim();

  return (
    <div className="relative min-h-screen w-screen bg-fundo sl-ruled-bg overflow-hidden">
      <div className="absolute inset-0 sl-login-vignette pointer-events-none" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-5xl grid lg:grid-cols-[1fr_420px] gap-10 xl:gap-16 items-center">
          <LoginHero />

          <div className="w-full max-w-md mx-auto lg:max-w-none">
            <div className="lg:hidden mb-8 text-center">
              <p className="sl-eyebrow mb-3">Simply-Life OS</p>
              <h1 className="text-[26px] font-display text-ink leading-tight">{t('login.title')}</h1>
              <p className="text-[13px] text-ink-muted mt-2">{t('login.subtitle')}</p>
            </div>

            <div className="sl-panel sl-login-glow p-8">
              <div className="hidden lg:block mb-6">
                <h2 className="text-xl font-display text-ink">{t('login.title')}</h2>
                <p className="text-[13px] text-ink-muted mt-1">{t('login.subtitle')}</p>
              </div>

              <TabToggle
                tabs={AUTH_TABS_KEYS.map((tab) => ({ value: tab.value, label: t(tab.key) }))}
                active={mode}
                onChange={switchMode}
              />

              {mode === 'login' ? (
                <form
                  key="simply-life-login-form"
                  onSubmit={handleSubmitLogin}
                  className="space-y-4 mt-5"
                  autoComplete="on"
                  name="simply-life-login"
                >
                  <AuthInput
                    id="login-email"
                    name="username"
                    label={t('login.email_label')}
                    type="email"
                    autoFocus
                    required
                    autoComplete="username"
                    inputMode="email"
                    placeholder={t('login.email_placeholder')}
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    icon={<Mail className="w-4 h-4" />}
                  />

                  <AuthInput
                    id="login-password"
                    name="password"
                    label={t('login.password_label')}
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder={t('login.password_placeholder_login')}
                    value={loginSenha}
                    onChange={(e) => setLoginSenha(e.target.value)}
                    icon={<Lock className="w-4 h-4" />}
                    suffix={
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword((v) => !v)}
                        className="text-ink-muted hover:text-ink transition-colors"
                        aria-label={showLoginPassword ? t('login.hide_password') : t('login.show_password')}
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />

                  {error && (
                    <p role="alert" className="text-[12px] text-urgente text-center py-1">{error}</p>
                  )}

                  <div className="flex justify-end -mt-1">
                    <button
                      type="button"
                      onClick={() => setForgotMode(true)}
                      className="text-[11px] text-ink-muted hover:text-accent transition-colors"
                    >
                      {t('login.forgot_password')}
                    </button>
                  </div>

                  <AuthButton
                    loading={loading}
                    disabled={isLoginDisabled}
                    label={t('login.submit_login')}
                    loadingLabel={t('login.loading_login')}
                  />
                </form>
              ) : (
                <form
                  key="simply-life-register-form"
                  onSubmit={handleSubmitRegister}
                  className="space-y-4 mt-5"
                  autoComplete="off"
                  name="simply-life-register"
                >
                  {/* Iscas para absorver autofill de login em formulário de cadastro */}
                  <div className="sr-only" aria-hidden tabIndex={-1}>
                    <input type="text" name="username" autoComplete="username" tabIndex={-1} defaultValue="" />
                    <input type="password" name="password" autoComplete="current-password" tabIndex={-1} defaultValue="" />
                  </div>

                  <AuthInput
                    id="register-nome"
                    name="nome_completo"
                    label={t('login.name_label')}
                    type="text"
                    autoFocus
                    required
                    autoComplete="name"
                    placeholder={t('login.name_placeholder')}
                    value={regNome}
                    onChange={(e) => setRegNome(e.target.value)}
                    icon={<UserPlus className="w-4 h-4" />}
                    preventAutofill
                  />

                  <AuthInput
                    id="register-email"
                    name="email"
                    label={t('login.email_label')}
                    type="email"
                    required
                    autoComplete="off"
                    inputMode="email"
                    placeholder={t('login.email_placeholder')}
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    icon={<Mail className="w-4 h-4" />}
                    preventAutofill
                  />

                  <AuthInput
                    id="register-password"
                    name="new-password"
                    label={t('login.password_label')}
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder={t('login.password_placeholder_register')}
                    value={regSenha}
                    onChange={(e) => setRegSenha(e.target.value)}
                    icon={<Lock className="w-4 h-4" />}
                    preventAutofill
                    suffix={
                      <button
                        type="button"
                        onClick={() => setShowRegPassword((v) => !v)}
                        className="text-ink-muted hover:text-ink transition-colors"
                        aria-label={showRegPassword ? t('login.hide_password') : t('login.show_password')}
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />

                  <AuthInput
                    id="register-password-confirm"
                    name="confirm-password"
                    label={t('login.password_confirm_label')}
                    type={showRegConfirm ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder={t('login.password_confirm_placeholder')}
                    value={regConfirm}
                    onChange={(e) => setRegConfirm(e.target.value)}
                    icon={<Lock className="w-4 h-4" />}
                    preventAutofill
                    suffix={
                      <button
                        type="button"
                        onClick={() => setShowRegConfirm((v) => !v)}
                        className="text-ink-muted hover:text-ink transition-colors"
                        aria-label={showRegConfirm ? t('login.hide_password') : t('login.show_password')}
                      >
                        {showRegConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />

                  {senhaErro && (
                    <p className="text-[11px] text-amber-400/80 -mt-2 inline-flex items-center gap-1">
                      <AlertCircle size={14} strokeWidth={1.5} className="shrink-0" />
                      {senhaErro}
                    </p>
                  )}

                  {!senhaErro && regSenha.length > 0 && (
                    <div className="-mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-sl bg-chrome overflow-hidden">
                        <div
                          className={`h-full rounded-sl transition-all ${
                            regSenha.length >= 8 ? 'w-full bg-concluido' :
                            regSenha.length >= 6 ? 'w-2/3 bg-atencao' :
                            'w-1/3 bg-urgente'
                          }`}
                        />
                      </div>
                      <span className={`font-mono text-[10px] ${
                        regSenha.length >= 8 ? 'text-concluido' :
                        regSenha.length >= 6 ? 'text-atencao' :
                        'text-urgente'
                      }`}>
                        {regSenha.length >= 8 ? 'Forte' : regSenha.length >= 6 ? 'Ok' : 'Fraca'}
                      </span>
                    </div>
                  )}

                  {regConfirm.length > 0 && regSenha !== regConfirm && (
                    <p className="text-[11px] text-urgente -mt-2">{t('login.error_password_mismatch')}</p>
                  )}

                  {error && (
                    <p role="alert" className="text-[12px] text-urgente text-center py-1">{error}</p>
                  )}

                  <AuthButton
                    loading={loading}
                    disabled={isRegisterDisabled}
                    label={t('login.submit_register')}
                    loadingLabel={t('login.loading_register')}
                  />
                </form>
              )}

              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-line" />
                <span className="font-mono text-[10px] text-ink-muted uppercase tracking-[0.14em]">{t('login.or_continue')}</span>
                <div className="flex-1 h-px bg-line" />
              </div>

              <button
                type="button"
                onClick={() => void handleGoogle()}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-sl bg-elevated border border-line text-ink text-sm font-medium hover:border-accent/40 hover:bg-chrome/60 transition-colors disabled:opacity-60"
              >
                {googleLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-ink-muted" />
                ) : (
                  <GoogleLogo className="w-5 h-5" />
                )}
                {t('login.google')}
              </button>

              <button
                type="button"
                onClick={() => void handleGuest()}
                className="w-full mt-3 py-2.5 rounded-sl border border-line text-[13px] font-medium text-ink-muted hover:text-ink hover:border-ink-muted/50 transition-colors"
              >
                {t('login.guest')}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-8">
              <p className="text-[11px] text-ink-muted text-center">
                {t('login.terms_agree')}{' '}
                <span className="text-ink hover:text-accent cursor-pointer transition-colors">{t('login.terms')}</span>
                {' '}{t('login.and')}{' '}
                <span className="text-ink hover:text-accent cursor-pointer transition-colors">{t('login.privacy')}</span>
              </p>

              <button
                type="button"
                onClick={() => i18n.changeLanguage(i18n.language === 'pt-BR' ? 'en' : 'pt-BR')}
                className="flex items-center gap-1 px-2 py-1 rounded-sl font-mono text-[10px] text-ink-muted hover:text-ink border border-line hover:border-ink-muted/50 transition-colors shrink-0"
              >
                <Globe className="w-3 h-3" />
                {i18n.language === 'pt-BR' ? 'PT' : 'EN'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {forgotMode && (
        <ForgotPasswordModal
          initialEmail={loginEmail}
          onClose={() => setForgotMode(false)}
        />
      )}
    </div>
  );
}

function LoggedInRedirect()
{
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() =>
  {
    void resolvePostAuthPath().then(setTarget);
  }, []);

  if (!target)
  {
    return (
      <div className="flex items-center justify-center h-screen bg-fundo">
        <AxelLoader />
      </div>
    );
  }

  return <Navigate to={target} replace />;
}
