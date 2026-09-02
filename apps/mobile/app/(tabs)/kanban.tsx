import { useMemo, useState } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  partitionTodayTimeline,
  minutesToLabel,
  type MobileTask,
} from '@simply-life/shared'
import {
  Screen,
  Text,
  Card,
  SectionHeader,
  PillTabs,
  EmptyState,
  CheckRow,
} from '../../src/ui'
import { useTheme } from '../../src/theme/ThemeProvider'
import { useDataStore } from '../../src/store/dataStore'
import { useAuthStore } from '../../src/store/authStore'
import { ScreenIntro } from '../../src/components/dashboard/ScreenIntro'
import { MetricCards } from '../../src/components/dashboard/MetricCards'
import { TabShell } from '../../src/components/dashboard/TabShell'

type ViewMode = 'timeline' | 'lista'

export default function KanbanScreen()
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const [mode, setMode] = useState<ViewMode>('timeline')
  const tasks = useDataStore((s) => s.tasks)
  const loading = useDataStore((s) => s.loading)
  const refreshAll = useDataStore((s) => s.refreshAll)
  const toggleTaskDone = useDataStore((s) => s.toggleTaskDone)
  const isGuest = useAuthStore((s) => s.isGuest)
  const timeline = useMemo(() => partitionTodayTimeline(tasks), [tasks])
  const openCount = useMemo(() => tasks.filter((t) => t.status !== 'done').length, [tasks])
  const doneToday = useMemo(
    () => timeline.filter((t) => t.status === 'done').length,
    [timeline],
  )

  return (
    <Screen
      scroll
      refreshing={loading}
      onRefresh={() => void refreshAll({ isGuest })}
    >
      <TabShell>
        <ScreenIntro
          title="Tarefas"
          subtitle="Timeline do dia — o essencial primeiro."
        />

        <MetricCards
          items={[
            {
              label: 'Em aberto',
              value: String(openCount).padStart(2, '0'),
              color: colors.tasks,
            },
            {
              label: 'Concluídas hoje',
              value: String(doneToday).padStart(2, '0'),
              color: colors.done,
            },
          ]}
        />

        <PillTabs
          tabs={[
            { id: 'timeline', label: 'Timeline', count: timeline.length },
            { id: 'lista', label: 'Lista', count: openCount },
          ]}
          value={mode}
          onChange={setMode}
        />

        {mode === 'timeline' && (
          <View>
            <SectionHeader title="Hoje" subtitle={`${timeline.length} itens`} />
            {timeline.length === 0 ? (
              <Card tone="elevated">
                <EmptyState
                  title="Nada para hoje"
                  body="Use o + para capturar uma tarefa."
                />
              </Card>
            ) : (
              <Card tone="elevated" style={{ paddingVertical: space.sm }}>
                {timeline.map((task, index) => (
                  <TimelineRow
                    key={task.id}
                    task={task}
                    isLast={index === timeline.length - 1}
                    onPress={() => router.push(`/task/${task.id}`)}
                    onToggle={() => void toggleTaskDone(task.id, isGuest)}
                  />
                ))}
              </Card>
            )}
          </View>
        )}

        {mode === 'lista' && (
          <Card tone="elevated" style={{ paddingVertical: space.sm }}>
            {tasks.length === 0 ? (
              <EmptyState
                title="Sem tarefas"
                body="Use o + para capturar o que precisa ser feito."
              />
            ) : (
              tasks.map((t, i, arr) => (
                <CheckRow
                  key={t.id}
                  dense
                  title={t.titulo}
                  subtitle={t.status === 'done' ? 'Concluída' : 'Em aberto'}
                  done={t.status === 'done'}
                  onPress={() => router.push(`/task/${t.id}`)}
                  onToggle={() => void toggleTaskDone(t.id, isGuest)}
                  showSeparator={i < arr.length - 1}
                />
              ))
            )}
          </Card>
        )}
      </TabShell>
    </Screen>
  )
}

function TimelineRow({
  task,
  isLast,
  onPress,
  onToggle,
}: {
  task: MobileTask
  isLast: boolean
  onPress: () => void
  onToggle: () => void
})
{
  const { colors, space } = useTheme()
  const time = task.horaMinutos != null ? minutesToLabel(task.horaMinutos) : '—'
  const done = task.status === 'done'

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: space.md,
        opacity: done ? 0.55 : 1,
        minHeight: 64,
      }}
    >
      <View style={{ width: 44, alignItems: 'flex-end', paddingTop: 14 }}>
        <Text variant="caption" color={colors.tasks}>
          {time}
        </Text>
      </View>
      <View style={{ width: 14, alignItems: 'center' }}>
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            marginTop: 16,
            backgroundColor: done ? colors.done : colors.tasks,
          }}
        />
        {!isLast ? (
          <View
            style={{
              flex: 1,
              width: 2,
              marginTop: 4,
              backgroundColor: colors.hairline,
            }}
          />
        ) : null}
      </View>
      <View style={{ flex: 1, paddingBottom: space.sm }}>
        <CheckRow
          dense
          title={task.titulo}
          subtitle={`${task.estimativaMinutos} min`}
          done={done}
          onPress={onPress}
          onToggle={onToggle}
        />
        <View
          style={{
            height: 4,
            borderRadius: 999,
            backgroundColor: colors.hairline,
            overflow: 'hidden',
            marginHorizontal: space.sm,
            marginBottom: 4,
          }}
        >
          <View
            style={{
              width: `${Math.round(task.progresso * 100)}%`,
              height: '100%',
              backgroundColor: colors.tasks,
            }}
          />
        </View>
      </View>
    </View>
  )
}
