import { useState, useCallback, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Zap, Mail, Lock, Eye, EyeOff, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useTaskStore } from '../../store/useTaskStore';
import { AuthInput } from '../ui/AuthInput';
import { AuthButton } from '../ui/AuthButton';
import { TabToggle } from '../ui/TabToggle';

const API = 'http://127.0.0.1:8000';

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

const AUTH_TABS = [
  { value: 'login' as const, label: 'Entrar' },
  { value: 'register' as const, label: 'Criar Conta' },
];

/* â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export function LoginView() {
  const login = useTaskStore((s) => s.login);
  const isLoggedIn = useTaskStore((s) => s.isLoggedIn);
  const navigate = useNavigate();
  const { pos, onMouseMove } = useSpotlight();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* Already authenticated â€” redirect to app */
  if (isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  /* â”€â”€ Submit â”€â”€ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !senha.trim()) return;
    if (mode === 'register' && !nome.trim()) return;

    setLoading(true);
    setError('');

    try {
      const endpoint = mode === 'register' ? '/auth/registro' : '/auth/login';
      const body = mode === 'register'
        ? { email: email.trim(), senha, nome_completo: nome.trim() }
        : { email: email.trim(), senha };

      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || (mode === 'register' ? 'Erro ao criar conta' : 'Email ou senha incorretos'));
      }

      const data = await res.json();
      login(data.nome || email.split('@')[0], data.nome || '', data.access_token);
      toast.success(mode === 'register' ? 'Conta criada! Bem-vindo ao Simply-Life!' : 'Bem-vindo ao Simply-Life!');
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro de conexao';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const token = useTaskStore.getState().authToken;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API}/integracoes/google/url`, { headers });
      if (!res.ok) throw new Error('Falha ao obter URL de autorizacao');
      const data = await res.json();
      window.location.href = data.url;
    } catch {
      toast.error('Erro ao conectar com Google. Verifique se o servidor esta ativo.');
    }
  };

  const handleGuest = () => {
    login('convidado@simplylife.app', 'Convidado');
    toast.success('Entrando como convidado');
    navigate('/', { replace: true });
  };

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
          <h1 className="text-[26px] font-bold text-white tracking-tight">Simply-Life</h1>
          <p className="text-[13px] text-zinc-500 mt-1.5 tracking-wide">Seu sistema operacional pessoal</p>
        </div>

        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/[0.07] rounded-2xl p-8 shadow-2xl shadow-black/40">
          <TabToggle
            tabs={AUTH_TABS}
            active={mode}
            onChange={(v) => { setMode(v); setError(''); }}
          />

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <AuthInput
                id="auth-nome"
                label="Nome"
                type="text"
                autoFocus
                required
                autoComplete="name"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                icon={<UserPlus className="w-4 h-4" />}
              />
            )}

            <AuthInput
              id="auth-email"
              label="Email"
              type="email"
              autoFocus={mode === 'login'}
              required
              autoComplete="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
            />

            <AuthInput
              id="auth-senha"
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder={mode === 'login' ? 'Sua senha' : 'Crie uma senha forte'}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-zinc-600 hover:text-zinc-300 transition-colors"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            {error && (
              <p role="alert" className="text-[12px] text-red-400/90 text-center py-1">{error}</p>
            )}

            {mode === 'login' && (
              <div className="flex justify-end -mt-1">
                <button type="button" className="text-[11px] text-zinc-600 hover:text-violet-400 transition-colors">
                  Esqueceu sua senha?
                </button>
              </div>
            )}

            <AuthButton
              loading={loading}
              disabled={isSubmitDisabled}
              label={mode === 'login' ? 'Entrar' : 'Criar Conta'}
              loadingLabel={mode === 'login' ? 'Entrando...' : 'Criando conta...'}
            />
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            <span className="text-[10px] text-zinc-600 uppercase tracking-[0.15em]">ou continue com</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white text-zinc-800 text-sm font-semibold hover:bg-zinc-100 transition-all duration-200 shadow-md shadow-black/10"
          >
            <GoogleLogo className="w-5 h-5" />
            Continuar com Google
          </button>

          <button
            type="button"
            onClick={handleGuest}
            className="w-full mt-3 py-2.5 rounded-xl border border-white/[0.06] text-[13px] font-medium text-zinc-500 hover:text-white hover:border-white/[0.12] transition-all duration-300"
          >
            Continuar como convidado
          </button>
        </div>

        <p className="text-center text-[11px] text-zinc-700 mt-8">
          Ao continuar, voce concorda com os{' '}
          <span className="text-zinc-500 hover:text-violet-400 cursor-pointer transition-colors">Termos de Uso</span>
          {' '}e{' '}
          <span className="text-zinc-500 hover:text-violet-400 cursor-pointer transition-colors">Politica de Privacidade</span>
        </p>
      </div>
    </div>
  );
}
