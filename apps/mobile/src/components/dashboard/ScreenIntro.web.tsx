import { View } from 'react-native'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { SyncHint } from '../SyncHint'
import { WEB_DISPLAY_FONT } from './web/webTypography'

/**
 * Título de tela — build web. Mesmo componente de sempre, só troca a fonte
 * do título para a serifada usada nos números do dashboard web (regra única
 * de tipografia, não uma exceção isolada). App nativo usa ScreenIntro.tsx.
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

  return (
    <View style={{ gap: 4 }}>
      <Text style={{ fontFamily: WEB_DISPLAY_FONT, fontSize: 30, letterSpacing: -0.4 }}>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="body" muted style={{ marginTop: 2 }}>
          {subtitle}
        </Text>
      ) : null}
      <View style={{ marginTop: space.xs }}>
        <SyncHint />
      </View>
    </View>
  )
}
