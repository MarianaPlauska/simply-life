import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  dayCount,
  habitMetOn,
  streakLine,
  type RoutineHabit,
  type RoutineLogs,
} from '@simply-life/shared'
import { Text, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  habit: RoutineHabit
  logs: RoutineLogs
  iso: string
  nested?: boolean
  quiet?: boolean
  checked?: boolean
  onToggle: () => void
  onAdvice?: () => void
}

/** Linha de hábito: check, sequência e progresso do dia. */
export function RoutineHabitRow({
  habit,
  logs,
  iso,
  nested,
  quiet,
  checked,
  onToggle,
  onAdvice,
}: Props)
{
  const { colors } = useTheme()
  const done = checked ?? habitMetOn(habit, logs, iso)
  const count = dayCount(logs, habit.id, iso)
  const line = streakLine(habit, logs)
  const showProgress = habit.cadence === 'daily' && habit.dailyTarget > 1
  const tone =
    line.tone === 'good' ? colors.health : line.tone === 'bad' ? colors.danger : colors.inkMuted

  return (
    <PressableScale
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      style={{
        minHeight: 56,
        paddingVertical: 10,
        paddingLeft: nested ? 36 : 4,
        paddingRight: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 8,
          borderWidth: done ? 0 : 2,
          borderColor: colors.hairline,
          backgroundColor: done ? colors.health : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {done ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
      </View>
      <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text
            variant="bodyStrong"
            numberOfLines={1}
            style={{ flex: 1, textDecorationLine: done ? 'line-through' : 'none' }}
          >
            {habit.title}
          </Text>
          {showProgress ? (
            <View
              style={{
                minWidth: 36,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 999,
                backgroundColor: colors.elevated,
              }}
            >
              <Text variant="micro" muted>
                {count}/{habit.dailyTarget}
              </Text>
            </View>
          ) : null}
        </View>
        {quiet ? null : (
          <Text variant="caption" style={{ color: tone }} numberOfLines={1}>
            {line.text}
          </Text>
        )}
      </View>
      {line.tone === 'bad' && onAdvice ? (
        <PressableScale
          accessibilityLabel="Conselho"
          onPress={onAdvice}
          style={{
            minHeight: 36,
            paddingHorizontal: 10,
            borderRadius: 999,
            backgroundColor: `${colors.danger}22`,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Ionicons name="information-circle-outline" size={14} color={colors.danger} />
          <Text variant="micro" style={{ color: colors.danger, fontWeight: '700' }}>
            Dica
          </Text>
        </PressableScale>
      ) : null}
    </PressableScale>
  )
}
