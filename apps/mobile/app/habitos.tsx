import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { habitWeek, localTodayIso } from '@simply-life/shared'
import { Field, PrimaryButton, Screen, Text } from '../src/ui'
import { StackHeader } from '../src/components/layout/StackHeader'
import { useTheme } from '../src/theme/ThemeProvider'
import { habitDays, useHabitTrackStore } from '../src/store/habitTrackStore'

const IDEAS = ['Caminhar', 'Ler um pouco', 'Um dia sem bebida']

export default function HabitosScreen()
{
  const { colors, space } = useTheme()
  const habits = useHabitTrackStore((s) => s.habits)
  const add = useHabitTrackStore((s) => s.add)
  const toggleToday = useHabitTrackStore((s) => s.toggleToday)
  const remove = useHabitTrackStore((s) => s.remove)
  const [title, setTitle] = useState('')
  const today = localTodayIso()

  return (
    <Screen scroll>
      <StackHeader title="Hábitos" />
      <Text variant="body" muted>
        Marque o dia em que você fez. A fileira mostra a semana. Um dia sem marca continua na história. Nada é apagado por isso.
      </Text>
      <View style={{ gap: space.sm, marginTop: space.md }}>
        <Field label="O hábito" value={title} onChangeText={setTitle} placeholder="Caminhar" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {IDEAS.map((idea) => (
            <Pressable
              key={idea}
              onPress={() => setTitle(idea)}
              accessibilityRole="button"
              style={{ minHeight: 44, justifyContent: 'center' }}
            >
              <Text variant="caption" style={{ color: colors.health }}>{idea}</Text>
            </Pressable>
          ))}
        </View>
        <PrimaryButton
          label="Criar hábito"
          disabled={!title.trim()}
          onPress={() =>
          {
            add(title)
            setTitle('')
          }}
        />
      </View>
      <View style={{ marginTop: space.lg, gap: space.md, paddingBottom: 32 }}>
        {habits.map((habit) =>
        {
          const week = habitWeek(habit.marked, today)
          const on = habit.marked.includes(today)
          return (
            <View key={habit.id} style={{ gap: 8, borderTopWidth: 1, borderTopColor: colors.hairline, paddingTop: 16 }}>
              <Text variant="body">{habit.title}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {week.map((done, i) => (
                  <View
                    key={i}
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 7,
                      backgroundColor: done ? colors.health : colors.hairline,
                    }}
                  />
                ))}
              </View>
              <Text variant="caption" muted>{habitDays(habit.marked)} dias marcados</Text>
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <Pressable onPress={() => toggleToday(habit.id)} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
                  <Text variant="caption" style={{ color: colors.health }}>{on ? 'Desmarcar hoje' : 'Marcar hoje'}</Text>
                </Pressable>
                <Pressable onPress={() => remove(habit.id)} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
                  <Text variant="caption" style={{ color: colors.inkMuted }}>Apagar</Text>
                </Pressable>
              </View>
            </View>
          )
        })}
      </View>
    </Screen>
  )
}
