import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { SyncHint } from '../SyncHint'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useWorkspace } from '../../layout/useWorkspace'
import { HomeWeatherChip } from './HomeWeatherChip'
import { WEB_DISPLAY_FONT } from './web/webTypography'
import { WEB_CARD_BORDER } from './web/webPalette'

type Props = {
  greet: string
  name: string
  dateLabel: string
  onAccount: () => void
  isAdmin?: boolean
  line?: string
}

const SIDE = 40

/**
 * Saudação da Home — build web. Mesmo componente, só troca a fonte da
 * saudação para a serifada da regra tipográfica web. App nativo usa
 * HomeFitnessHero.tsx sem alteração.
 */
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

  if (showRail)
  {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: space.md,
          marginBottom: space.xs,
        }}
      >
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text variant="caption" muted numberOfLines={1}>
              {dateLabel}
            </Text>
            <HomeWeatherChip compact />
          </View>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: WEB_DISPLAY_FONT,
              color: colors.ink,
              fontSize: 28,
              letterSpacing: -0.4,
              lineHeight: 32,
            }}
          >
            {title}
          </Text>
          {line ? (
            <Text variant="caption" muted numberOfLines={1} style={{ fontSize: 13, lineHeight: 18 }}>
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
            borderWidth: 1,
            borderColor: WEB_CARD_BORDER,
          }}
        >
          <Ionicons
            name={isAdmin ? 'shield-checkmark' : 'person-outline'}
            size={16}
            color={isAdmin ? colors.axel : colors.ink}
          />
        </PressableScale>
      </View>
    )
  }

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
