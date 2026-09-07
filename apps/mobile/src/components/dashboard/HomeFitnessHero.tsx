import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { SyncHint } from '../SyncHint'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useWorkspace } from '../../layout/useWorkspace'
import { HomeWeatherChip } from './HomeWeatherChip'

type Props = {
  greet: string
  name: string
  dateLabel: string
  onAccount: () => void
  isAdmin?: boolean
  line?: string
}

const SIDE = 40

export function HomeFitnessHero({
  greet,
  name,
  dateLabel,
  onAccount,
  isAdmin = false,
  line = 'O essencial do seu dia, com calma.',
}: Props)
{
  const { colors, space, elevation } = useTheme()
  const { showRail } = useWorkspace()
  const insets = useSafeAreaInsets()
  const topPad = showRail ? 0 : Math.max(insets.top - 4, 0)
  const title = name ? `${greet}, ${name}` : greet

  return (
    <View style={{ paddingTop: topPad, gap: space.md, marginBottom: space.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: SIDE }} />
        <View style={{ flex: 1, alignItems: 'center', gap: 4, minWidth: 0, paddingHorizontal: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Text variant="caption" muted style={{ textAlign: 'center' }} numberOfLines={1}>
              {dateLabel}
            </Text>
            <HomeWeatherChip compact />
          </View>
          <Text
            variant="hero"
            numberOfLines={1}
            style={{
              fontSize: 22,
              letterSpacing: -0.6,
              lineHeight: 26,
              textAlign: 'center',
              width: '100%',
            }}
          >
            {title}
          </Text>
          {line ? (
            <Text
              variant="caption"
              muted
              numberOfLines={2}
              style={{ textAlign: 'center', fontSize: 12, lineHeight: 16 }}
            >
              {line}
            </Text>
          ) : null}
        </View>
        <PressableScale
          onPress={onAccount}
          accessibilityLabel={isAdmin ? 'Conta, administradora' : 'Conta'}
          style={{
            width: SIDE,
            height: SIDE,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isAdmin ? colors.axelMuted : colors.elevated,
            ...elevation.card,
          }}
        >
          <Ionicons
            name={isAdmin ? 'shield-checkmark' : 'person-outline'}
            size={16}
            color={isAdmin ? colors.axel : colors.ink}
          />
        </PressableScale>
      </View>
      {!showRail ? <SyncHint /> : null}
    </View>
  )
}
