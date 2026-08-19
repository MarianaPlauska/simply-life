import { X } from 'lucide-react'
import { useState } from 'react'
import { isDemoEmail } from '../../lib/demoWorkspace'
import { useTaskStore } from '../../store/useTaskStore'

/** Aviso discreto — dados da demo voltam ao seed no próximo login / cron. */
export function DemoWorkspaceBanner()
{
  const email = useTaskStore((s) => s.userProfile.email)
  const [hidden, setHidden] = useState(false)

  if (hidden || !isDemoEmail(email)) return null

  return (
    <div className="shrink-0 px-3 pt-3 md:px-6">
      <div
        role="status"
        className="flex items-start gap-3 rounded-sl border border-accent/35 bg-accent/10 px-3 py-2.5"
      >
        <p className="min-w-0 flex-1 text-[13px] text-ink leading-relaxed">
          Ambiente de demonstração — Kanban, finanças e hábitos são de exemplo e
          reiniciam a cada visita.
        </p>
        <button
          type="button"
          onClick={() => setHidden(true)}
          className="shrink-0 min-h-11 min-w-11 inline-flex items-center justify-center text-ink-muted hover:text-ink"
          aria-label="Fechar aviso da demo"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
