import { ScrollView, View } from 'react-native'
import { REPORT_PERIODS, type ReportPeriod } from '@simply-life/shared'
import { Text, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  value: ReportPeriod
  onChange: (id: ReportPeriod) => void
}

/** Pills de recorte temporal - preenchido no ativo (cobre AXEL, nunca roxo). */
export function PeriodFilter({ value, onChange }: Props)
{
  const { colors } = useTheme()

  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingRight: 8 }}
    >
      {REPORT_PERIODS.map((p) =>
      {
        const active = p.id === value
        return (
          <PressableScale
            key={p.id}
            onPress={() => onChange(p.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={{
              minHeight: 36,
              paddingHorizontal: 14,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: active ? colors.axel : colors.elevated,
            }}
          >
            <Text
              variant="caption"
              color={active ? colors.axelOnFill : colors.inkMuted}
              style={{ fontFamily: 'Manrope_600SemiBold' }}
            >
              {p.label}
            </Text>
          </PressableScale>
        )
      })}
    </ScrollView>
  )
}
