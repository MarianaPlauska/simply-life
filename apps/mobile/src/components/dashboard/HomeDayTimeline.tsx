import { useMemo } from 'react'
import { View, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import {
  minutesToLabel,
  formatTimelineHour,
  type MobileTask,
} from '@simply-life/shared'
import { Card, Text, PressableScale, EmptyState } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useTaskEvolveStore } from '../../store/taskEvolveStore'

const DAY_START = 6
const DAY_END = 23
const SLOT_HEIGHT = 44

type Props = {
  tasks: MobileTask[]
}

function todayLabel(): string
{
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  })
}

function blockStyle(
  task: MobileTask,
  colors: { axel: string; tasks: string; health: string; inkMuted: string },
): { top: number; color: string }
{
  const minutes = task.horaMinutos ?? 9 * 60
  const top = ((minutes - DAY_START * 60) / 60) * SLOT_HEIGHT
  const color =
    task.prioridade === 1 ? colors.axel : task.prioridade === 2 ? colors.tasks : colors.health
  return { top: Math.max(0, top), color }
}

/**
 * Faixa visual do dia (estilo Tiimo) — tarefas de hoje por horário.
 */
export function HomeDayTimeline({ tasks }: Props)
{
  const { colors, space, radius } = useTheme()
  const router = useRouter()
  const openEvolve = useTaskEvolveStore((s) => s.open)

  const hours = useMemo(
    () => Array.from({ length: DAY_END - DAY_START + 1 }, (_, i) => DAY_START + i),
    [],
  )

  const withTime = useMemo(
    () =>
      tasks
        .filter((t) => t.status !== 'done')
        .slice(0, 12),
    [tasks],
  )

  const untimed = useMemo(
    () => withTime.filter((t) => t.horaMinutos == null),
    [withTime],
  )

  const timed = useMemo(
    () => withTime.filter((t) => t.horaMinutos != null),
    [withTime],
  )

  const trackHeight = (DAY_END - DAY_START) * SLOT_HEIGHT + SLOT_HEIGHT

  return (
    <Card tone="elevated" style={{ gap: space.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View>
          <Text variant="caption" color={colors.axel} style={{ fontWeight: '700' }}>
            Linha do dia
          </Text>
          <Text variant="bodyStrong">{todayLabel()}</Text>
        </View>
        <PressableScale
          accessibilityLabel="Abrir Kanban"
          onPress={() => router.push('/(tabs)/kanban')}
          style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }}
        >
          <Text variant="caption" color={colors.axel} style={{ fontWeight: '600' }}>
            Kanban
          </Text>
        </PressableScale>
      </View>

      {withTime.length === 0 ? (
        <EmptyState
          title="Dia sem blocos"
          body="Capture uma tarefa com horário ou abra o Kanban para planejar."
        />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: space.md, minWidth: '100%' }}>
            <View style={{ width: 48, height: trackHeight }}>
              {hours.map((h) => (
                <View
                  key={h}
                  style={{
                    height: SLOT_HEIGHT,
                    justifyContent: 'flex-start',
                    paddingTop: 2,
                  }}
                >
                  <Text variant="caption" muted style={{ fontSize: 11 }}>
                    {formatTimelineHour(h)}
                  </Text>
                </View>
              ))}
            </View>
            <View
              style={{
                flex: 1,
                minWidth: 200,
                height: trackHeight,
                borderLeftWidth: 1,
                borderLeftColor: colors.hairline,
                position: 'relative',
              }}
            >
              {hours.map((h) => (
                <View
                  key={`line-${h}`}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: (h - DAY_START) * SLOT_HEIGHT,
                    height: 1,
                    backgroundColor: colors.hairline,
                  }}
                />
              ))}
              {timed.map((task) =>
              {
                const { top, color } = blockStyle(task, colors)
                const duration = task.estimativaMinutos ?? 30
                const height = Math.max(SLOT_HEIGHT * 0.6, (duration / 60) * SLOT_HEIGHT)
                return (
                  <PressableScale
                    key={task.id}
                    onPress={() => openEvolve(task.id)}
                    style={{
                      position: 'absolute',
                      left: 8,
                      right: 8,
                      top,
                      minHeight: height,
                      borderRadius: radius.md,
                      backgroundColor: `${color}22`,
                      borderLeftWidth: 3,
                      borderLeftColor: color,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      justifyContent: 'center',
                    }}
                  >
                    <Text variant="caption" muted>
                      {task.horaMinutos != null ? minutesToLabel(task.horaMinutos) : '—'}
                    </Text>
                    <Text variant="bodyStrong" numberOfLines={2}>
                      {task.titulo}
                    </Text>
                  </PressableScale>
                )
              })}
            </View>
          </View>
        </ScrollView>
      )}

      {untimed.length > 0 ? (
        <View style={{ gap: 6, marginTop: space.xs }}>
          <Text variant="caption" muted>
            Sem horário definido
          </Text>
          {untimed.slice(0, 4).map((task) => (
            <PressableScale
              key={task.id}
              onPress={() => openEvolve(task.id)}
              style={{
                minHeight: 44,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: radius.md,
                backgroundColor: colors.hairline,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: colors.axel,
                }}
              />
              <Text variant="body" style={{ flex: 1 }} numberOfLines={1}>
                {task.titulo}
              </Text>
            </PressableScale>
          ))}
        </View>
      ) : null}
    </Card>
  )
}
