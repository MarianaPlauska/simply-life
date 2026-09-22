import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  dayCount,
  habitAccent,
  habitHeatmap,
  habitMetOn,
  winStreak,
  type RoutineHabit,
  type RoutineLogs,
} from '@simply-life/shared'
import { Text, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { HabitHeatmap } from './HabitHeatmap'

type Props = {
  habit: RoutineHabit
  logs: RoutineLogs
  iso: string
  items?: RoutineHabit[]
  nested?: boolean
  isGroupHeader?: boolean
  childCount?: number
  expanded?: boolean
  checked?: boolean
  locked?: boolean
  lockHint?: string
  onToggle: () => void
  onEdit?: () => void
  onDelete?: () => void
  onExpand?: () => void
}

function checkLabel(
  habit: RoutineHabit,
  done: boolean,
  isGroupHeader: boolean,
  count: number,
): string
{
  if (done) return 'Feito'
  if (isGroupHeader || habit.isGroup) return 'Marcar todos'
  if (habit.cadence === 'daily' && habit.dailyTarget > 1)
  {
    return `${count}/${habit.dailyTarget}`
  }
  return 'Marcar'
}

/** Card de rotina constante: check, sequência e quadriculado colorido. */
export function RoutineHabitCard({
  habit,
  logs,
  iso,
  items = [],
  nested,
  isGroupHeader,
  childCount = 0,
  expanded,
  checked,
  locked,
  lockHint,
  onToggle,
  onEdit,
  onDelete,
  onExpand,
}: Props)
{
  const { colors } = useTheme()
  const done = checked ?? habitMetOn(habit, logs, iso)
  const count = dayCount(logs, habit.id, iso)
  const accent = habitAccent(habit.id)
  const streak = winStreak(habit, logs, new Date(), items)
  const cells = habitHeatmap(habit, logs, 28, new Date(), items)
  const groupHeader = isGroupHeader || habit.isGroup
  const multiDaily = habit.cadence === 'daily' && habit.dailyTarget > 1
  const markLabel = locked
    ? (lockHint ?? 'Bloqueado')
    : checkLabel(habit, done, groupHeader, count)
  const partial = !locked && multiDaily && count > 0 && !done
  const checkDisabled = locked && !done

  return (
    <View
      style={{
        padding: 14,
        borderRadius: 20,
        backgroundColor: colors.elevated,
        gap: 12,
        borderWidth: nested || groupHeader ? 1 : 0,
        borderColor: colors.hairline,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
          {habit.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="flame" size={14} color={streak > 0 ? accent : colors.inkFaint} />
            <Text variant="caption" style={{ color: streak > 0 ? accent : colors.inkMuted, fontWeight: '700' }}>
              {streak}
            </Text>
          </View>
          {onEdit ? (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={groupHeader ? 'Editar rotina' : 'Editar hábito'}
              onPress={onEdit}
              hitSlop={8}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surface,
              }}
            >
              <Ionicons name="pencil-outline" size={16} color={colors.inkMuted} />
            </PressableScale>
          ) : null}
          {onDelete ? (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={groupHeader ? 'Excluir rotina' : 'Excluir hábito'}
              onPress={onDelete}
              hitSlop={8}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surface,
              }}
            >
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
            </PressableScale>
          ) : null}
          {onExpand ? (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={expanded ? 'Recolher rotina' : 'Abrir rotina'}
              onPress={onExpand}
              hitSlop={8}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surface,
              }}
            >
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.inkMuted}
              />
            </PressableScale>
          ) : null}
        </View>
      </View>

      {groupHeader && childCount > 0 ? (
        <Text variant="micro" muted>
          {childCount} hábito{childCount === 1 ? '' : 's'} nesta rotina
        </Text>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <PressableScale
          accessibilityRole="checkbox"
          accessibilityState={{ checked: done, disabled: checkDisabled }}
          accessibilityLabel={done ? 'Desmarcar' : markLabel}
          disabled={checkDisabled}
          onPress={onToggle}
          style={{ alignItems: 'center', gap: 4, minWidth: 56, opacity: checkDisabled ? 0.55 : 1 }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 999,
              backgroundColor: done ? accent : partial ? `${accent}22` : colors.surface,
              borderWidth: done ? 0 : 2,
              borderColor: checkDisabled ? colors.hairline : accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name={
                done
                  ? 'checkmark'
                  : checkDisabled
                    ? 'lock-closed-outline'
                    : partial
                      ? 'add'
                      : 'checkmark-outline'
              }
              size={22}
              color={done ? '#fff' : checkDisabled ? colors.inkFaint : accent}
            />
          </View>
          <Text
            variant="micro"
            style={{
              color: done ? accent : checkDisabled ? colors.inkFaint : colors.inkMuted,
              fontWeight: '700',
              textAlign: 'center',
            }}
          >
            {markLabel}
          </Text>
        </PressableScale>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <HabitHeatmap cells={cells} color={accent} rows={4} />
        </View>
      </View>
    </View>
  )
}
