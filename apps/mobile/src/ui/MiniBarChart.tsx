import { View } from 'react-native'
import Svg, { Rect } from 'react-native-svg'

type Props = {
  values: number[]
  highlightIndex?: number
  color: string
  width?: number
  height?: number
}

/** Barras verticais compactas — tendência da semana (sono). */
export function MiniBarChart({
  values,
  highlightIndex,
  color,
  width = 72,
  height = 48,
}: Props)
{
  const n = Math.max(values.length, 1)
  const max = Math.max(...values, 0.01)
  const gap = 3
  const barW = Math.max(3, (width - gap * (n - 1)) / n)

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        {values.map((v, i) =>
        {
          const h = Math.max(4, (v / max) * (height - 2))
          const x = i * (barW + gap)
          const y = height - h
          const active = i === highlightIndex
          return (
            <Rect
              key={i}
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={barW / 2}
              fill={color}
              opacity={active ? 1 : 0.28}
            />
          )
        })}
      </Svg>
    </View>
  )
}
