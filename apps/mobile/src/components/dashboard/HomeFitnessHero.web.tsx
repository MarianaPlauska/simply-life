import { View } from 'react-native'
import { Icon } from '../../ui/Icon'
import { Text, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { SyncHint } from '../SyncHint'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useWorkspace } from '../../layout/useWorkspace'
import { HomeWeatherChip } from './HomeWeatherChip'
import { WEB_DISPLAY_FONT } from './web/webTypography'

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
        <View style={{ flex: 1, minWidth: 0, gap: space.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
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
              lineHeight: 36,
            }}
          >
            {title}
          </Text>
          {line ? (
            <Text variant="caption" muted numberOfLines={1} style={{ fontSize: 13, lineHeight: 19 }}>
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
            borderColor: colors.hairline,
          }}
        >
          <Icon
            name={isAdmin ? 'shield-checkmark' : 'person-outline'}
            size={16}
            color={isAdmin ? colors.axel : colors.ink}
          />
        </PressableScale>
      </View>
    )
  }

  // Celular: leitura de cima para baixo, alinhada à esquerda. Data pequena, saudação grande
  // e frase formam um grupo só (perto um do outro); a conta fica no canto, fora do grupo.
  return (
    <View style={{ paddingTop: topPad, gap: space.md, marginBottom: space.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.md }}>
        <View style={{ flex: 1, minWidth: 0, gap: space.xs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 }}>
            <Text variant="caption" muted numberOfLines={1} style={{ flexShrink: 1 }}>
              {dateLabel}
            </Text>
            <HomeWeatherChip compact />
          </View>
          <Text variant="title" numberOfLines={2}>
            {title}
          </Text>
          {line ? (
            <Text variant="body" muted numberOfLines={2}>
              {line}
            </Text>
          ) : null}
        </View>
        <PressableScale
          onPress={onAccount}
          accessibilityLabel={isAdmin ? 'Conta, administradora' : 'Conta'}
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isAdmin ? colors.axelMuted : colors.elevated,
            ...elevation.card,
          }}
        >
          <Icon
            name={isAdmin ? 'shield-checkmark' : 'person-outline'}
            size={18}
            color={isAdmin ? colors.axel : colors.ink}
          />
        </PressableScale>
      </View>
      <SyncHint />
    </View>
  )
}
