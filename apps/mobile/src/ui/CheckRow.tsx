import { Pressable, View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text } from './Text'
import { useTheme } from '../theme/ThemeProvider'

export function CheckRow({
  title,
  subtitle,
  done,
  onPress,
  onToggle,
  showSeparator,
  dense,
}: {
  title: string
  subtitle?: string
  done?: boolean
  onPress?: () => void
  onToggle?: () => void
  showSeparator?: boolean
  dense?: boolean
})
{
  const { colors, space } = useTheme()

  return (
    <View>
      <Pressable
        onPress={onPress}
        disabled={!onPress && !onToggle}
        style={({ pressed }) => ({
          minHeight: dense ? 48 : 52,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: dense ? 8 : 10,
          paddingHorizontal: space.sm,
          opacity: pressed ? 0.88 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        })}
      >
        <Pressable
          onPress={() => onToggle?.()}
          hitSlop={8}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: !!done }}
          style={{
            width: 26,
            height: 26,
            borderRadius: 999,
            borderWidth: done ? 0 : 2,
            borderColor: colors.axel,
            backgroundColor: done ? colors.axel : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {done ? (
            <Ionicons name="checkmark" size={15} color={colors.axelOnFill} />
          ) : null}
        </Pressable>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text
            variant="bodyStrong"
            numberOfLines={1}
            style={{
              textDecorationLine: done ? 'line-through' : 'none',
              opacity: done ? 0.55 : 1,
            }}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text variant="caption" muted numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </Pressable>
      {showSeparator ? (
        <View
          style={{
            height: StyleSheet.hairlineWidth,
            backgroundColor: colors.hairline,
            marginLeft: 46,
          }}
        />
      ) : null}
    </View>
  )
}
