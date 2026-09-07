import { ScrollView, Pressable } from 'react-native'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

export type DateStripDay = {
  iso: string
  dayNum: number
  weekday: string
}

export function buildForwardDays(count = 7): DateStripDay[]
{
  return Array.from({ length: count }).map((_, i) =>
  {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return {
      iso,
      dayNum: d.getDate(),
      weekday: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
    }
  })
}

type Props = {
  days: DateStripDay[]
  selectedIso: string
  onSelect: (iso: string) => void
}

/** Faixa de dias — selecionado em AXEL, demais em gelo. */
export function KanbanDateStrip({ days, selectedIso, onSelect }: Props)
{
  const { colors } = useTheme()

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
    >
      {days.map((d) =>
      {
        const active = d.iso === selectedIso
        return (
          <Pressable
            key={d.iso}
            onPress={() => onSelect(d.iso)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={{
              minWidth: 56,
              minHeight: 68,
              paddingHorizontal: 10,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              backgroundColor: active ? colors.axel : colors.elevated,
            }}
          >
            <Text
              variant="micro"
              style={{
                color: active ? colors.axelOnFill : colors.inkMuted,
                textTransform: 'capitalize',
                fontWeight: '600',
              }}
            >
              {d.weekday}
            </Text>
            <Text
              variant="bodyStrong"
              style={{
                fontSize: 18,
                color: active ? colors.axelOnFill : colors.ink,
              }}
            >
              {d.dayNum}
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}
