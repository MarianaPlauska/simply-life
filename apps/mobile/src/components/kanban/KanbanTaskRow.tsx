import { View, Pressable, StyleSheet } from 'react-native'
import { Icon } from '../../ui/Icon'
import {
  minutesToLabel,
  inferLifeCategory,
  taskMarkColor,
  taskProgressPct,
  type MobileTask,
} from '@simply-life/shared'
import { Text, PressableScale, SwipeRow } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useKanbanListsStore } from '../../store/kanbanListsStore'
import { useTaskEvolveStore } from '../../store/taskEvolveStore'
import { TaskWaitBadge } from './TaskWaitPanel'

const CAT_ICON: Record<string, keyof typeof Icon.glyphMap> = {
  importante: 'flag-outline',
  saude: 'heart-outline',
  crescimento: 'book-outline',
  carreira: 'briefcase-outline',
}

type Props = {
  task: MobileTask
  onToggle: () => void
  onLongPress?: () => void
}

/** Linha de tarefa: ícone, título, checkbox — sem caixa extra. */
export function KanbanTaskRow({ task, onToggle, onLongPress }: Props)
{
  const { colors, chart } = useTheme()
  const openEvolve = useTaskEvolveStore((s) => s.open)
  const lists = useKanbanListsStore((s) => s.lists)
  const done = task.status === 'done'
  const cat = inferLifeCategory(task)
  const accent = taskMarkColor(task, lists, colors.danger, chart)
  const icon = CAT_ICON[cat] ?? 'checkbox-outline'
  const detail =
    task.horaMinutos != null
      ? minutesToLabel(task.horaMinutos)
      : task.dataVencimento ?? undefined

  return (
    <SwipeRow left={{ label: done ? 'Reabrir' : 'Feita', icon: 'checkmark', color: colors.health, onPress: onToggle }}>
      <Pressable
        onPress={() => openEvolve(task.id)}
        onLongPress={onLongPress}
        delayLongPress={380}
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
            borderColor: accent,
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
              fontWeight: '500',
              color: done ? colors.inkMuted : colors.ink,
              textDecorationLine: done ? 'line-through' : 'none',
            }}
          >
            {task.titulo}
          </Text>
          {detail ? (
            <Text variant='caption' muted numberOfLines={1}>
              {detail}
            </Text>
          ) : null}
          <TaskWaitBadge task={task} />
        </View>
        <Icon name={icon} size={18} color={colors.inkFaint} />
      </Pressable>
    </SwipeRow>
  )
}
