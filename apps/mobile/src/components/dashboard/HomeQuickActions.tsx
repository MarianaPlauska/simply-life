import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

export type HomeShortcut = {
  id: string
  label: string
  value?: string
  icon: keyof typeof Ionicons.glyphMap
  onPress: () => void
}

export function HomeQuickActions({ actions }: { actions: HomeShortcut[] })
{
  const { colors, space } = useTheme()
  if (actions.length === 0)
  {
    return null
  }

  const perRow = actions.length <= 4 ? actions.length : 3
  const tileWidth = `${Math.floor(100 / perRow) - 2}%` as `${number}%`

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {actions.map((a) => (
        <PressableScale
          key={a.id}
          onPress={a.onPress}
          accessibilityRole="button"
          accessibilityLabel={a.value ? `${a.label} ${a.value}` : a.label}
          style={{
            width: actions.length === 1 ? '48%' : tileWidth,
            flexGrow: 1,
            flexBasis: tileWidth,
            aspectRatio: 1,
            maxHeight: 96,
            minHeight: 80,
            borderRadius: 20,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: space.sm,
            shadowColor: colors.ink,
            shadowOpacity: 0.07,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 3 },
            elevation: 2,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              backgroundColor: colors.axelMuted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={a.icon} size={20} color={colors.ink} />
          </View>
          {a.value ? (
            <Text variant="bodyStrong" numberOfLines={1} style={{ fontSize: 13 }}>
              {a.value}
            </Text>
          ) : null}
          <Text variant="micro" muted style={{ fontSize: 11, textAlign: 'center', fontWeight: '600' }}>
            {a.label}
          </Text>
        </PressableScale>
      ))}
    </View>
  )
}
