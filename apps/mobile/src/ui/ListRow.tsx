import { Pressable, View, StyleSheet } from 'react-native'
import { COMPONENT_SPEC } from '@simply-life/ui-tokens'
import { Text } from './Text'
import { useTheme } from '../theme/ThemeProvider'

export function ListRow({
  title,
  subtitle,
  right,
  onPress,
  progress,
  showSeparator,
}: {
  title: string
  subtitle?: string
  right?: string
  onPress?: () => void
  progress?: number
  showSeparator?: boolean
})
{
  const { colors, space, radius } = useTheme()
  const spec = COMPONENT_SPEC.ListRow

  return (
    <View>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => ({
          paddingVertical: spec.paddingVertical,
          minHeight: subtitle ? spec.minHeightTwoLine : spec.minHeight,
          paddingHorizontal: spec.paddingHorizontal,
          borderRadius: radius.control,
          backgroundColor: pressed ? colors.elevated : 'transparent',
          opacity: pressed ? 0.88 : 1,
          transform: [{ scale: pressed && onPress ? 0.97 : 1 }],
          justifyContent: 'center',
          gap: space.sm,
        })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text variant="caption" muted numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          {right ? (
            <Text variant="caption" muted>
              {right}
            </Text>
          ) : null}
        </View>
        {typeof progress === 'number' ? (
          <View
            style={{
              height: 4,
              borderRadius: 999,
              backgroundColor: colors.hairline,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%`,
                height: '100%',
                backgroundColor: colors.axelFill,
                borderRadius: 999,
              }}
            />
          </View>
        ) : null}
      </Pressable>
      {showSeparator ? (
        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.hairline, marginLeft: space.sm }} />
      ) : null}
    </View>
  )
}
