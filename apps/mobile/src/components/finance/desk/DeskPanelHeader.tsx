import { View } from 'react-native'
import { Text } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { WebHoverable } from '../../dashboard/web/WebHoverable'
import { webStyle } from '../../dashboard/web/webStyle'

/** Título de bloco no computador: nome à esquerda, link (coral) à direita. */
export function DeskPanelHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
})
{
  const { colors } = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text variant="section" style={{ fontSize: 18, lineHeight: 26 }}>{title}</Text>
        {subtitle ? <Text variant="caption" muted>{subtitle}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <WebHoverable
          onPress={onAction}
          accessibilityLabel={actionLabel}
          style={(hovered) => webStyle({ paddingVertical: 4, cursor: 'pointer', opacity: hovered ? 0.8 : 1 })}
        >
          <Text variant="caption" style={{ color: colors.axel, fontFamily: 'Lexend_500Medium' }}>
            {actionLabel}
          </Text>
        </WebHoverable>
      ) : null}
    </View>
  )
}
