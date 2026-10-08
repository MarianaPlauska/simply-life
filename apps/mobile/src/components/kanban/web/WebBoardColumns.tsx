import { View } from 'react-native'
import { localTodayIso, minutesToLabel, type MobileTask } from '@simply-life/shared'
import { Text } from '../../../ui'
import { Icon } from '../../../ui/Icon'
import { useTheme } from '../../../theme/ThemeProvider'
import { useTaskEvolveStore } from '../../../store/taskEvolveStore'
import { WebHoverable } from '../../dashboard/web/WebHoverable'
import { webStyle } from '../../dashboard/web/webStyle'
import { LEX, useRowHover } from './kanbanWeb'

type Group = { id: string; label: string; tasks: MobileTask[] }

function shortDate(iso: string): string
{
  return new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '')
}

/** Cartão do quadro no computador: título, quando e prioridade numa caixa fina; mover é um botão, não toque longo. */
function BoardCard({ task, onToggle, onMove }: { task: MobileTask; onToggle: () => void; onMove: () => void })
{
  const { colors } = useTheme()
  const hoverBg = useRowHover()
  const openEvolve = useTaskEvolveStore((s) => s.open)
  const done = task.status === 'done'
  const today = localTodayIso()
  const due = task.dataVencimento?.slice(0, 10) ?? null
  const late = !!due && due < today && !done
  const when = [
    due ? (due === today ? 'Hoje' : shortDate(due)) : null,
    task.horaMinutos != null ? minutesToLabel(task.horaMinutos) : null,
  ].filter(Boolean).join(', ')
  const pri = task.prioridade === 1
    ? { label: 'Alta', color: colors.danger }
    : task.prioridade === 2
      ? { label: 'Média', color: colors.attention }
      : null

  return (
    <WebHoverable
      onPress={() => openEvolve(task.id)}
      style={(hovered) => webStyle({
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: hovered ? colors.hairlineStrong : colors.hairline,
        backgroundColor: colors.elevated,
        cursor: 'pointer',
      })}
    >
      {(hovered) => (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <WebHoverable
              onPress={onToggle}
              accessibilityLabel={done ? 'Reabrir' : 'Concluir'}
              style={(h) => webStyle({
                width: 18,
                height: 18,
                marginTop: 2,
                borderRadius: 5,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: done ? 0 : 1.5,
                borderColor: h ? colors.axel : colors.inkFaint,
                backgroundColor: done ? colors.axelFill : 'transparent',
                cursor: 'pointer',
              })}
            >
              {done ? <Icon name="checkmark" size={12} color={colors.axelOnFill} /> : null}
            </WebHoverable>
            <Text
              numberOfLines={3}
              style={[
                LEX.regular,
                {
                  flex: 1,
                  fontSize: 15,
                  lineHeight: 21,
                  color: done ? colors.inkMuted : colors.ink,
                  textDecorationLine: done ? 'line-through' : 'none',
                },
              ]}
            >
              {task.titulo}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 10, rowGap: 2, paddingLeft: 28 }}>
            {when ? (
              <Text numberOfLines={1} style={[LEX.regular, { fontSize: 13, lineHeight: 18, color: late ? colors.danger : colors.inkMuted }]}>{when}</Text>
            ) : null}
            {pri ? <Text style={[LEX.medium, { fontSize: 13, lineHeight: 18, color: pri.color }]}>{pri.label}</Text> : null}
            {task.progresso > 0 && task.progresso < 1 ? (
              <Text style={[LEX.regular, { fontSize: 13, lineHeight: 18, color: colors.inkMuted }]}>{Math.round(task.progresso * 100)}%</Text>
            ) : null}
          </View>
          <WebHoverable
            onPress={onMove}
            accessibilityLabel="Mover para outra coluna"
            style={(h) => webStyle({
              position: 'absolute',
              top: 8,
              right: 8,
              width: 26,
              height: 26,
              borderRadius: 6,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: h ? hoverBg : colors.elevated,
              opacity: hovered ? 1 : 0,
              cursor: 'pointer',
            })}
          >
            <Icon name="swap-horizontal" size={15} color={colors.inkMuted} />
          </WebHoverable>
        </>
      )}
    </WebHoverable>
  )
}

/**
 * Colunas do quadro no computador: todas à vista na largura (sem rolagem lateral),
 * cabeçalho com contagem e "+", coluna vazia com um aviso curto.
 */
export function WebBoardColumns({
  groups,
  onToggle,
  onMove,
  onAdd,
}: {
  groups: Group[]
  onToggle: (id: string) => void
  onMove: (id: string) => void
  onAdd: () => void
})
{
  const { colors } = useTheme()
  const hoverBg = useRowHover()

  return (
    <View
      style={webStyle({
        display: 'grid',
        gridTemplateColumns: `repeat(${groups.length}, minmax(0, 1fr))`,
        gap: 16,
        alignItems: 'start',
      })}
    >
      {groups.map((g) => (
        <View key={g.id} style={{ gap: 10, minWidth: 0 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingBottom: 8,
              borderBottomWidth: 2,
              borderBottomColor: g.id === 'vencido' && g.tasks.length > 0 ? colors.danger : colors.hairline,
            }}
          >
            <Text numberOfLines={1} style={[LEX.medium, { fontSize: 15, lineHeight: 22, color: colors.ink, flexShrink: 1 }]}>
              {g.label}
            </Text>
            <Text style={[LEX.regular, { fontSize: 14, lineHeight: 20, color: colors.inkFaint }]}>{g.tasks.length}</Text>
            <View style={{ flex: 1 }} />
            <WebHoverable
              onPress={onAdd}
              accessibilityLabel={`Nova tarefa em ${g.label}`}
              style={(h) => webStyle({
                width: 28,
                height: 28,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: h ? hoverBg : 'transparent',
                cursor: 'pointer',
              })}
            >
              <Icon name="add" size={16} color={colors.inkMuted} />
            </WebHoverable>
          </View>
          {g.tasks.map((t) => (
            <BoardCard key={t.id} task={t} onToggle={() => onToggle(t.id)} onMove={() => onMove(t.id)} />
          ))}
          {g.tasks.length === 0 ? (
            <View
              style={webStyle({
                height: 64,
                borderRadius: 10,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: colors.hairlineStrong,
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <Text style={[LEX.regular, { fontSize: 14, lineHeight: 20, color: colors.inkFaint }]}>Nada aqui</Text>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  )
}
