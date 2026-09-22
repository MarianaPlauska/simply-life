import { View, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text, IconBadge } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useWorkspace } from '../../layout/useWorkspace'

export type KpiSquare = {
  id: string
  label: string
  value: string
  hint?: string
  icon: keyof typeof Ionicons.glyphMap
  color: string
  onPress?: () => void
}

/** Grade 2×2 no celular; quatro na linha no desktop. */
export function HomeKpiSquares({ items }: { items: KpiSquare[] })
{
  const { colors } = useTheme()
  const workspace = useWorkspace()
  const dense = Boolean(workspace.isDesktop)
  const tile = dense
    ? { flexBasis: '22%' as const, minHeight: 96, borderRadius: 18, padding: 12, gap: 10 }
    : { flexBasis: '46%' as const, minHeight: 124, borderRadius: 22, padding: 16, gap: 14 }

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {items.slice(0, 4).map((item) => (
        <Pressable
          key={item.id}
          onPress={item.onPress}
          disabled={!item.onPress}
          style={{
            flexGrow: 1,
            width: dense ? '23%' : '47%',
            backgroundColor: colors.elevated,
            justifyContent: 'space-between',
            ...tile,
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
