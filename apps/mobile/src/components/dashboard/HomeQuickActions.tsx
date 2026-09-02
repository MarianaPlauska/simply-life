import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card, Text, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Action = {
  id: string
  label: string
  icon: keyof typeof Ionicons.glyphMap
  onPress: () => void
}

/** Faixa de atalhos sobreposta ao hero (ref wallet) — Nível 2 */
export function HomeQuickActions({ actions }: { actions: Action[] })
{
  const { colors, space, radius } = useTheme()

  return (
    <Card
      tone="elevated"
      style={{
        marginTop: -36,
        zIndex: 2,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: space.md,
        paddingHorizontal: space.sm,
        borderRadius: radius.sheet,
        gap: 4,
      }}
    >
      {actions.map((a) => (
        <PressableScale
          key={a.id}
          onPress={a.onPress}
          accessibilityRole="button"
          accessibilityLabel={a.label}
          style={{
            flex: 1,
            alignItems: 'center',
            gap: 8,
            minHeight: 64,
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.hairline,
            }}
          >
            <Ionicons name={a.icon} size={20} color={colors.ink} />
          </View>
          <Text variant="micro" muted style={{ fontSize: 11, textAlign: 'center' }}>
            {a.label}
          </Text>
        </PressableScale>
      ))}
    </Card>
  )
}
