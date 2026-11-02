import { View } from 'react-native'
import { Icon } from '../../ui/Icon'
import { Text, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { SyncHint } from '../SyncHint'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useWorkspace } from '../../layout/useWorkspace'
import { HomeWeatherChip } from './HomeWeatherChip'
import { CircleCornerButton } from '../social/CircleCornerButton'
import { ProfileAvatarBadge } from '../social/ProfileAvatarBadge'
import { HomeXpBar } from '../play/HomeXpBar'
import { HomePlay } from '../play/HomePlay'
import { HomeSearchButton } from './HomeSearchButton'

type Props = {
  greet: string
  name: string
  dateLabel: string
  onAccount: () => void
  isAdmin?: boolean
}

const SIDE = 40

export function HomeFitnessHero({
  greet,
  name,
  dateLabel,
  onAccount,
  isAdmin = false,
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
        <View style={{ flex: 1, minWidth: 0, gap: space.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text variant="caption" muted numberOfLines={1}>
              {dateLabel}
            </Text>
            <HomeWeatherChip compact />
          </View>
          <Text
            variant="hero"
            numberOfLines={1}
            style={{ fontSize: 26, letterSpacing: -0.5, lineHeight: 34 }}
          >
            {title}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <HomeXpBar />
        <HomePlay />
        <HomeSearchButton />
        <CircleCornerButton size={SIDE} />
        <PressableScale
          onPress={onAccount}
          accessibilityLabel={isAdmin ? 'Conta, administradora' : 'Conta'}
          style={{
            width: SIDE,
            height: SIDE,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.elevated,
            ...elevation.card,
          }}
        >
          <ProfileAvatarBadge size={SIDE} />
          {isAdmin ? (
            <View
              style={{
                position: 'absolute',
                right: -2,
                bottom: -2,
                width: 18,
                height: 18,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.axelFill,
                borderWidth: 2,
                borderColor: colors.canvas,
              }}
            >
              <Icon name="shield-checkmark" size={10} color={colors.axelOnFill} />
            </View>
          ) : null}
        </PressableScale>
        </View>
      </View>
    )
  }

  // Celular: leitura de cima para baixo, alinhada à esquerda. Data pequena e saudação
  // formam um grupo só; a conta fica no canto, fora do grupo.
  return (
    <View style={{ paddingTop: topPad, gap: space.sm, marginBottom: space.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 }}>
          <Text variant="caption" muted numberOfLines={1} style={{ flexShrink: 1 }}>
            {dateLabel}
          </Text>
          <HomeWeatherChip compact />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <HomePlay />
        <HomeSearchButton />
        <CircleCornerButton />
        <PressableScale
          onPress={onAccount}
          accessibilityLabel={isAdmin ? 'Conta, administradora' : 'Conta'}
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.elevated,
            ...elevation.card,
          }}
        >
          <ProfileAvatarBadge size={44} />
          {isAdmin ? (
            <View
              style={{
                position: 'absolute',
                right: -2,
                bottom: -2,
                width: 18,
                height: 18,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.axelFill,
                borderWidth: 2,
                borderColor: colors.canvas,
              }}
            >
              <Icon name="shield-checkmark" size={10} color={colors.axelOnFill} />
            </View>
          ) : null}
        </PressableScale>
        </View>
      </View>
      <Text variant="section" numberOfLines={2} style={{ fontSize: 24, lineHeight: 30 }}>
        {title}
      </Text>
      <View style={{ maxWidth: 220 }}>
        <HomeXpBar />
      </View>
      <SyncHint />
    </View>
  )
}
