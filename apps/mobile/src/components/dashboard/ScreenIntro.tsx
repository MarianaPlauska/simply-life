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
      <Text variant="section" style={{ fontSize: 28, lineHeight: 34 }}>
          {title}
        </Text>
      {subtitle ? (
        <Text variant="caption" muted style={{ maxWidth: 600 }}>
          {subtitle}
        </Text>
      ) : null}
      <SyncHint />
    </View>
  )
}
