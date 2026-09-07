import { Pressable, View } from 'react-native'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { FINANCE_SWATCHES } from '../../lib/categoryMeta'

type Props = {
  value: string
  onChange: (hex: string) => void
  label?: string
}

/** Paleta compacta para categorias e contas fixas */
export function FinanceColorSwatches({ value, onChange, label = 'Cor' }: Props)
{
  const { colors } = useTheme()

  return (
    <View style={{ gap: 8 }}>
      <Text variant="caption" muted>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {FINANCE_SWATCHES.map((hex) =>
        {
          const active = value.toLowerCase() === hex.toLowerCase()
          return (
            <Pressable
              key={hex}
              accessibilityRole="button"
              accessibilityLabel={`Cor ${hex}`}
              accessibilityState={{ selected: active }}
              onPress={() => onChange(hex)}
              style={{
                width: 36,
                height: 36,
                minWidth: 36,
                minHeight: 36,
                borderRadius: 999,
                backgroundColor: hex,
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
