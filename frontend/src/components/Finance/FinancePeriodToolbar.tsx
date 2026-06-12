import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  AXEL_FILTER_PILL_ACTIVE,
  AXEL_FILTER_PILL_IDLE,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'
import type { FinancePeriodConfig, FinancePeriodMode, ResolvedFinancePeriod } from '../../lib/financePeriodFilter'

interface FinancePeriodToolbarProps
{
  config: FinancePeriodConfig
  resolved: ResolvedFinancePeriod
  onChange: (next: FinancePeriodConfig) => void
  onShift: (direction: -1 | 1) => void
}

const MODES: { id: FinancePeriodMode; label: string }[] = [
  { id: 'mes', label: 'Mês' },
  { id: 'semana', label: 'Semana' },
  { id: 'quinzena', label: 'Quinzena' },
  { id: 'custom', label: 'Personalizado' },
]

export function FinancePeriodToolbar({
  config,
  resolved,
  onChange,
  onShift,
}: FinancePeriodToolbarProps)
{
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex flex-wrap gap-1 w-full">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange({ ...config, mode: m.id })}
              className={`shrink-0 ${config.mode === m.id ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE}`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 w-full sm:w-auto sm:ml-auto">
          <button
            type="button"
            onClick={() => onShift(-1)}
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-sl border border-line hover:bg-chrome text-ink-muted shrink-0"
            aria-label="Período anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className={`font-mono text-[10px] sm:text-[11px] flex-1 sm:flex-none sm:min-w-[140px] text-center tabular-nums leading-tight ${AXEL_TEXT_SECONDARY}`}>
            {resolved.label}
          </span>
          <button
            type="button"
            onClick={() => onShift(1)}
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-sl border border-line hover:bg-chrome text-ink-muted shrink-0"
            aria-label="Próximo período"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {config.mode === 'quinzena' && (
        <div className="flex gap-1">
          {([1, 2] as const).map((part) => (
            <button
              key={part}
              type="button"
              onClick={() => onChange({ ...config, quinzenaPart: part })}
              className={config.quinzenaPart === part ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE}
            >
              {part}ª quinzena
            </button>
          ))}
        </div>
      )}

      {config.mode === 'custom' && (
        <div className="flex flex-wrap items-center gap-2">
          <label className={`font-mono text-[10px] uppercase ${AXEL_TEXT_SECONDARY}`}>
            De
            <input
              type="date"
              value={config.customStart}
              onChange={(e) => onChange({ ...config, customStart: e.target.value })}
              className="ml-1.5 bg-chrome border border-line rounded-sl px-2 py-1 text-[11px] text-ink font-mono"
            />
          </label>
          <label className={`font-mono text-[10px] uppercase ${AXEL_TEXT_SECONDARY}`}>
            Até
            <input
              type="date"
              value={config.customEnd}
              onChange={(e) => onChange({ ...config, customEnd: e.target.value })}
              className="ml-1.5 bg-chrome border border-line rounded-sl px-2 py-1 text-[11px] text-ink font-mono"
            />
          </label>
        </div>
      )}
    </div>
  )
}
