import { type ReactNode } from 'react'
import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { WebHoverable } from '../../dashboard/web/WebHoverable'
import { webStyle } from '../../dashboard/web/webStyle'
import { WEB_CARD_BORDER } from '../../dashboard/web/webPalette'

type Props = {
  label: string
  value?: string
  onPress?: () => void
  danger?: boolean
}

/** Linha de configuração densa — sem ícone em selo colorido, só texto. */
export function WebProfileRow({ label, value, onPress, danger }: Props)
{
  const { colors } = useTheme()

  return (
    <WebHoverable
      onPress={onPress}
      accessibilityLabel={label}
      style={(hovered) => webStyle({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: hovered && onPress ? colors.surface : 'transparent',
        cursor: onPress ? 'pointer' : 'default',
      })}
    >
      <Text variant="body" style={{ flex: 1, fontSize: 14, color: danger ? colors.danger : colors.ink }}>
        {label}
      </Text>
      {value ? (
        <Text variant="caption" muted numberOfLines={1} style={{ maxWidth: 220, textAlign: 'right' }}>
          {value}
        </Text>
      ) : null}
      {onPress ? <Ionicons name="chevron-forward" size={14} color={colors.inkFaint} /> : null}
    </WebHoverable>
  )
}

export function WebProfileSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
})
{
  const { colors } = useTheme()
  return (
    <View style={{ borderRadius: 14, backgroundColor: colors.elevated, borderWidth: 1, borderColor: WEB_CARD_BORDER, overflow: 'hidden' }}>
      <Text
        variant="micro"
        muted
        style={{
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          fontSize: 10,
          fontWeight: '700',
        }}
      >
        {title}
      </Text>
      <View>{children}</View>
    </View>
  )
}
