import { Pressable, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { StreakMonthCell } from '@simply-life/shared'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

const HEAD = ['Se', 'Te', 'Qa', 'Qi', 'Sx', 'Sb', 'Do']

type Props = {
  label: string
  cells: StreakMonthCell[]
  todayIso: string
  onPrev: () => void
  onNext: () => void
}

function dotColor(kind: StreakMonthCell['kind'], colors: { axel: string; danger: string; hairline: string }): string
{
  if (kind === 'action') return colors.axel
  if (kind === 'open' || kind === 'today') return '#C9A15C'
  if (kind === 'missed') return colors.danger
  return colors.hairline
}

/** Calendário do mês com pontos de ritmo. */
export function StreakMonthCard({ label, cells, todayIso, onPrev, onNext }: Props)
{
  const { colors, radius, space } = useTheme()
  const rows: StreakMonthCell[][] = []
  for (let i = 0; i < cells.length; i += 7)
  {
    rows.push(cells.slice(i, i + 7))
  }

  return (
    <View
      style={{
        borderRadius: 24,
        padding: space.lg,
        gap: 12,
        backgroundColor: colors.elevated,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable
          onPress={onPrev}
          accessibilityLabel="Mês anterior"
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="chevron-back" size={18} color={colors.ink} />
        </Pressable>
        <Text variant="bodyStrong" style={{ textTransform: 'lowercase' }}>
          {label}
        </Text>
        <Pressable
          onPress={onNext}
          accessibilityLabel="Próximo mês"
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="chevron-forward" size={18} color={colors.ink} />
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row' }}>
        {HEAD.map((h) => (
          <Text
            key={h}
            variant="micro"
            muted
            style={{ flex: 1, textAlign: 'center' }}
          >
            {h}
          </Text>
        ))}
      </View>
      {rows.map((row) => (
        <View key={row[0]?.iso} style={{ flexDirection: 'row' }}>
          {row.map((cell) =>
          {
            const isToday = cell.iso === todayIso
            return (
              <View
                key={cell.iso}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 6,
                  borderRadius: radius.pill,
                    backgroundColor: isToday ? colors.axel : 'transparent',
                }}
              >
                <Text
                  variant="caption"
                  style={{
                    color: isToday ? colors.axelOnFill : cell.inMonth ? colors.ink : colors.inkFaint,
                    fontWeight: isToday ? '700' : '500',
                  }}
                >
                  {cell.dayNum}
                </Text>
                <View
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 999,
                    marginTop: 4,
                    backgroundColor: cell.inMonth
                      ? dotColor(cell.kind, colors)
                      : 'transparent',
                  }}
                />
              </View>
            )
          })}
        </View>
      ))}
    </View>
  )
}
