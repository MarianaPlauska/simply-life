// Sparkline SVG mínimo — linha de tendência sem eixos ou fundo

interface SparklineProps
{
  data: number[]
  width?: number
  height?: number
  stroke?: string
  strokeWidth?: number
  className?: string
  /** ID único para gradiente SVG (evita colisão quando há vários na página) */
  gradientId?: string
  useGradient?: boolean
}

export function Sparkline({
  data,
  width = 88,
  height = 24,
  stroke = '#a855f7',
  strokeWidth = 1.5,
  className = '',
  gradientId = 'orion-spark-gradient',
  useGradient = true,
}: SparklineProps)
{
  if (data.length < 2)
  {
    return null
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const step = width / (data.length - 1)

  const points = data.map((v, i) =>
  {
    const x = i * step
    const y = height - ((v - min) / range) * (height - 2) - 1
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  const strokeRef = useGradient ? `url(#${gradientId})` : stroke

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
    >
      {useGradient && (
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.95" />
          </linearGradient>
        </defs>
      )}
      <polyline
        points={points}
        fill="none"
        stroke={strokeRef}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
