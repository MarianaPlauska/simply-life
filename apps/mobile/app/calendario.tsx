import { useMemo, useState } from 'react'
import { View, Pressable } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import { Screen, Text, Card, EmptyState, ListRow } from '../src/ui'
import { StackHeader } from '../src/components/layout/StackHeader'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAuthStore } from '../src/store/authStore'
import { useDataStore } from '../src/store/dataStore'

function monthMatrix(anchor: Date)
{
  const year = anchor.getFullYear()
  const month = anchor.getMonth()
  const first = new Date(year, month, 1)
  const startPad = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < startPad; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return { year, month, cells }
}

export default function CalendarioScreen()
{
  const userId = useAuthStore((s) => s.userId)
  const { colors, space, radius } = useTheme()
  const router = useRouter()
  const tasks = useDataStore((s) => s.tasks)
  const [cursor, setCursor] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate())
  const { year, month, cells } = useMemo(() => monthMatrix(cursor), [cursor])
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`
  const selectedIso =
    selectedDay != null
      ? `${monthKey}-${String(selectedDay).padStart(2, '0')}`
      : null
  const dayTasks = tasks.filter((t) => t.dataVencimento === selectedIso)
  const counts = useMemo(() =>
  {
    const map: Record<string, number> = {}
    for (const t of tasks)
    {
      if (!t.dataVencimento) continue
      map[t.dataVencimento] = (map[t.dataVencimento] ?? 0) + 1
    }
    return map
  }, [tasks])

  if (!userId) return <Redirect href="/login" />

  const label = cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <Screen scroll tabBarInset={false}>
      <StackHeader title="Calendário" subtitle="Prazos no mês" />
      <View style={{ gap: space.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Pressable
            onPress={() => setCursor(new Date(year, month - 1, 1))}
            style={{ minHeight: 44, paddingHorizontal: 12, justifyContent: 'center' }}
          >
            <Text variant="label">Anterior</Text>
          </Pressable>
          <Text variant="section" style={{ textTransform: 'capitalize' }}>
            {label}
          </Text>
          <Pressable
            onPress={() => setCursor(new Date(year, month + 1, 1))}
            style={{ minHeight: 44, paddingHorizontal: 12, justifyContent: 'center' }}
          >
            <Text variant="label">Próximo</Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row' }}>
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
            <Text key={`${d}-${i}`} variant="caption" muted style={{ flex: 1, textAlign: 'center' }}>
              {d}
            </Text>
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {cells.map((d, i) =>
          {
            const iso = d != null ? `${monthKey}-${String(d).padStart(2, '0')}` : null
            const has = iso ? (counts[iso] ?? 0) > 0 : false
            const selected = d === selectedDay
            return (
              <Pressable
                key={`c-${i}`}
                disabled={d == null}
                onPress={() => d != null && setSelectedDay(d)}
                style={{
                  width: '14.28%',
                  minHeight: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: radius.control,
                  backgroundColor: selected ? colors.surface : 'transparent',
                }}
              >
                {d != null ? (
                  <>
                    <Text variant="label" color={selected ? colors.ink : colors.inkMuted}>
                      {d}
                    </Text>
                    {has ? (
                      <View
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: 999,
                          backgroundColor: colors.tasks,
                          marginTop: 2,
                        }}
                      />
                    ) : null}
                  </>
                ) : null}
              </Pressable>
            )
          })}
        </View>

        <Card tone="elevated" style={{ paddingVertical: space.sm }}>
          {dayTasks.length === 0 ? (
            <EmptyState title="Sem prazos neste dia" body="Itens com data aparecem aqui." />
          ) : (
            dayTasks.map((t, i) => (
              <ListRow
                key={t.id}
                title={t.titulo}
                subtitle={t.status === 'done' ? 'Concluída' : 'Em aberto'}
                showSeparator={i < dayTasks.length - 1}
                onPress={() => router.push(`/task/${t.id}`)}
              />
            ))
          )}
        </Card>
      </View>
    </Screen>
  )
}
