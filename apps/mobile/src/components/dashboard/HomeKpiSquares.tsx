import { View, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text, IconBadge } from '../../ui'
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

/** Grade 2×2 estilo “Today’s Update”: ícone, título, status. */
export function HomeKpiSquares({ items }: { items: KpiSquare[] })
{
  const { colors } = useTheme()

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {items.slice(0, 4).map((item) => (
        <Pressable
          key={item.id}
          onPress={item.onPress}
          disabled={!item.onPress}
          style={{
            width: '47%',
            flexGrow: 1,
            flexBasis: '46%',
            minHeight: 124,
            borderRadius: 22,
            backgroundColor: colors.elevated,
            padding: 16,
            gap: 14,
            justifyContent: 'space-between',
          }}
        >
          <IconBadge name={item.icon} color={item.color} size={40} iconSize={18} />
          <View style={{ gap: 4 }}>
            <Text variant="bodyStrong" style={{ fontSize: 16 }}>
              {item.label}
            </Text>
            <Text variant="caption" muted style={{ fontSize: 13, lineHeight: 18 }}>
              {item.value}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  )
}
