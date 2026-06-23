import { Navigate, useLocation } from 'react-router-dom'
import { useTaskStore } from '../../store/useTaskStore'
import { isSetupComplete } from '../../lib/userWorkspacePrefs'
import { AxelLoader } from '../ui/AxelLoader'

/** Redireciona para /setup até o wizard "Montar seu AXEL" estar completo */
export function SetupGuard({ children }: { children: React.ReactNode })
{
  const workspacePrefs = useTaskStore((s) => s.workspacePrefs)
  const workspacePrefsLoaded = useTaskStore((s) => s.workspacePrefsLoaded)
  const location = useLocation()

  if (!workspacePrefsLoaded)
  {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-fundo gap-3">
        <AxelLoader />
        <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
          Carregando seu espaço…
        </p>
      </div>
    )
  }

  if (!isSetupComplete(workspacePrefs) && location.pathname !== '/setup')
  {
    return <Navigate to="/setup" replace />
  }

  return <>{children}</>
}
