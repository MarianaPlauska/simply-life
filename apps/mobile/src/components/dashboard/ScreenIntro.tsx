import { View } from 'react-native'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { SyncHint } from '../SyncHint'

/** Título de tela - padrão mockup (tipografia, sem bloco colorido) */
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
    <View style={{ gap: space.sm }}>
      <Text variant="hero">
        {title}
      </Text>
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
