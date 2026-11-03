import { View, Pressable, StyleSheet } from 'react-native'
import { Icon } from '../../ui/Icon'
import {
  hasReviewLater,
  minutesToLabel,
  stampReviewLater,
  stripTaskDisplayNotes,
  taskHasAccent,
  taskMarkColor,
  type MobileTask,
} from '@simply-life/shared'
import { Text, PressableScale, SwipeRow } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { useKanbanListsStore } from '../../store/kanbanListsStore'
import { useTaskEvolveStore } from '../../store/taskEvolveStore'
import { TaskWaitBadge } from './TaskWaitPanel'

type Props = {
  task: MobileTask
  onToggle: () => void
}

function timeRange(task: MobileTask): string
{
  if (task.horaMinutos == null) return 'Sem hora'
  const start = minutesToLabel(task.horaMinutos)
  const endMins = task.horaMinutos + Math.max(30, task.estimativaMinutos || 30)
  return `${start} às ${minutesToLabel(endMins % (24 * 60))}`
}

/** Linha de tarefa, como num app nativo: caixinha | título e hora | marcar para depois. Desliza para concluir. */
export function KanbanDayTaskCard({ task, onToggle }: Props)
{
  const { colors, chart } = useTheme()
  const openEvolve = useTaskEvolveStore((s) => s.open)
  const patchTask = useDataStore((s) => s.patchTask)
  const isGuest = useAuthStore((s) => s.isGuest)
  const lists = useKanbanListsStore((s) => s.lists)
  const done = task.status === 'done'
  const later = hasReviewLater(task.anotacao)
  const accent = taskHasAccent(task)
  const mark = taskMarkColor(task, lists, colors.danger, chart)
  const notes = stripTaskDisplayNotes(task.anotacao)
  const meta = [task.horaMinutos != null ? timeRange(task) : null, notes || null].filter(Boolean).join(' · ')

  return (
    <SwipeRow left={{ label: done ? 'Reabrir' : 'Feita', icon: 'checkmark', color: colors.health, onPress: onToggle }}>
      <Pressable
        onPress={() => openEvolve(task.id)}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          minHeight: 60,
          paddingVertical: 10,
          backgroundColor: pressed ? colors.fill : 'transparent',
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.hairline,
        })}
      >
        <PressableScale
          accessibilityRole='checkbox'
          accessibilityState={{ checked: done }}
          accessibilityLabel={done ? 'Devolver à lista' : 'Marcar como feita'}
          onPress={onToggle}
          hitSlop={10}
          style={{
            width: 24,
            height: 24,
            borderRadius: 999,
            borderWidth: done ? 0 : 2,
            borderColor: accent ? colors.axelFill : mark,
            backgroundColor: done ? colors.health : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {done ? <Icon name='checkmark' size={14} color={colors.canvas} /> : null}
        </PressableScale>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text
            variant='body'
            numberOfLines={2}
            style={{
              fontWeight: accent ? '700' : '500',
              color: done ? colors.inkMuted : colors.ink,
              textDecorationLine: done ? 'line-through' : 'none',
            }}
          >
            {task.titulo}
          </Text>
          {meta ? (
            <Text variant='caption' muted numberOfLines={1}>
              {meta}
            </Text>
          ) : null}
          <TaskWaitBadge task={task} />
        </View>
        <PressableScale
          accessibilityRole='button'
          accessibilityLabel={later ? 'Tirar ver depois' : 'Ver depois'}
          onPress={() =>
            void patchTask(task.id, { anotacao: stampReviewLater(task.anotacao, !later) }, isGuest)
          }
          hitSlop={10}
          style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name={later ? 'flag' : 'flag-outline'} size={18} color={later ? colors.axel : colors.inkFaint} />
        </PressableScale>
      </Pressable>
    </SwipeRow>
  )
}
