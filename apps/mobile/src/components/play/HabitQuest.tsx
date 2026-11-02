import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { habitWeek, localTodayIso } from '@simply-life/shared'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { habitDays, useHabitTrackStore } from '../../store/habitTrackStore'

/** Missões do dia no palco. Marcar não tira o que já foi feito. */
export function HabitQuest()
{
  const { colors } = useTheme()
  const router = useRouter()
  const habits = useHabitTrackStore((s) => s.habits)
  const toggleToday = useHabitTrackStore((s) => s.toggleToday)
  const today = localTodayIso()
  const shown = habits.slice(0, 3)

  return (
    <View style={{ gap: 8, width: '100%', alignSelf: 'stretch' }}>
      <Pressable
        onPress={() => router.push('/habitos' as never)}
        accessibilityRole="button"
        style={{ minHeight: 44, justifyContent: 'center' }}
      >
        <Text variant="caption" style={{ color: colors.health }}>Hábitos do dia</Text>
      </Pressable>
      {shown.length === 0 ? (
        <Text variant="caption" muted>
          Caminhar, ler, um dia sem bebida. Toque para criar. Faltar um dia não apaga os outros.
        </Text>
      ) : shown.map((habit) =>
      {
        const on = habit.marked.includes(today)
        const week = habitWeek(habit.marked, today)
        return (
          <Pressable
            key={habit.id}
            onPress={() => toggleToday(habit.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10 }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                borderWidth: 2,
                borderColor: colors.health,
                backgroundColor: on ? colors.health : 'transparent',
              }}
            />
            <View style={{ flex: 1, gap: 4 }}>
              <Text variant="body">{habit.title}</Text>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {week.map((done, i) => (
                  <View
                    key={i}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: done ? colors.health : colors.hairline,
                    }}
                  />
                ))}
              </View>
            </View>
            <Text variant="caption" muted>{habitDays(habit.marked)}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}
