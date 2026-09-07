import { useMemo, useState } from 'react'
import { View, Pressable, ScrollView, StyleSheet } from 'react-native'
import { minutesToLabel, type MobileTask } from '@simply-life/shared'
import { Text, EmptyState, Chip } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { PlansCalendar } from '../calendar/PlansCalendar'
import { KanbanDayCard } from './KanbanDayCard'

type Props = {
  tasks: MobileTask[]
}

function isoOffset(days: number): string
{
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

/**
 * Calendário do Kanban: faixa de dias + timeline.
 * Grade mensal (Planos) continua em “Mês”.
 */
export function KanbanCalendarPane({ tasks }: Props)
{
  const { colors, space } = useTheme()
  const isGuest = useAuthStore((s) => s.isGuest)
  const toggleTaskDone = useDataStore((s) => s.toggleTaskDone)
  const [view, setView] = useState<'dia' | 'mes'>('dia')
  const [offset, setOffset] = useState(0)

  const strip = useMemo(() =>
  {
    return Array.from({ length: 10 }).map((_, i) =>
    {
      const day = i - 1
      const iso = isoOffset(day)
      const date = new Date(`${iso}T12:00:00`)
      return {
        day,
        iso,
        num: date.getDate(),
        weekday: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
        month: date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      }
    })
  }, [])

  const selected = strip.find((d) => d.day === offset) ?? strip[1]
  const dayTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.dataVencimento?.slice(0, 10) === selected.iso)
        .slice()
        .sort((a, b) => (a.horaMinutos ?? 9999) - (b.horaMinutos ?? 9999)),
    [tasks, selected.iso],
  )

  if (view === 'mes')
  {
    return (
      <View style={{ gap: space.sm }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip label="Dia" onPress={() => setView('dia')} />
          <Chip label="Mês" active onPress={() => setView('mes')} />
        </View>
        <PlansCalendar tasks={tasks} />
      </View>
    )
  }

  return (
    <View style={{ gap: space.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="section" style={{ fontSize: 16, textTransform: 'capitalize' }}>
          {selected.month}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip label="Dia" active onPress={() => setView('dia')} />
          <Chip label="Mês" onPress={() => setView('mes')} />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
      >
        {strip.map((d) =>
        {
          const active = d.day === offset
          const count = tasks.filter((t) => t.dataVencimento?.slice(0, 10) === d.iso).length
          return (
            <Pressable
              key={d.iso}
              onPress={() => setOffset(d.day)}
              style={{
                width: 52,
                minHeight: 78,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                paddingVertical: 8,
                backgroundColor: active ? colors.axel : colors.elevated,
              }}
            >
              <Text
                variant="micro"
                style={{
                  textTransform: 'capitalize',
                  fontWeight: '600',
                  color: active ? colors.axelOnFill : colors.inkMuted,
                }}
              >
                {d.weekday}
              </Text>
              <Text
                variant="bodyStrong"
                style={{ fontSize: 18, color: active ? colors.axelOnFill : colors.ink }}
              >
                {d.num}
              </Text>
              <Text
                variant="micro"
                style={{ color: active ? colors.axelOnFill : colors.inkFaint, fontSize: 10 }}
              >
                {count}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>

      {dayTasks.length === 0 ? (
        <EmptyState title="Dia livre" body="Nada com prazo neste dia." icon="sunny-outline" />
      ) : (
        <View>
          {dayTasks.map((t, i) =>
          {
            const last = i === dayTasks.length - 1
            return (
              <View key={t.id} style={{ flexDirection: 'row', gap: 10, minHeight: 88 }}>
                <View style={{ width: 46, alignItems: 'center' }}>
                  <Text variant="micro" muted style={{ fontWeight: '700' }}>
                    {t.horaMinutos != null ? minutesToLabel(t.horaMinutos) : '—'}
                  </Text>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      backgroundColor: t.status === 'done' ? colors.health : colors.axel,
                      marginTop: 6,
                    }}
                  />
                  {!last ? (
                    <View
                      style={{
                        width: StyleSheet.hairlineWidth,
                        flex: 1,
                        minHeight: 40,
                        backgroundColor: colors.hairline,
                        marginTop: 4,
                      }}
                    />
                  ) : null}
                </View>
                <View style={{ flex: 1, paddingBottom: last ? 0 : 12 }}>
                  <KanbanDayCard
                    task={t}
                    onToggle={() => void toggleTaskDone(t.id, isGuest)}
                  />
                </View>
              </View>
            )
          })}
        </View>
      )}
    </View>
  )
}
