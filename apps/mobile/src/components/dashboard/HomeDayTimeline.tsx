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
  /** Estica o card para preencher a coluna no desktop. */
  fill?: boolean
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

function blockHeight(task: MobileTask): number
{
  return Math.max(SLOT_HEIGHT, ((task.estimativaMinutos ?? 30) / 60) * SLOT_HEIGHT)
}

// tarefas que se cruzam dividem a largura em colunas, em vez de ficarem uma em cima da outra
function laneLayout(items: { id: string; top: number; bottom: number }[]): Map<string, { lane: number; lanes: number }>
{
  const out = new Map<string, { lane: number; lanes: number }>()
  const sorted = [...items].sort((a, b) => a.top - b.top)
  let cluster: string[] = []
  let laneEnds: number[] = []
  let clusterEnd = -1
  const flush = () =>
  {
    for (const id of cluster) out.get(id)!.lanes = laneEnds.length
    cluster = []
    laneEnds = []
  }
  for (const it of sorted)
  {
    if (it.top >= clusterEnd) flush()
    let lane = laneEnds.findIndex((end) => end <= it.top)
    if (lane === -1)
    {
      lane = laneEnds.length
      laneEnds.push(it.bottom)
    }
    else laneEnds[lane] = it.bottom
    out.set(it.id, { lane, lanes: 1 })
    cluster.push(it.id)
    clusterEnd = Math.max(clusterEnd, it.bottom)
  }
  flush()
  return out
}

/**
 * Faixa visual do dia (estilo Tiimo) — tarefas de hoje por horário.
 */
export function HomeDayTimeline({ tasks, fill = false }: Props)
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

  const lanes = useMemo(
    () =>
      laneLayout(
        timed.map((t) =>
        {
          const top = blockStyle(t, colors).top
          return { id: t.id, top, bottom: top + blockHeight(t) }
        }),
      ),
    [timed, colors],
  )

  const trackHeight = (DAY_END - DAY_START) * SLOT_HEIGHT + SLOT_HEIGHT

  return (
    <Card tone="elevated" style={{ gap: space.sm, ...(fill ? { flex: 1 } : {}) }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        {/* flex + minWidth: o texto quebra a linha em vez de passar por baixo do link */}
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text variant="caption" color={colors.axel} style={{ fontWeight: '700' }}>
            Linha do dia
          </Text>
          <Text variant="bodyStrong">{todayLabel()}</Text>
          <Text variant="caption" muted>
            Tarefas de hoje por horário, em uma faixa visual.
          </Text>
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
        <View style={fill ? { flex: 1, justifyContent: 'center' } : undefined}>
          <EmptyState
            title="Dia sem blocos"
            body="Defina horário nas tarefas para ver o ritmo do dia aqui, sem abrir o Kanban."
          />
        </View>
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
                  <Text variant="caption" muted style={{ fontSize: 12 }}>
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
                const height = blockHeight(task)
                const { lane, lanes: count } = lanes.get(task.id) ?? { lane: 0, lanes: 1 }
                return (
                  <View
                    key={task.id}
                    style={{
                      position: 'absolute',
                      left: `${(lane / count) * 100}%`,
                      width: `${100 / count}%`,
                      top: top + 1,
                      height: height - 2,
                      paddingLeft: 6,
                      paddingRight: lane === count - 1 ? 6 : 0,
                    }}
                  >
                    <PressableScale
                      onPress={() => openEvolve(task.id)}
                      style={{
                        flex: 1,
                        borderRadius: radius.control,
                        backgroundColor: `${color}22`,
                        borderLeftWidth: 3,
                        borderLeftColor: color,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <Text variant="caption" muted numberOfLines={1}>
                        {task.horaMinutos != null ? minutesToLabel(task.horaMinutos) : 'Sem hora'}
                      </Text>
                      <Text variant="bodyStrong" numberOfLines={height > SLOT_HEIGHT ? 2 : 1}>
                        {task.titulo}
                      </Text>
                    </PressableScale>
                  </View>
                )
              })}
            </View>
          </View>
        </ScrollView>
      )}

      {untimed.length > 0 ? (
        <View style={{ gap: 8, marginTop: space.xs }}>
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
                borderRadius: radius.control,
                backgroundColor: colors.hairline,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: colors.axelFill,
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
