import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { WebHoverable } from '../../dashboard/web/WebHoverable'
import { webStyle } from '../../dashboard/web/webStyle'

export type WebKanbanRowProps = {
  time?: string
  title: string
  meta?: string
  tagLabel?: string
  tagColor?: string
  urgent?: boolean
  done?: boolean
  onPress?: () => void
  onToggle?: () => void
}

/** Linha densa única para tarefas e contas na Lista web — sem cartão colorido por item. */
export function WebKanbanRow({
  time,
  title,
  meta,
  tagLabel,
  tagColor,
  urgent,
  done,
  onPress,
  onToggle,
}: WebKanbanRowProps)
{
  const { colors } = useTheme()

  return (
    <WebHoverable
      onPress={onPress}
      style={(hovered) => webStyle({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: hovered ? colors.surface : 'transparent',
        cursor: onPress ? 'pointer' : 'default',
      })}
    >
      {onToggle ? (
        <WebHoverable
          onPress={onToggle}
          accessibilityLabel={done ? 'Reabrir' : 'Concluir'}
          style={webStyle({
            width: 18,
            height: 18,
            borderRadius: 5,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: done ? 0 : 1.5,
            borderColor: colors.inkMuted,
            backgroundColor: done ? colors.axel : 'transparent',
            cursor: 'pointer',
          })}
        >
          {done ? <Ionicons name="checkmark" size={12} color="#FFFFFF" /> : null}
        </WebHoverable>
      ) : null}

      {time ? (
        <Text variant="caption" style={{ width: 76, color: colors.inkMuted, fontSize: 12 }} numberOfLines={1}>
          {time}
        </Text>
      ) : null}

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          variant="bodyStrong"
          numberOfLines={1}
          style={{
            fontSize: 14,
            textDecorationLine: done ? 'line-through' : 'none',
            opacity: done ? 0.5 : 1,
          }}
        >
          {title}
        </Text>
        {meta ? (
          <Text variant="caption" muted numberOfLines={1} style={{ fontSize: 12, color: urgent ? colors.axel : undefined }}>
            {meta}
          </Text>
        ) : null}
      </View>

      {tagLabel ? (
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 999,
            backgroundColor: tagColor ? `${tagColor}22` : colors.hairline,
          }}
        >
          <Text variant="micro" style={{ color: tagColor ?? colors.inkMuted, fontWeight: '700' }}>
            {tagLabel}
          </Text>
        </View>
      ) : null}
    </WebHoverable>
  )
}
