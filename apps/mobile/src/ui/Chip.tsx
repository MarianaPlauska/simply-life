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
  const { colors, radius } = useTheme()
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
        backgroundColor: active ? colors.surface : colors.elevated,
        borderWidth: 0,
      }}
    >
      {dotColor ? (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            backgroundColor: active ? colors.ink : dotColor,
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
