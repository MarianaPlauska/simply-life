import { Navigate } from 'react-router-dom';
import { useTaskStore } from '../../store/useTaskStore';
import { useEffect, useState } from 'react';
import { getSessionWithTimeout, isLocalGuestUser } from '../../lib/authSession';

export function ProtectedRoute({ children }: { children: React.ReactNode })
{
  const isLoggedIn = useTaskStore((s) => s.isLoggedIn);
  const userId = useTaskStore((s) => s.userId);
  const login = useTaskStore((s) => s.login);
  const logout = useTaskStore((s) => s.logout);
  const [checking, setChecking] = useState(true);

  // valida sessão do supabase ao montar — com timeout e suporte a convidado local
  useEffect(() =>
  {
    let cancelled = false;

    async function verify()
    {
      try
      {
        // convidado local não depende do Supabase
        if (isLoggedIn && isLocalGuestUser(userId))
        {
          return;
        }

        const { session, timedOut } = await getSessionWithTimeout();

        if (cancelled) return;

        if (session?.user)
        {
          login(
            session.user.email || '',
            session.user.email?.split('@')[0] || '',
            session.user.id,
          );
        }
        else if (!timedOut && isLoggedIn && !isLocalGuestUser(userId))
        {
          // sessão expirou de fato — limpa store
          await logout();
        }
        // timedOut + isLoggedIn: mantém estado local (modo offline)
      }
      catch (err)
      {
        console.error('ProtectedRoute verify:', err);
        // falha de rede — não bloqueia convidado nem sessão persistida
      }
      finally
      {
        if (!cancelled) setChecking(false);
      }
    }

    verify();

    return () =>
    {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking)
  {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-fundo gap-3">
        <div className="w-8 h-8 rounded-sl border-2 border-line border-t-accent animate-spin" />
        <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
          Verificando sessão…
        </p>
      </div>
    );
  }

  if (!isLoggedIn)
  {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
