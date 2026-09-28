import { View } from 'react-native'
import { formatWorkoutKg, type MuscleGroupVolume } from '@simply-life/shared'
import { Text } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'

/** Séries da semana por grupo muscular, barras horizontais simples. */
export function WorkoutVolumeBars({ rows }: { rows: MuscleGroupVolume[] })
{
  const { colors, chart, radius, space } = useTheme()
  if (!rows.length)
  {
    return (
      <Text variant="caption" muted>
        Nenhuma série nesta semana ainda. Quando você registrar, o volume de cada grupo aparece aqui.
      </Text>
    )
  }
  const max = Math.max(...rows.map((r) => r.sets), 1)

  return (
    <View style={{ gap: space.sm }} accessibilityRole="summary">
      {rows.map((r, i) => (
        <View
          key={r.group}
          style={{ gap: 6 }}
          accessible
          accessibilityLabel={`${r.label}: ${r.sets} séries, ${formatWorkoutKg(r.volumeKg)}`}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.sm }}>
            <Text variant="label">{r.label}</Text>
            <Text variant="micro" muted>
              {r.sets} {r.sets === 1 ? 'série' : 'séries'}{r.volumeKg > 0 ? ` · ${formatWorkoutKg(r.volumeKg)}` : ''}
            </Text>
          </View>
          <View style={{ height: 10, borderRadius: radius.pill, backgroundColor: colors.canvas, overflow: 'hidden' }}>
            <View
              style={{
                width: `${Math.max(4, (r.sets / max) * 100)}%`,
                height: 10,
                borderRadius: radius.pill,
                backgroundColor: chart[i % chart.length],
              }}
            />
          </View>
        </View>
      ))}
    </View>
  )
}
