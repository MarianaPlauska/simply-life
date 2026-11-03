import { View, Pressable } from 'react-native'
import { Icon } from '../../ui/Icon'
import { Text, IconBadge } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useWorkspace } from '../../layout/useWorkspace'

export type KpiSquare = {
  id: string
  label: string
  value: string
  hint?: string
  icon: keyof typeof Icon.glyphMap
  color: string
  onPress?: () => void
}

/** Celular: grade 2x2 de cartoes. Desktop: quatro na linha. */
export function HomeKpiSquares({ items }: { items: KpiSquare[] })
{
  const { colors, elevation } = useTheme()
  const workspace = useWorkspace()
  const dense = Boolean(workspace.isDesktop)
  const list = items.slice(0, 4)

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {list.map((item) => (
        <Pressable
          key={item.id}
          onPress={item.onPress}
          disabled={!item.onPress}
          style={({ pressed }) => ({
            flexGrow: 1,
            flexBasis: dense ? '22%' : '46%',
            width: dense ? '23%' : '47%',
            minHeight: dense ? 96 : 108,
            borderRadius: 16,
            padding: 16,
            gap: 12,
            backgroundColor: colors.elevated,
            borderWidth: 1,
            borderColor: colors.cardRim,
            justifyContent: 'space-between',
            opacity: pressed ? 0.85 : 1,
            ...(dense ? null : elevation.card),
          })}
        >
          <IconBadge name={item.icon} color={item.color} size={36} iconSize={18} />
          <View style={{ gap: 2 }}>
            <Text variant="micro" muted numberOfLines={1}>
              {item.label}
            </Text>
            <Text variant="bodyStrong" numberOfLines={1} style={{ fontSize: 16 }}>
              {item.value}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  )
}
