import { View } from 'react-native'
import { Text } from './Text'
import { PressableScale } from './PressableScale'
import { Icon, type IconName } from './Icon'
import { useTheme } from '../theme/ThemeProvider'

type Props = {
  label: string
  active?: boolean
  onPress?: () => void
  dotColor?: string
  count?: number
  /** ícone antes do texto; com label vazio vira um chip só de ícone */
  icon?: IconName
  accessibilityLabel?: string
}

export function Chip({ label, active, onPress, dotColor, count, icon, accessibilityLabel }: Props)
{
  const { colors, radius, mode } = useTheme()
  // escolhido: fundo petróleo suave e contorno na tinta da marca (petróleo no claro, menta no escuro)
  const ink = mode === 'dark' ? colors.brandInk : colors.brand
  const text = typeof count === 'number' ? `${label} · ${count}` : label

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      accessibilityLabel={accessibilityLabel}
      style={{
        minHeight: 44,
        paddingHorizontal: 14,
        borderRadius: radius.pill,
        justifyContent: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 0,
        gap: 6,
        backgroundColor: active ? colors.brandMuted : colors.elevated,
        borderWidth: 1,
        // não escolhida: contorno suave, senão some dentro de cartões da mesma cor
        borderColor: active ? ink : colors.hairlineStrong,
      }}
    >
      {dotColor ? (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            backgroundColor: dotColor,
          }}
        />
      ) : null}
      {icon ? <Icon name={icon} size={16} color={active ? colors.ink : colors.inkMuted} /> : null}
      {text ? (
        <Text
          variant="micro"
          color={active ? colors.ink : colors.inkMuted}
          numberOfLines={1}
          style={{ lineHeight: 16 }}
        >
          {text}
        </Text>
      ) : null}
    </PressableScale>
  )
}
