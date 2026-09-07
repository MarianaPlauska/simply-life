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

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {actions.map((a) => (
        <PressableScale
          key={a.id}
          onPress={a.onPress}
          accessibilityRole="button"
          accessibilityLabel={a.value ? `${a.label} ${a.value}` : a.label}
          style={{
            width: `${(100 / perRow) - 3}%` as `${number}%`,
            flexGrow: 1,
            flexBasis: `${(100 / perRow) - 3}%` as `${number}%`,
            minHeight: 96,
            borderRadius: 22,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 14,
            paddingHorizontal: 10,
            shadowColor: colors.ink,
            shadowOpacity: 0.05,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 1,
          }}
        >
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              backgroundColor: colors.axelMuted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={a.icon} size={18} color={colors.ink} />
          </View>
          {a.value ? (
            <Text
              variant="bodyStrong"
              numberOfLines={1}
              style={{ fontSize: 13, maxWidth: '100%' }}
            >
              {a.value}
            </Text>
          ) : null}
          <Text
            variant="micro"
            muted
            numberOfLines={2}
            style={{
              fontSize: 11,
              textAlign: 'center',
              fontWeight: '600',
              lineHeight: 14,
              maxWidth: '100%',
              paddingHorizontal: 2,
            }}
          >
            {a.label}
          </Text>
        </PressableScale>
      ))}
    </View>
  )
}
