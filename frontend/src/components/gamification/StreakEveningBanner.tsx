import { useMemo, useState } from 'react'
import { Flame, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTaskStore } from '../../store/useTaskStore'

// Lembrete noturno — proteger ofensiva antes do dia acabar

function sessionDismissKey(): string
{
  return `axel-streak-evening-${new Date().toISOString().slice(0, 10)}`
}

export function StreakEveningBanner()
{
  const navigate = useNavigate()
  const streakCount = useTaskStore((s) => s.streakCount)
  const isStreakSafeToday = useTaskStore((s) => s.isStreakSafeToday)

  const [dismissed, setDismissed] = useState(() =>
    sessionStorage.getItem(sessionDismissKey()) === '1',
  )

  const shouldShow = useMemo(() =>
  {
    if (dismissed) return false
    if (streakCount < 1) return false
    if (isStreakSafeToday()) return false
    const hour = new Date().getHours()
    return hour >= 18
  }, [dismissed, streakCount, isStreakSafeToday])

  if (!shouldShow)
  {
    return null
  }

  const dismiss = () =>
  {
    sessionStorage.setItem(sessionDismissKey(), '1')
    setDismissed(true)
  }

  return (
    <div
      className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-sl border border-line bg-chrome/40"
      role="status"
    >
      <Flame className="w-5 h-5 text-ink-muted shrink-0" />
      <div className="flex-1 min-w-[200px]">
        <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
          Quando fizer sentido
        </p>
        <p className="text-sm text-ink mt-0.5">
          Você tem <strong>{streakCount}</strong> {streakCount === 1 ? 'dia' : 'dias'} de sequência —
          ela pausa, não zera. Abrir o resumo do dia já conta.
        </p>
      </div>
      <button
        type="button"
        onClick={() => navigate('/')}
        className="font-mono text-[11px] uppercase tracking-wide px-3 py-2 rounded-sl border border-line text-ink hover:bg-chrome min-h-[44px]"
      >
        Ver o dia
      </button>
      <button
        type="button"
        onClick={dismiss}
        className="p-1.5 text-ink-muted hover:text-ink"
        aria-label="Dispensar lembrete"
      >
        <X size={14} />
      </button>
    </div>
  )
}
