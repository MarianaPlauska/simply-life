import { View, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  hasReviewLater,
  minutesToLabel,
  stampReviewLater,
  stripTaskDisplayNotes,
  taskHasAccent,
  taskMarkColor,
  type MobileTask,
} from '@simply-life/shared'
import { Text, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { useKanbanListsStore } from '../../store/kanbanListsStore'
import { useTaskEvolveStore } from '../../store/taskEvolveStore'

type Props = {
  task: MobileTask
  onToggle: () => void
}

function timeRange(task: MobileTask): string
{
  if (task.horaMinutos == null) return 'Sem hora'
  const start = minutesToLabel(task.horaMinutos)
  const endMins = task.horaMinutos + Math.max(30, task.estimativaMinutos || 30)
  return `${start} – ${minutesToLabel(endMins % (24 * 60))}`
}

/** Card de tarefa no estilo agenda: horário | título | flag | checkbox. */
export function KanbanDayTaskCard({ task, onToggle }: Props)
{
  const { colors } = useTheme()
  const openEvolve = useTaskEvolveStore((s) => s.open)
  const patchTask = useDataStore((s) => s.patchTask)
  const isGuest = useAuthStore((s) => s.isGuest)
  const lists = useKanbanListsStore((s) => s.lists)
  const done = task.status === 'done'
  const later = hasReviewLater(task.anotacao)
  const accent = taskHasAccent(task)
  const mark = taskMarkColor(task, lists, colors.danger)
  const ink = accent ? colors.axelOnFill : colors.ink
  const muted = accent ? 'rgba(255,255,255,0.82)' : colors.inkMuted
  const bg = accent ? colors.axel : colors.elevated

  return (
    <Pressable
      onPress={() => openEvolve(task.id)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        paddingRight: 14,
        paddingLeft: 10,
        borderRadius: 20,
        backgroundColor: bg,
        minHeight: 72,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: 5,
          alignSelf: 'stretch',
          borderRadius: 999,
          backgroundColor: accent ? colors.axelOnFill : mark,
        }}
      />
      <View style={{ width: 72 }}>
        <Text variant="micro" style={{ color: muted, fontWeight: '600', lineHeight: 16 }}>
          {timeRange(task)}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Text
          variant="bodyStrong"
          numberOfLines={2}
          style={{
            color: ink,
            textDecorationLine: done ? 'line-through' : 'none',
            opacity: done && !later ? 0.65 : 1,
          }}
        >
          {task.titulo}
        </Text>
        {stripTaskDisplayNotes(task.anotacao) ? (
          <Text variant="caption" numberOfLines={1} style={{ color: muted }}>
            {stripTaskDisplayNotes(task.anotacao)}
          </Text>
        ) : null}
      </View>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={later ? 'Tirar ver depois' : 'Ver depois'}
        onPress={() =>
          void patchTask(task.id, { anotacao: stampReviewLater(task.anotacao, !later) }, isGuest)
        }
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: accent ? 'rgba(255,255,255,0.18)' : colors.canvas,
        }}
      >
        <Ionicons
          name={later ? 'flag' : 'flag-outline'}
          size={14}
          color={accent ? colors.axelOnFill : later ? colors.axel : colors.inkMuted}
        />
      </PressableScale>
      <PressableScale
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={done ? 'Devolver à lista' : 'Marcar como feita'}
        onPress={onToggle}
        style={{
          width: 26,
          height: 26,
          borderRadius: 8,
          borderWidth: done || accent ? 0 : 1.5,
          borderColor: colors.ink,
          backgroundColor: done ? colors.ink : accent ? colors.axelOnFill : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {done ? (
          <Ionicons name="checkmark" size={14} color={colors.canvas} />
        ) : accent ? (
          <Ionicons name="checkmark" size={14} color={colors.axel} />
        ) : null}
      </PressableScale>
    </Pressable>
  )
}
