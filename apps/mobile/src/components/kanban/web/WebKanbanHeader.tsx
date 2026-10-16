import { type ReactNode } from 'react'
import { View } from 'react-native'
import { Icon } from '../../../ui/Icon'
import { Text } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { useCaptureStore } from '../../../store/captureStore'
import { SyncHint } from '../../SyncHint'
import { WebHoverable } from '../../dashboard/web/WebHoverable'
import { webStyle } from '../../dashboard/web/webStyle'
import { WEB_DISPLAY_FONT } from '../../dashboard/web/webTypography'
import { LEX } from './kanbanWeb'

/** Cabeçalho da página no computador: título à esquerda, criar tarefa à direita (nada de botão redondo flutuante). */
export function WebKanbanHeader({ actions }: { actions?: ReactNode })
{
  const { colors } = useTheme()
  const openCapture = useCaptureStore((s) => s.openCapture)

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 16 }}>
      <View style={{ flex: 1, minWidth: 240, gap: 4 }}>
        <Text style={{ fontFamily: WEB_DISPLAY_FONT, fontSize: 34, lineHeight: 42, color: colors.ink }}>Tarefas</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <Text style={[LEX.regular, { fontSize: 15, lineHeight: 22, color: colors.inkMuted }]}>
            Uma coisa de cada vez, no seu ritmo.
          </Text>
          <SyncHint />
        </View>
      </View>
      {/* ações do quadro ao lado do botão de criar: a barra de abas fica só com as abas */}
      {actions ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>{actions}</View> : null}
      <WebHoverable
        onPress={() => openCapture('task', null, { studio: true })}
        accessibilityLabel="Nova tarefa"
        style={(hovered) => webStyle({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          height: 40,
          paddingHorizontal: 16,
          borderRadius: 10,
          backgroundColor: colors.axelFill,
          opacity: hovered ? 0.9 : 1,
          cursor: 'pointer',
        })}
      >
        <Icon name="add" size={18} color={colors.axelOnFill} />
        <Text style={[LEX.medium, { fontSize: 15, lineHeight: 20, color: colors.axelOnFill }]}>Nova tarefa</Text>
      </WebHoverable>
    </View>
  )
}
