import { View } from 'react-native'
import { Text, PressableScale, Icon, type IconName } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

/** Opção de escolha única (cápsula 12). Selecionada: petróleo, nunca coral. */
export function SelectPill({
  label,
  active,
  onPress,
  icon,
  hint,
}: {
  label: string
  active: boolean
  onPress: () => void
  icon?: IconName
  hint?: string
})
{
  const { colors, mode } = useTheme()
  const on = mode === 'dark' ? colors.brandInk : colors.brand
  const fg = active ? (mode === 'dark' ? colors.chrome : colors.onBrand) : colors.ink
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={{
        minHeight: 44,
        paddingHorizontal: 14,
        paddingVertical: hint ? 8 : 0,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: active ? on : colors.elevated,
      }}
    >
      {icon ? <Icon name={icon} size={18} color={fg} /> : null}
      <View>
        <Text variant="label" color={fg}>
          {label}
        </Text>
        {hint ? (
          <Text variant="micro" color={active ? fg : colors.inkMuted}>
            {hint}
          </Text>
        ) : null}
      </View>
    </PressableScale>
  )
}
