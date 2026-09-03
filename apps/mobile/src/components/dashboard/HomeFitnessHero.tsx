import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Text, Card, PrimaryButton, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { SyncHint } from '../SyncHint'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useWorkspace } from '../../layout/useWorkspace'

type Props = {
  greet: string
  name: string
  focusTitle: string | null
  onMenu: () => void
}

export function HomeFitnessHero({
  greet,
  name,
  focusTitle,
  onMenu,
}: Props)
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const { showRail } = useWorkspace()
  const insets = useSafeAreaInsets()
  const topPad = showRail ? 0 : Math.max(insets.top - 4, 0)

  return (
    <View style={{ paddingTop: topPad, gap: space.lg, marginBottom: space.sm }}>
      <Card
        tone="elevated"
        style={{
          borderRadius: 24,
          gap: space.md,
          borderWidth: 0,
          padding: space.lg,
          backgroundColor: colors.surface,
          shadowColor: colors.ink,
          shadowOpacity: 0.08,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 3,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="caption" muted style={{ fontWeight: '700', letterSpacing: 0.3 }}>
            {greet}
          </Text>
          <PressableScale
            onPress={onMenu}
            accessibilityLabel="Menu"
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.hairline,
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={16} color={colors.ink} />
          </PressableScale>
        </View>

        <View style={{ gap: 6 }}>
          <Text variant="hero" style={{ fontSize: 32, letterSpacing: -1, lineHeight: 36 }}>
            {name}
          </Text>
          <Text variant="body" muted numberOfLines={2} style={{ fontSize: 15, lineHeight: 22 }}>
            {focusTitle
              ? `Foco de hoje: ${focusTitle}`
              : 'Nada urgente. Escolha um cuidado ou capture um gasto.'}
          </Text>
        </View>

        <PrimaryButton
          label={focusTitle ? 'Começar foco' : 'Abrir tarefas'}
          onPress={() => router.push(focusTitle ? '/foco' : '/(tabs)/kanban')}
          style={{ borderRadius: 16, minHeight: 52 }}
        />

        {!showRail ? <SyncHint /> : null}
      </Card>
    </View>
  )
}
