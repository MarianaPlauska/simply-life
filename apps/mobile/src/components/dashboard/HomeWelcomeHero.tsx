import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text, Card, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { SyncHint } from '../SyncHint'

type Props = {
  greet: string
  name: string
  openTasks: number
  doneToday: number
  onMenu: () => void
}

/**
 * Hero do Início — organização limpa (ref wireframe mobile):
 * saudação + avatar, métricas em duas colunas, sem ruído.
 */
export function HomeWelcomeHero({
  greet,
  name,
  openTasks,
  doneToday,
  onMenu,
}: Props)
{
  const { colors, space, radius, elevation } = useTheme()

  return (
    <Card
      tone="elevated"
      style={{
        gap: space.lg,
        paddingVertical: space.lg,
        paddingHorizontal: space.lg,
        borderRadius: radius.sheet,
        borderWidth: 0,
        ...elevation.hero,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 999,
              backgroundColor: colors.axelMuted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text variant="section" color={colors.axel}>
              {name.slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="caption" muted>
              {greet}
            </Text>
            <Text variant="hero" numberOfLines={1} style={{ letterSpacing: -0.5 }}>
              {name}
            </Text>
            <SyncHint />
          </View>
        </View>
        <PressableScale
          onPress={onMenu}
          accessibilityLabel="Menu"
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.surface,
          }}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.inkMuted} />
        </PressableScale>
      </View>

      <View
        style={{
          flexDirection: 'row',
          gap: space.md,
          paddingTop: space.sm,
          borderTopWidth: 1,
          borderTopColor: colors.hairline,
        }}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="caption" muted>
            Em aberto
          </Text>
          <Text variant="hero" color={colors.tasks} style={{ letterSpacing: -0.4, fontSize: 28 }}>
            {String(openTasks).padStart(2, '0')}
          </Text>
        </View>
        <View style={{ width: 1, backgroundColor: colors.hairline }} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="caption" muted>
            Feitas hoje
          </Text>
          <Text variant="hero" color={colors.axel} style={{ letterSpacing: -0.4, fontSize: 28 }}>
            {String(doneToday).padStart(2, '0')}
          </Text>
        </View>
      </View>
    </Card>
  )
}
