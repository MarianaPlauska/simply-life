import { View } from 'react-native'
import { Text } from './Text'
import { PressableScale } from './PressableScale'
import { useTheme } from '../theme/ThemeProvider'

type Props = {
  label: string
  active?: boolean
  onPress?: () => void
  dotColor?: string
  count?: number
}

export function Chip({ label, active, onPress, dotColor, count }: Props)
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
      <Text
        variant="micro"
        color={active ? colors.ink : colors.inkMuted}
        numberOfLines={1}
        style={{ lineHeight: 16 }}
      >
        {text}
      </Text>
    </PressableScale>
  )
}
