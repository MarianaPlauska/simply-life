import { type ReactNode } from 'react'
import { View } from 'react-native'
import { Text } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { WebHoverable } from '../../dashboard/web/WebHoverable'
import { webStyle } from '../../dashboard/web/webStyle'

type Props = {
  title: string
  subtitle?: string
  /** texto à direita (ex.: média), sem ação */
  aside?: ReactNode
  /** link à direita, em coral */
  action?: { label: string; onPress: () => void }
}

/** Cabeçalho de bloco da Saúde no computador: mesmo título e mesmo link em todas as células. */
export function DeskBlockHeader({ title, subtitle, aside, action }: Props)
{
  const { colors } = useTheme()
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Text variant="section" style={{ fontSize: 18, lineHeight: 26 }}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" muted>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {aside}
      {action ? (
        <WebHoverable onPress={action.onPress} style={webStyle({ cursor: 'pointer', paddingTop: 4 })}>
          {(hovered) => (
            <Text variant="caption" style={{ color: colors.axel, textDecorationLine: hovered ? 'underline' : 'none' }}>
              {action.label}
            </Text>
          )}
        </WebHoverable>
      ) : null}
    </View>
  )
}
