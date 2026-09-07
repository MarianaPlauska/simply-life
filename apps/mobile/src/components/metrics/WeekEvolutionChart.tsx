import { View } from 'react-native'
import { weekMetricValue, type WeekMetric, type WeekPoint } from '@simply-life/shared'
import { Card, Chip, Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

const METRICS: { id: WeekMetric; label: string }[] = [
  { id: 'score', label: 'Pontuação' },
  { id: 'done', label: 'Realizado' },
  { id: 'time', label: 'Tempo' },
]

type Props = {
  series: WeekPoint[]
  metric: WeekMetric
  onMetricChange: (id: WeekMetric) => void
}

/** Barras da semana com valor em cima - evolução do recorte. */
export function WeekEvolutionChart({ series, metric, onMetricChange }: Props)
{
  const { colors, space } = useTheme()
  const values = series.map((p) => weekMetricValue(p, metric))
  const peak = Math.max(1, ...values)
  const todayIso = new Date().toISOString().slice(0, 10)

  return (
    <Card tone="elevated" style={{ gap: space.sm, padding: 16 }}>
      <Text variant="section" style={{ fontSize: 16 }}>
        Evolução semanal
      </Text>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {METRICS.map((m) => (
          <Chip
            key={m.id}
            label={m.label}
            active={metric === m.id}
            onPress={() => onMetricChange(m.id)}
          />
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 132 }}>
        {series.map((p, i) =>
        {
          const value = values[i]
          const h = 16 + Math.round((value / peak) * 88)
          const today = p.iso === todayIso
          return (
            <View key={p.iso} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <Text variant="micro" style={{ fontSize: 10, color: today ? colors.axel : colors.inkMuted }}>
                {value}
              </Text>
              <View
                style={{
                  width: '78%',
                  height: h,
                  borderRadius: 8,
                  backgroundColor: today ? colors.axel : colors.axelMuted,
                }}
              />
              <Text
                variant="micro"
                muted={!today}
                color={today ? colors.axel : undefined}
                style={{ fontFamily: today ? 'Manrope_700Bold' : 'Manrope_400Regular' }}
              >
                {p.label}
              </Text>
            </View>
          )
        })}
      </View>
    </Card>
  )
}
