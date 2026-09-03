import { useEffect, useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { useHealthRitualSnapshot } from '../../hooks/useHealthRitualSnapshot'
import {
  mergeVitalityDisplay,
  onCareRegistered,
  vitalityCompanionLine,
} from '../../lib/healthVitality'

interface HealthVitalityIndicatorProps
{
  onOpenStats?: () => void
}

/** Energia do dia - só sobe; nunca “definha” por ausência */
export function HealthVitalityIndicator({ onOpenStats }: HealthVitalityIndicatorProps)
{
  const snapshot = useHealthRitualSnapshot()
  const [pulse, setPulse] = useState(0)
  const [displayPercent, setDisplayPercent] = useState(() =>
    mergeVitalityDisplay(snapshot.percent))

  useEffect(() =>
  {
    const next = mergeVitalityDisplay(snapshot.percent)
    setDisplayPercent(next)
  }, [snapshot.percent])

  useEffect(() =>
  {
    return onCareRegistered(() =>
    {
      setPulse((k) => k + 1)
    })
  }, [])

  const line = vitalityCompanionLine(displayPercent, snapshot.allCoreDone)

  return (
    <section aria-label="Seu dia" className="min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <p className="sl-section-label">Seu dia</p>
        <div className="flex items-center gap-2 shrink-0">
          {onOpenStats && (
            <button
              type="button"
              onClick={onOpenStats}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-health hover:underline min-h-11 px-1"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Estatísticas
            </button>
          )}
          <span className="sl-module-metric text-health tabular-nums" aria-hidden>
            {displayPercent}%
          </span>
        </div>
      </div>
      <div
        className="mt-2 h-2.5 overflow-hidden rounded-full bg-chrome"
        role="progressbar"
        aria-valuenow={displayPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Cuidado de hoje: ${displayPercent}%`}
      >
        <div
          key={pulse}
          className={`h-full rounded-full bg-health transition-[width] duration-700 ease-out ${
            pulse > 0 ? 'sl-vitality-pulse' : ''
          }`}
          style={{ width: `${displayPercent}%` }}
        />
      </div>
      <p className="sl-body-muted mt-2 leading-relaxed">
        {line}
      </p>
    </section>
  )
}
