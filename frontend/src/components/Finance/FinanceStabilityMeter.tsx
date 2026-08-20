import {
  BALANCE_TONE_LABEL,
  BALANCE_TONE_TEXT,
  STABILITY_BAR,
  STABILITY_HINT,
  stabilityBands,
  type BalanceTone,
} from '../../lib/financeBalanceTone'

interface FinanceStabilityMeterProps
{
  tone: BalanceTone
  /** Inclui a frase de folga abaixo da faixa */
  showHint?: boolean
  className?: string
}

/** Faixa tranquilo / atenção / apertado — sem vermelho de alarme */
export function FinanceStabilityMeter({
  tone,
  showHint = false,
  className = '',
}: FinanceStabilityMeterProps)
{
  const label = BALANCE_TONE_LABEL[tone]
  const hint = STABILITY_HINT[tone]

  return (
    <div
      className={className}
      role="status"
      aria-label={`Estabilidade: ${label}. ${hint}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex gap-1 flex-1 max-w-[9rem]" aria-hidden>
          {stabilityBands().map((band) => (
            <span
              key={band}
              className={`h-1.5 flex-1 rounded-full ${band === tone ? STABILITY_BAR[band] : 'bg-line'}`}
            />
          ))}
        </div>
        <p className={`text-[12px] sm:text-[13px] font-medium shrink-0 ${BALANCE_TONE_TEXT[tone]}`}>
          {label}
        </p>
      </div>
      {showHint && (
        <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
          {hint}
        </p>
      )}
    </div>
  )
}
