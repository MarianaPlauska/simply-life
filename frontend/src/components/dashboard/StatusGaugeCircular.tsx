interface StatusGaugeCircularProps
{
  label: string
  value: number
  max?: number
  color: string
  trackColor?: string
  size?: number
}

// Medalhao gauge circular com numero grande no centro (estilo Orion)
// SVG nativo, sem libs — leve e crisp

export function StatusGaugeCircular({
  label,
  value,
  max = 100,
  color,
  trackColor = '#1f1b2e',
  size = 64,
}: StatusGaugeCircularProps)
{
  const pct = Math.min(1, Math.max(0, value / max))
  const stroke = 4
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - pct)

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90 drop-shadow-[0_0_4px_rgba(139,92,246,0.15)]">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={trackColor}
            strokeWidth={stroke}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            fill="transparent"
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
            style={{ filter: `drop-shadow(0 0 3px ${color}55)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[22px] font-bold text-white leading-none tabular-nums">{value}</span>
          <span className="text-[9px] text-zinc-500 font-mono mt-0.5">/{max}</span>
        </div>
      </div>
      <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">{label}</span>
    </div>
  )
}
