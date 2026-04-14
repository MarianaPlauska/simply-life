import { Navigate } from 'react-router-dom';
import { useTaskStore } from '../../store/useTaskStore';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useTaskStore((s) => s.isLoggedIn);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
