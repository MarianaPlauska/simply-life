import { View } from 'react-native'
import type { HeatCell } from '@simply-life/shared'

type Props = {
  cells: HeatCell[]
  color: string
  rows?: number
}

/** Quadriculado tipo GitHub: dias preenchidos na cor do hábito. */
export function HabitHeatmap({ cells, color, rows = 4 }: Props)
{
  const cols = Math.max(1, Math.ceil(cells.length / rows))
  const size = 8
  const gap = 2

  return (
    <View style={{ flexDirection: 'row', gap, flexWrap: 'nowrap' }}>
      {Array.from({ length: cols }).map((_, col) => (
        <View key={`c-${col}`} style={{ gap }}>
          {Array.from({ length: rows }).map((_, row) =>
          {
            const cell = cells[col * rows + row]
            if (!cell)
            {
              return <View key={`e-${row}`} style={{ width: size, height: size }} />
            }
            const bg = cell.future
              ? 'transparent'
              : cell.filled
                ? color
                : 'rgba(128,128,128,0.18)'
            return (
              <View
                key={cell.iso}
                style={{
                  width: size,
                  height: size,
                  borderRadius: 2,
                  backgroundColor: bg,
                }}
              />
            )
          })}
        </View>
      ))}
    </View>
  )
}
