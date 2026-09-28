import { Pressable, View } from 'react-native'
import { FOLDER_SERIES_LABELS, seriesFromStored } from '@simply-life/shared'
import { chartColor, type ChartSeries } from '@simply-life/ui-tokens'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { FINANCE_SWATCHES } from '../../lib/categoryMeta'

type Props = {
  /** Chave da paleta (hex antigo também serve: marca a chave mais próxima) */
  value: string
  onChange: (key: ChartSeries) => void
  label?: string
}

/** Paleta categórica (8 cores do modo atual) para categorias e contas fixas */
export function FinanceColorSwatches({ value, onChange, label = 'Cor' }: Props)
{
  const { colors, chart } = useTheme()
  const selected = value ? seriesFromStored(value) : null

  return (
    <View style={{ gap: 12 }}>
      <Text variant="caption" muted>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {FINANCE_SWATCHES.map((key) =>
        {
          const active = selected === key
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={`Cor ${FOLDER_SERIES_LABELS[key]}`}
              accessibilityState={{ selected: active }}
              onPress={() => onChange(key)}
              style={{
                width: 36,
                height: 36,
                minWidth: 36,
                minHeight: 36,
                borderRadius: 999,
                backgroundColor: chartColor(chart, key),
                borderWidth: active ? 3 : 0,
                borderColor: colors.ink,
              }}
            />
          )
        })}
      </View>
    </View>
  )
}
