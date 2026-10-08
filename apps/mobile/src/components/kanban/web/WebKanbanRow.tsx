import { View } from 'react-native'
import { Icon, type IconName } from '../../../ui/Icon'
import { Text } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { WebHoverable } from '../../dashboard/web/WebHoverable'
import { webStyle } from '../../dashboard/web/webStyle'
import { LEX, useRowHover } from './kanbanWeb'

export type WebRowTag = { label: string; color?: string }

export type WebKanbanRowProps = {
  time?: string
  title: string
  meta?: string
  /** marcadores à direita (prioridade, prazo, valor) em texto colorido, sem pílula */
  tags?: WebRowTag[]
  urgent?: boolean
  done?: boolean
  /** ícone no lugar da caixinha (contas não se concluem com um clique) */
  leadIcon?: IconName
  /** ação explícita no fim da linha (ex.: marcar conta paga) */
  action?: { label: string; onPress: () => void }
  onPress?: () => void
  onToggle?: () => void
  /** reserva a coluna de horário mesmo sem hora, para alinhar a lista */
  timeColumn?: boolean
}

/** Linha densa única para tarefas e contas na web: uma linha de leitura, sem cartão por item. */
export function WebKanbanRow({
  time,
  title,
  meta,
  tags,
  urgent,
  done,
  leadIcon,
  action,
  onPress,
  onToggle,
  timeColumn,
}: WebKanbanRowProps)
{
  const { colors } = useTheme()
  const hoverBg = useRowHover()

  return (
    <WebHoverable
      onPress={onPress}
      style={(hovered) => webStyle({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: 20,
        paddingVertical: 11,
        minHeight: 48,
        backgroundColor: hovered && onPress ? hoverBg : 'transparent',
        cursor: onPress ? 'pointer' : 'default',
        transitionProperty: 'background-color',
        transitionDuration: '120ms',
      })}
    >
      {onToggle ? (
        <WebHoverable
          onPress={onToggle}
          accessibilityLabel={done ? 'Reabrir' : 'Concluir'}
          style={(hovered) => webStyle({
            width: 20,
            height: 20,
            borderRadius: 6,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: done ? 0 : 1.5,
            borderColor: hovered ? colors.axel : urgent ? colors.danger : colors.inkFaint,
            backgroundColor: done ? colors.axelFill : 'transparent',
            cursor: 'pointer',
          })}
        >
          {(hovered) =>
            done ? (
              <Icon name="checkmark" size={13} color={colors.axelOnFill} />
            ) : hovered ? (
              <Icon name="checkmark" size={12} color={colors.axel} />
            ) : null}
        </WebHoverable>
      ) : (
        <View style={{ width: 20, alignItems: 'center' }}>
          {leadIcon ? <Icon name={leadIcon} size={17} color={urgent ? colors.danger : colors.inkMuted} /> : null}
        </View>
      )}

      {time || timeColumn ? (
        <Text
          numberOfLines={1}
          style={[LEX.regular, { width: 48, fontSize: 14, lineHeight: 20, color: colors.inkMuted, fontVariant: ['tabular-nums'] }]}
        >
          {time ?? ''}
        </Text>
      ) : null}

      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text
          numberOfLines={1}
          style={[
            LEX.regular,
            {
              fontSize: 15,
              lineHeight: 22,
              color: done ? colors.inkMuted : colors.ink,
              textDecorationLine: done ? 'line-through' : 'none',
            },
          ]}
        >
          {title}
        </Text>
        {meta ? (
          <Text
            numberOfLines={1}
            style={[LEX.regular, { fontSize: 13, lineHeight: 18, color: urgent ? colors.danger : colors.inkMuted }]}
          >
            {meta}
          </Text>
        ) : null}
      </View>

      {tags?.length ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          {tags.map((t) => (
            <Text
              key={t.label}
              numberOfLines={1}
              style={[LEX.medium, { fontSize: 13, lineHeight: 18, color: t.color ?? colors.inkMuted }]}
            >
              {t.label}
            </Text>
          ))}
        </View>
      ) : null}

      {action ? (
        <WebHoverable
          onPress={action.onPress}
          accessibilityLabel={action.label}
          style={(hovered) => webStyle({
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: hovered ? colors.axel : colors.hairline,
            cursor: 'pointer',
          })}
        >
          <Text style={[LEX.medium, { fontSize: 13, lineHeight: 18, color: colors.axel }]}>{action.label}</Text>
        </WebHoverable>
      ) : null}
    </WebHoverable>
  )
}
