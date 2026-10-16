import { View } from 'react-native'
import { Icon } from '../../ui/Icon'
import { Text, IconBadge, StatusPill } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useWebDesk } from '../dashboard/web/webBox'
import { WEB_DISPLAY_FONT } from '../dashboard/web/webTypography'

type Props = {
  icon: keyof typeof Icon.glyphMap
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
  const desk = useWebDesk()

  // computador: número grande à esquerda, estado em texto (sem selo de 12px)
  if (desk)
  {
    return (
      <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
        <IconBadge name={icon} color={tint} size={48} iconSize={24} />
        <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
          <Text variant="caption" muted>{kicker}</Text>
          <Text style={{ fontFamily: WEB_DISPLAY_FONT, fontSize: 32, lineHeight: 40, color: colors.ink }}>
            {headline}
          </Text>
          <Text variant="caption" muted>
            {detail ? `${detail} · ` : ''}
            <Text variant="caption" color={pillColor}>{pillLabel}</Text>
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-start' }}>
      <IconBadge name={icon} color={tint} size={40} iconSize={20} />
      <View style={{ flex: 1, gap: 12, minWidth: 0 }}>
        <View style={{ gap: 4 }}>
          <Text variant="caption" muted>{kicker}</Text>
          <Text variant="hero" style={{ fontSize: 22, lineHeight: 30, letterSpacing: -0.4 }}>
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
