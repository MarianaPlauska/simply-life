import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text, IconBadge, StatusPill } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  icon: keyof typeof Ionicons.glyphMap
  iconColor?: string
  kicker: string
  headline: string
  detail?: string
  pillLabel: string
  pillColor: string
}

/** Cabeçalho de painel Cuidados — integrado na tela, sem Card. */
export function HealthPanelHero({
  icon,
  iconColor,
  kicker,
  headline,
  detail,
  pillLabel,
  pillColor,
}: Props)
{
  const { colors, space } = useTheme()
  const tint = iconColor ?? colors.health

  return (
    <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-start' }}>
      <IconBadge name={icon} color={tint} size={40} iconSize={20} />
      <View style={{ flex: 1, gap: 8, minWidth: 0 }}>
        <View style={{ gap: 2 }}>
          <Text variant="caption" muted>{kicker}</Text>
          <Text variant="hero" style={{ fontSize: 28, letterSpacing: -0.8 }}>
            {headline}
          </Text>
          {detail ? (
            <Text variant="caption" muted>
              {detail}
            </Text>
          ) : null}
        </View>
        <StatusPill label={pillLabel} color={pillColor} />
      </View>
    </View>
  )
}
