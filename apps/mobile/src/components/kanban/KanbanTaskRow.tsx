import { View, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  minutesToLabel,
  inferLifeCategory,
  taskMarkColor,
  taskProgressPct,
  type MobileTask,
} from '@simply-life/shared'
import { Text, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { MetricTrack } from '../metrics/MetricTrack'
import { useKanbanListsStore } from '../../store/kanbanListsStore'
import { useTaskEvolveStore } from '../../store/taskEvolveStore'

const CAT_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
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
  const { colors, mode } = useTheme()
  const openEvolve = useTaskEvolveStore((s) => s.open)
  const lists = useKanbanListsStore((s) => s.lists)
  const done = task.status === 'done'
  const cat = inferLifeCategory(task)
  const accent = taskMarkColor(task, lists, colors.danger)
  const icon = CAT_ICON[cat] ?? 'checkbox-outline'
  const detail =
    task.horaMinutos != null
      ? minutesToLabel(task.horaMinutos)
      : task.dataVencimento ?? undefined
  const cardBg = mode === 'dark' ? 'rgba(28, 28, 30, 0.55)' : 'rgba(255, 255, 255, 0.78)'

  return (
    <Pressable
      onPress={() => openEvolve(task.id)}
      onLongPress={onLongPress}
      delayLongPress={380}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        paddingRight: 14,
        paddingLeft: 10,
        borderRadius: 22,
        backgroundColor: cardBg,
        minHeight: 64,
        overflow: 'hidden',
      }}
    >
      <View
        accessibilityLabel={task.prioridade === 1 ? 'Urgente' : 'Cor da pasta'}
        style={{
          width: 5,
          alignSelf: 'stretch',
          borderRadius: 999,
          backgroundColor: accent,
        }}
      />
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 999,
          backgroundColor: `${accent}26`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
        <Text
          variant="bodyStrong"
          numberOfLines={2}
          style={{
            fontSize: 15,
            textDecorationLine: done ? 'line-through' : 'none',
            opacity: done ? 0.5 : 1,
          }}
        >
          {task.titulo}
        </Text>
        {detail ? (
          <Text variant="caption" muted numberOfLines={1} style={{ fontSize: 12 }}>
            {detail}
          </Text>
        ) : null}
        <MetricTrack
          pct={taskProgressPct(task)}
          currentLabel={`${taskProgressPct(task)}%`}
          targetLabel={done ? 'Feito' : 'Meta'}
          fill={accent}
        />
      </View>
      <PressableScale
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={done ? 'Devolver à lista' : 'Marcar como feita'}
        onPress={onToggle}
        style={{
          width: 26,
          height: 26,
          borderRadius: 999,
          borderWidth: done ? 0 : 1.5,
          borderColor: colors.ink,
          backgroundColor: done ? colors.ink : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {done ? <Ionicons name="checkmark" size={14} color={colors.canvas} /> : null}
      </PressableScale>
    </Pressable>
  )
}
