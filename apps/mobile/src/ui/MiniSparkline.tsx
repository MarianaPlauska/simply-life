import { View } from 'react-native'
import Svg, { Polyline } from 'react-native-svg'

type Props = {
  values: number[]
  color: string
  width?: number
  height?: number
}

/** Linha suave compacta — tendência (treino / peso). */
export function MiniSparkline({ values, color, width = 72, height = 40 }: Props)
{
  const pts = values.length >= 2 ? values : [...values, ...values]
  if (pts.length < 2)
  {
    return <View style={{ width, height }} />
  }
  const max = Math.max(...pts, 1)
  const min = Math.min(...pts, 0)
  const span = Math.max(max - min, 0.2)
  const step = (width - 4) / (pts.length - 1)
  const line = pts
    .map((v, i) =>
    {
      const x = 2 + i * step
      const y = height - 4 - ((v - min) / span) * (height - 8)
      return `${x},${y}`
    })
    .join(' ')

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Polyline
          points={line}
          fill="none"
          stroke={color}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  )
}
