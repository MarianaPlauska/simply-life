import { View } from 'react-native'
import type { TimeTriad } from '@simply-life/shared'
import { Card, FinanceDonut, Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  triad: TimeTriad
}

/** Donut + legenda da tríade de tempo (concluído / no prazo / atrasado). */
export function TimeTriadCard({ triad }: Props)
{
  const { colors, space } = useTheme()
  const total = triad.done + triad.onTime + triad.late
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0)
  const segments = [
    { color: colors.done, value: triad.done, label: 'Concluído' },
    { color: colors.axel, value: triad.onTime, label: 'No prazo' },
    { color: colors.danger, value: triad.late, label: 'Atrasado' },
  ].filter((s) => s.value > 0)

  const legend = [
    { color: colors.done, label: 'Concluído', value: triad.done, pct: pct(triad.done) },
    { color: colors.axel, label: 'No prazo', value: triad.onTime, pct: pct(triad.onTime) },
    { color: colors.danger, label: 'Atrasado', value: triad.late, pct: pct(triad.late) },
  ]

  return (
    <Card tone="elevated" style={{ gap: space.md, padding: 16 }}>
      <Text variant="section" style={{ fontSize: 16 }}>
        Tríade do tempo
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <FinanceDonut
          segments={segments.length > 0 ? segments : [{ color: colors.hairline, value: 1 }]}
          centerLabel="itens"
          centerValue={String(total)}
          size={132}
          strokeWidth={12}
        />
        <View style={{ flex: 1, gap: 10 }}>
          {legend.map((row) => (
            <View key={row.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: row.color,
                }}
              />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text variant="caption" numberOfLines={1}>
                  {row.label}
                </Text>
                <Text variant="micro" muted>
                  {row.value} · {row.pct}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </Card>
  )
}
