import { View } from 'react-native'
import { Text, PressableScale, Icon, type IconName } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  title: string
  hint?: string
  icon?: IconName
  selected: boolean
  onPress: () => void
  /** checkbox = escolha múltipla; radio = uma só */
  kind?: 'checkbox' | 'radio'
  /** Ocupa metade da linha (grade de 2) */
  half?: boolean
}

/**
 * Bloco de escolha das boas-vindas e de Preferências.
 * Selecionado: contorno em tinta da marca (petróleo no claro, menta no escuro), sem coral (coral é só ação).
 */
export function OnbChoice({ title, hint, icon, selected, onPress, kind = 'checkbox', half }: Props)
{
  const { colors, space, radius, mode } = useTheme()
  const accent = mode === 'dark' ? colors.brandInk : colors.brand
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole={kind}
      accessibilityState={{ checked: selected }}
      accessibilityLabel={title}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 64,
        paddingVertical: 12,
        paddingHorizontal: space.md,
        borderRadius: radius.control,
        backgroundColor: selected ? colors.brandMuted : colors.elevated,
        borderWidth: 1,
        borderColor: selected ? accent : colors.hairline,
        ...(half ? { flexBasis: '46%', flexGrow: 1 } : null),
      }}
    >
      {icon ? (
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: selected ? colors.surface : colors.canvas,
          }}
        >
          <Icon name={icon} size={18} color={selected ? accent : colors.inkMuted} />
        </View>
      ) : null}
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text variant="bodyStrong">{title}</Text>
        {hint ? (
          <Text variant="caption" muted>
            {hint}
          </Text>
        ) : null}
      </View>
      <Icon
        name={selected ? 'checkmark-circle' : 'ellipse-outline'}
        size={22}
        color={selected ? accent : colors.inkFaint}
      />
    </PressableScale>
  )
}
