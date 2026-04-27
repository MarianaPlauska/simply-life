import { Navigate } from 'react-router-dom';
import { useTaskStore } from '../../store/useTaskStore';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export function ProtectedRoute({ children }: { children: React.ReactNode })
{
  const isLoggedIn = useTaskStore((s) => s.isLoggedIn);
  const login = useTaskStore((s) => s.login);
  const logout = useTaskStore((s) => s.logout);
  const [checking, setChecking] = useState(true);

  // valida sessão real do supabase ao montar
  useEffect(() =>
  {
    async function verify ()
    {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user)
      {
        // sessão válida — garante que o store tá atualizado
        login(session.user.email || '', session.user.email?.split('@')[0] || '', session.user.id);
      }
      else if (isLoggedIn)
      {
        // store diz logado mas sessão expirou — limpa
        logout();
      }
      setChecking(false);
    }
    verify();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking)
  {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-violet-500 animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn)
  {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
