import { useMemo, useState } from 'react'
import { View, ScrollView, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import type { MobileTask } from '@simply-life/shared'
import { Card, Text, EmptyState, PillTabs } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Zoom = 7 | 14 | 30

type Props = {
  tasks: MobileTask[]
}

const PX_PER_DAY = 36
const LABEL_W = 160
const ROW_H = 44

function startOfDay(d: Date): Date
{
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function addDays(d: Date, n: number): Date
{
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function dayDiff(a: Date, b: Date): number
{
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86_400_000)
}

/**
 * Gantt simplificado. Lógica portada de frontend/GanttView.tsx
 * para MobileTask (mesma fonte do Kanban).
 */
export function KanbanGanttPane({ tasks }: Props)
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const [zoom, setZoom] = useState<Zoom>(14)
  const today = useMemo(() => startOfDay(new Date()), [])

  const withDue = useMemo(
    () =>
      tasks
        .filter((t) => t.dataVencimento && t.status !== 'done')
        .sort((a, b) =>
          (a.dataVencimento || '').localeCompare(b.dataVencimento || ''),
        ),
    [tasks],
  )

  const { rangeStart, dayCount } = useMemo(() =>
  {
    let start = today
    for (const t of withDue)
    {
      const end = startOfDay(new Date(`${t.dataVencimento!.slice(0, 10)}T12:00:00`))
      const created = addDays(end, -3)
      if (created < start) start = created
    }
    let end = addDays(today, zoom)
    if (withDue.length > 0)
    {
      const latest = startOfDay(
        new Date(`${withDue[withDue.length - 1].dataVencimento!.slice(0, 10)}T12:00:00`),
      )
      if (latest > end) end = latest
    }
    return {
      rangeStart: start,
      dayCount: Math.max(zoom, dayDiff(start, end) + 1),
    }
  }, [withDue, today, zoom])

  const days = useMemo(() =>
  {
    const list: Date[] = []
    for (let i = 0; i < dayCount; i++) list.push(addDays(rangeStart, i))
    return list
  }, [rangeStart, dayCount])

  const timelineW = dayCount * PX_PER_DAY
  const todayOffset = dayDiff(rangeStart, today)

  if (withDue.length === 0)
  {
    return (
      <Card tone="elevated" style={{ borderRadius: 16 }}>
        <EmptyState
          title="Nenhuma tarefa com prazo"
          body="Defina datas nas tarefas para ver o Gantt."
        />
      </Card>
    )
  }

  return (
    <View style={{ gap: space.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="caption" muted>
          {withDue.length} com prazo
        </Text>
        <PillTabs
          tabs={[
            { id: '7', label: '7d' },
            { id: '14', label: '14d' },
            { id: '30', label: '30d' },
          ]}
          value={String(zoom)}
          onChange={(id) => setZoom(Number(id) as Zoom)}
        />
      </View>

      <Card tone="elevated" style={{ borderRadius: 16, padding: 0, overflow: 'hidden' }}>
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View style={{ minWidth: LABEL_W + timelineW }}>
            <View
              style={{
                flexDirection: 'row',
                borderBottomWidth: 1,
                borderBottomColor: colors.hairline,
                backgroundColor: colors.surface,
              }}
            >
              <View style={{ width: LABEL_W, padding: 10, justifyContent: 'center' }}>
                <Text variant="micro" muted>
                  TAREFA
                </Text>
              </View>
              <View style={{ width: timelineW, height: 40, position: 'relative' }}>
                {days.map((d, i) =>
                {
                  const isToday = dayDiff(today, d) === 0
                  return (
                    <View
                      key={i}
                      style={{
                        position: 'absolute',
                        left: i * PX_PER_DAY,
                        width: PX_PER_DAY,
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 40,
                      }}
                    >
                      <Text
                        variant="micro"
                        style={{
                          fontSize: 9,
                          color: isToday ? colors.axel : colors.inkMuted,
                          fontWeight: isToday ? '700' : '500',
                        }}
                      >
                        {d.getDate()}
                      </Text>
                    </View>
                  )
                })}
                {todayOffset >= 0 && todayOffset < dayCount ? (
                  <View
                    style={{
                      position: 'absolute',
                      left: todayOffset * PX_PER_DAY + PX_PER_DAY / 2,
                      top: 0,
                      bottom: 0,
                      width: 2,
                      backgroundColor: colors.axel,
                    }}
                  />
                ) : null}
              </View>
            </View>

            {withDue.map((t) =>
            {
              const end = startOfDay(new Date(`${t.dataVencimento!.slice(0, 10)}T12:00:00`))
              const start = addDays(end, -Math.max(1, Math.min(4, dayDiff(rangeStart, end))))
              const left = Math.max(0, dayDiff(rangeStart, start)) * PX_PER_DAY
              const width = Math.max(PX_PER_DAY, (dayDiff(start, end) + 1) * PX_PER_DAY)
              const overdue = dayDiff(today, end) < 0
              const soon = !overdue && dayDiff(today, end) <= 2
              const barColor = overdue
                ? colors.danger
                : soon
                  ? colors.attention
                  : colors.axel

              return (
                <Pressable
                  key={t.id}
                  onPress={() => router.push(`/task/${t.id}`)}
                  style={{
                    flexDirection: 'row',
                    height: ROW_H,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.hairline,
                    alignItems: 'center',
                  }}
                >
                  <View style={{ width: LABEL_W, paddingHorizontal: 10 }}>
                    <Text variant="label" numberOfLines={1} style={{ fontSize: 13 }}>
                      {t.titulo}
                    </Text>
                  </View>
                  <View style={{ width: timelineW, height: ROW_H, justifyContent: 'center' }}>
                    <View
                      style={{
                        position: 'absolute',
                        left,
                        width,
                        height: 22,
                        borderRadius: 8,
                        backgroundColor: barColor,
                        opacity: 0.9,
                      }}
                    />
                  </View>
                </Pressable>
              )
            })}
          </View>
        </ScrollView>
      </Card>
    </View>
  )
}
