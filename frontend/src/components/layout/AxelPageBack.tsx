import { ChevronLeft } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

const ROOT_PATHS = new Set(['/', '/kanban'])

interface AxelPageBackProps
{
  className?: string
}

/** Voltar discreto — padrão de apps grandes, sem ocupar espaço */
export function AxelPageBack({ className = '' }: AxelPageBackProps)
{
  const navigate = useNavigate()
  const location = useLocation()

  if (ROOT_PATHS.has(location.pathname))
  {
    return null
  }

  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      className={`inline-flex items-center gap-0.5 p-1.5 -ml-1 rounded-sl text-ink-muted hover:text-ink hover:bg-chrome transition-colors shrink-0 ${className}`}
      aria-label="Voltar"
      title="Voltar"
    >
      <ChevronLeft className="w-4 h-4" />
      <span className="hidden md:inline font-mono text-[10px] uppercase tracking-wide">Voltar</span>
    </button>
  )
}
