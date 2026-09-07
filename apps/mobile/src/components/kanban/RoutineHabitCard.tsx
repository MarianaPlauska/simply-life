import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
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
  checked?: boolean
  onToggle: () => void
}

/** Card de rotina constante: check, sequência e quadriculado colorido. */
export function RoutineHabitCard({
  habit,
  logs,
  iso,
  items = [],
  nested,
  checked,
  onToggle,
}: Props)
{
  const { colors } = useTheme()
  const done = checked ?? habitMetOn(habit, logs, iso)
  const accent = habitAccent(habit.id)
  const streak = winStreak(habit, logs, new Date(), items)
  const cells = habitHeatmap(habit, logs, 84, new Date(), items)

  return (
    <View
      style={{
        marginLeft: nested ? 28 : 0,
        padding: 14,
        borderRadius: 20,
        backgroundColor: colors.elevated,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1, paddingRight: 8 }}>
          {habit.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="flame" size={14} color={streak > 0 ? accent : colors.inkFaint} />
          <Text variant="caption" style={{ color: streak > 0 ? accent : colors.inkMuted, fontWeight: '700' }}>
            {streak}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
        <PressableScale
          accessibilityRole="checkbox"
          accessibilityState={{ checked: done }}
          accessibilityLabel={done ? 'Desmarcar hábito' : 'Marcar hábito'}
          onPress={onToggle}
          style={{
            width: 48,
            height: 48,
            borderRadius: 999,
            backgroundColor: done ? accent : `${accent}33`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {done ? <Ionicons name="checkmark" size={22} color="#fff" /> : null}
        </PressableScale>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <HabitHeatmap cells={cells} color={accent} />
        </View>
      </View>
    </View>
  )
}
