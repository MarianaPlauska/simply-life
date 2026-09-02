import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { findHabit, habitPct, minutesToLabel, type MobileTask } from '@simply-life/shared'
import { Text, Card, PrimaryButton, CheckRow } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { useAuthStore } from '../../store/authStore'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function MiniCalendar()
{
  const { colors, space } = useTheme()
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const monthLabel = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <Card tone="elevated" style={{ gap: space.sm, borderRadius: 18 }}>
      <Text variant="section" style={{ textTransform: 'capitalize' }}>
        Calendário
      </Text>
      <Text variant="caption" muted style={{ textTransform: 'capitalize' }}>
        {monthLabel}
      </Text>
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        {WEEKDAYS.map((w) => (
          <Text
            key={w}
            variant="micro"
            muted
            style={{ flex: 1, textAlign: 'center', fontSize: 10 }}
          >
            {w}
          </Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((d, i) =>
        {
          const isToday = d === today
          return (
            <View
              key={`c-${i}`}
              style={{
                width: `${100 / 7}%`,
                aspectRatio: 1,
                alignItems: 'center',
                justifyContent: 'center',
                padding: 2,
              }}
            >
              {d != null ? (
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isToday ? colors.axel : 'transparent',
                  }}
                >
                  <Text
                    variant="micro"
                    style={{
                      fontSize: 11,
                      fontWeight: isToday ? '700' : '500',
                      color: isToday ? colors.axelOnFill : colors.ink,
                    }}
                  >
                    {d}
                  </Text>
                </View>
              ) : null}
            </View>
          )
        })}
      </View>
    </Card>
  )
}

function TodayTasks({ tasks }: { tasks: MobileTask[] })
{
  const { space } = useTheme()
  const router = useRouter()
  const toggleTaskDone = useDataStore((s) => s.toggleTaskDone)
  const isGuest = useAuthStore((s) => s.isGuest)
  const slice = tasks.slice(0, 4)

  return (
    <Card tone="elevated" style={{ gap: space.sm, borderRadius: 18, paddingVertical: space.sm }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: space.sm,
          paddingTop: space.sm,
        }}
      >
        <Text variant="section">Suas tarefas</Text>
        <PrimaryButton
          label="Ver tudo"
          variant="link"
          size="sm"
          onPress={() => router.push('/(tabs)/kanban')}
        />
      </View>
      {slice.length === 0 ? (
        <Text variant="caption" muted style={{ padding: space.md }}>
          Nada na fila hoje.
        </Text>
      ) : (
        slice.map((t, i) => (
          <CheckRow
            key={t.id}
            title={t.titulo}
            subtitle={t.horaMinutos != null ? minutesToLabel(t.horaMinutos) : 'Sem horário'}
            done={t.status === 'done'}
            onPress={() => router.push(`/task/${t.id}`)}
            onToggle={() => void toggleTaskDone(t.id, isGuest)}
            showSeparator={i < slice.length - 1}
          />
        ))
      )}
    </Card>
  )
}

function ProgressPanel()
{
  const { colors, space } = useTheme()
  const habits = useDataStore((s) => s.habits)
  const agua = findHabit(habits, 'agua')
  const pct = habitPct(agua)
  const router = useRouter()

  return (
    <Card tone="elevated" style={{ gap: space.md, borderRadius: 18 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="section">Hidratação</Text>
        <PrimaryButton
          label="Abrir"
          variant="link"
          size="sm"
          onPress={() => router.push('/(tabs)/saude')}
        />
      </View>
      <Text variant="title" color={colors.health} style={{ fontSize: 22 }}>
        {agua ? `${agua.progressoAtual}/${agua.metaDiaria}` : '—'}
      </Text>
      <View
        style={{
          height: 8,
          borderRadius: 999,
          backgroundColor: colors.hairline,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${pct}%`,
            height: '100%',
            backgroundColor: colors.health,
            borderRadius: 999,
          }}
        />
      </View>
      <Text variant="caption" muted>
        {pct}% da meta de água
      </Text>
    </Card>
  )
}

/** Coluna direita estilo Drive — calendário, tarefas, progresso */
export function HomeDriveAside({ todayTasks }: { todayTasks: MobileTask[] })
{
  const { space } = useTheme()

  return (
    <View style={{ width: 300, gap: space.md, flexShrink: 0 }}>
      <MiniCalendar />
      <TodayTasks tasks={todayTasks} />
      <ProgressPanel />
    </View>
  )
}
