import { Navigate } from 'react-router-dom';
import { useTaskStore } from '../../store/useTaskStore';
import { useEffect, useState } from 'react';
import { getSessionWithTimeout, isLocalGuestUser } from '../../lib/authSession';
import { AxelLoader } from '../ui/AxelLoader';

export function ProtectedRoute({ children }: { children: React.ReactNode })
{
  const isLoggedIn = useTaskStore((s) => s.isLoggedIn);
  const userId = useTaskStore((s) => s.userId);
  const login = useTaskStore((s) => s.login);
  const logout = useTaskStore((s) => s.logout);
  // Já logado (ex.: voltando do /setup) — não bloquear a tela de novo
  const [checking, setChecking] = useState(() => !useTaskStore.getState().isLoggedIn);

  useEffect(() =>
  {
    let cancelled = false;

    async function verify()
    {
      try
      {
        if (isLoggedIn && isLocalGuestUser(userId))
        {
          return;
        }

        if (!isLoggedIn)
        {
          setChecking(true);
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

          const store = useTaskStore.getState();
          if (!store.workspacePrefsLoaded)
          {
            void store.fetchWorkspacePrefs();
          }
        }
        else if (!timedOut && isLoggedIn && !isLocalGuestUser(userId))
        {
          await logout();
        }
      }
      catch (err)
      {
        console.error('ProtectedRoute verify:', err);
      }
      finally
      {
        if (!cancelled) setChecking(false);
      }
    }

    void verify();

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
        <AxelLoader />
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
