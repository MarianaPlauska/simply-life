import { Pressable, View } from 'react-native'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { FINANCE_ICON_NAMES, FinanceIcon } from '../../lib/financeIcons'

type Props = {
  value: string
  onChange: (name: string) => void
}

/** Grade de ícones (Phosphor) para categorias e contas fixas */
export function FinanceIconPicker({ value, onChange }: Props)
{
  const { colors } = useTheme()

  return (
    <View style={{ gap: 8 }}>
      <Text variant="caption" muted>
        Ícone
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {FINANCE_ICON_NAMES.map((name) =>
        {
          const active = value === name
          return (
            <Pressable
              key={name}
              onPress={() => onChange(name)}
              accessibilityLabel={name}
              accessibilityState={{ selected: active }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: active ? colors.axelMuted : colors.elevated,
                borderWidth: 1,
                borderColor: active ? colors.axel : colors.hairline,
              }}
            >
              <FinanceIcon
                name={name}
                size={20}
                color={active ? colors.axel : colors.ink}
              />
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
