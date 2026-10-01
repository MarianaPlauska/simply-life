import { View } from 'react-native'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { SyncHint } from '../SyncHint'
import { useWorkspace } from '../../layout/useWorkspace'
import { WEB_DISPLAY_FONT } from './web/webTypography'

/**
 * Título de tela — build web. Só troca a fonte do título para a serifada
 * quando há espaço de desktop (showRail); em largura estreita (o mesmo
 * corte usado pelo app nativo) fica idêntico ao ScreenIntro.tsx original,
 * porque isso é o que roda quando alguém abre a build web num celular.
 */
export function ScreenIntro({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
})
{
  const { space } = useTheme()
  const { showRail } = useWorkspace()

  return (
    <View style={{ gap: space.sm }}>
      {showRail ? (
        <Text style={{ fontFamily: WEB_DISPLAY_FONT, fontSize: 30, lineHeight: 38, letterSpacing: -0.4 }}>
          {title}
        </Text>
      ) : (
        <Text variant="hero">
          {title}
        </Text>
      )}
      {subtitle ? (
        <Text variant="body" muted style={{ maxWidth: 600 }}>
          {subtitle}
        </Text>
      ) : null}
      <View style={{ marginTop: space.xs }}>
        <SyncHint />
      </View>
    </View>
  )
}
