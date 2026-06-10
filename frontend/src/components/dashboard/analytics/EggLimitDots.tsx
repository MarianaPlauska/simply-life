import { Circle } from 'lucide-react'
import { ORION_LINE, ORION_TEXT_SECONDARY } from '../../../constants/orionSurfaces'

// Indicador de ovos consumidos no dia (máx. 3)

interface EggLimitDotsProps
{
  consumed: number
  max?: number
}

export function EggLimitDots({ consumed, max = 3 }: EggLimitDotsProps)
{
  return (
    <div className={`flex items-center gap-2 pt-3 ${ORION_LINE}`}>
      <span className={`font-mono text-[10px] uppercase tracking-wider mr-1 ${ORION_TEXT_SECONDARY}`}>Ovos</span>
      {Array.from({ length: max }, (_, i) =>
      {
        const filled = i < consumed
        return (
          <Circle
            key={i}
            className={`w-3.5 h-3.5 ${
              filled
                ? 'text-accent fill-accent/20'
                : 'text-line fill-transparent'
            }`}
            strokeWidth={2}
            aria-hidden="true"
          />
        )
      })}
      <span className={`font-mono text-[10px] tabular-nums ml-auto ${ORION_TEXT_SECONDARY}`}>
        {consumed}/{max} hoje
      </span>
    </div>
  )
}
