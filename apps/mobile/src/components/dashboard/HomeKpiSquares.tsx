import { View, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

export type KpiSquare = {
  id: string
  label: string
  value: string
  hint?: string
  icon: keyof typeof Ionicons.glyphMap
  color: string
  onPress?: () => void
}

/**
 * Três quadrados KPI - linguagem fitness (18 workouts / 333 sets / lbs).
 */
export function HomeKpiSquares({ items }: { items: KpiSquare[] })
{
  const { colors, space } = useTheme()

  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      {items.slice(0, 3).map((item) => (
        <Pressable
          key={item.id}
          onPress={item.onPress}
          disabled={!item.onPress}
          style={{
            flex: 1,
            aspectRatio: 1,
            maxHeight: 120,
            borderRadius: 22,
            backgroundColor: colors.surface,
            padding: space.md,
            justifyContent: 'space-between',
            borderWidth: 0,
            minHeight: 104,
            shadowColor: colors.ink,
            shadowOpacity: 0.07,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Ionicons name={item.icon} size={18} color={item.color} />
            {item.hint ? (
              <Text variant="micro" style={{ color: colors.health, fontWeight: '700' }}>
                {item.hint}
              </Text>
            ) : null}
          </View>
          <View style={{ gap: 2 }}>
            <Text
              variant="title"
              style={{ fontSize: 22, letterSpacing: -0.6, color: colors.ink }}
              numberOfLines={1}
            >
              {item.value}
            </Text>
            <Text variant="caption" muted numberOfLines={1} style={{ fontSize: 11 }}>
              {item.label}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  )
}
