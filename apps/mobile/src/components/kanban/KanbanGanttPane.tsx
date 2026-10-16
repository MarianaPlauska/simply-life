import { useMemo, useState, useEffect } from 'react'
import { View, ScrollView, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import {
  inferLifeCategory,
  LIFE_CATEGORIES,
  taskListId,
  type MobileTask,
} from '@simply-life/shared'
import { Card, Text, EmptyState, PillTabs, PaneTitle } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useKanbanListsStore } from '../../store/kanbanListsStore'
import { useWebDesk } from '../dashboard/web/webBox'
import { WebSegmented } from './web/WebListParts'
import { LEX } from './web/kanbanWeb'

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
  // computador: a linha do tempo estica até a largura do painel e o texto não fica minúsculo
  const desk = useWebDesk()
  const [boxW, setBoxW] = useState(0)
  const today = useMemo(() => startOfDay(new Date()), [])
  const lists = useKanbanListsStore((s) => s.lists)
  const hydrateLists = useKanbanListsStore((s) => s.hydrate)

  useEffect(() =>
  {
    hydrateLists()
  }, [hydrateLists])

  const withDue = useMemo(
    () =>
      tasks
        .filter((t) => t.dataVencimento && t.status !== 'done')
        .sort((a, b) =>
          (a.dataVencimento || '').localeCompare(b.dataVencimento || ''),
        ),
    [tasks],
  )

  const groups = useMemo(() =>
  {
    const map = new Map<string, { label: string; tasks: MobileTask[] }>()
    for (const t of withDue)
    {
      const lid = taskListId(t)
      const list = lid ? lists.find((l) => l.id === lid) : null
      const key = list?.id ?? `life-${inferLifeCategory(t)}`
      const label =
        list?.name ??
        LIFE_CATEGORIES.find((c) => c.id === inferLifeCategory(t))?.label ??
        'Outras'
      const bucket = map.get(key)
      if (bucket) bucket.tasks.push(t)
      else map.set(key, { label, tasks: [t] })
    }
    return [...map.entries()].map(([id, value]) => ({ id, ...value }))
  }, [withDue, lists])

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

  const labelW = desk ? 240 : LABEL_W
  const pxPerDay = desk && boxW > 0 ? Math.max(PX_PER_DAY, (boxW - labelW) / dayCount) : PX_PER_DAY
  const rowH = desk ? 48 : ROW_H
  const timelineW = dayCount * pxPerDay
  const todayOffset = dayDiff(rangeStart, today)

  if (withDue.length === 0)
  {
    return (
      <View style={{ gap: space.md }}>
        <PaneTitle title="Gantt" subtitle="Duração de cada tarefa na linha do tempo." />
        <Card tone="elevated" style={{ borderRadius: 14 }}>
          <EmptyState
            title="Nenhuma tarefa com prazo"
            body="Defina datas nas tarefas para ver o Gantt."
          />
        </Card>
      </View>
    )
  }

  return (
    <View style={{ gap: space.md }}>
      {desk ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <WebSegmented
            options={[
              { id: '7', label: '7 dias' },
              { id: '14', label: '14 dias' },
              { id: '30', label: '30 dias' },
            ]}
            value={String(zoom)}
            onChange={(id) => setZoom(Number(id) as Zoom)}
          />
          <Text style={[LEX.regular, { fontSize: 14, lineHeight: 20, color: colors.inkMuted }]}>
            {withDue.length} com prazo. Cada barra vai de uns dias antes até o vencimento.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          <PaneTitle
            title="Gantt"
            subtitle={`${withDue.length} com prazo · duração de cada tarefa na linha do tempo.`}
          />
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
      )}

      <Card
        tone="elevated"
        style={{ borderRadius: desk ? 12 : 14, padding: 0, overflow: 'hidden' }}
        onLayout={desk ? (e) => setBoxW(e.nativeEvent.layout.width - 2) : undefined}
      >
        <ScrollView
          style={desk ? undefined : { maxHeight: 480 }}
          nestedScrollEnabled
          showsVerticalScrollIndicator
        >
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator
          >
          <View style={{ minWidth: labelW + timelineW }}>
            <View
              style={{
                flexDirection: 'row',
                borderBottomWidth: 1,
                borderBottomColor: colors.hairline,
                backgroundColor: colors.surface,
              }}
            >
              <View style={{ width: labelW, padding: 12, paddingHorizontal: desk ? 16 : 12, justifyContent: 'center' }}>
                <Text variant="micro" muted style={desk ? { fontSize: 13, letterSpacing: 0.2 } : undefined}>
                  {desk ? 'Tarefa' : 'TAREFA'}
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
                        left: i * pxPerDay,
                        width: pxPerDay,
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 40,
                      }}
                    >
                      <Text
                        variant="micro"
                        style={{
                          fontSize: desk ? 13 : 9,
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
                      left: todayOffset * pxPerDay + pxPerDay / 2,
                      top: 0,
                      bottom: 0,
                      width: 2,
                      backgroundColor: colors.axelFill,
                    }}
                  />
                ) : null}
              </View>
            </View>

            {groups.map((group) => (
              <View key={group.id}>
                <View
                  style={{
                    width: labelW + timelineW,
                    paddingHorizontal: desk ? 16 : 10,
                    paddingVertical: 8,
                    backgroundColor: colors.surface,
                  }}
                >
                  <Text variant="micro" style={desk ? [LEX.medium, { fontSize: 14, lineHeight: 20 }] : { fontFamily: 'Lexend_700Bold' }}>
                    {group.label}
                  </Text>
                </View>
                {group.tasks.map((t) =>
                {
                  const end = startOfDay(new Date(`${t.dataVencimento!.slice(0, 10)}T12:00:00`))
                  const start = addDays(end, -Math.max(1, Math.min(4, dayDiff(rangeStart, end))))
                  const left = Math.max(0, dayDiff(rangeStart, start)) * pxPerDay
                  const width = Math.max(pxPerDay, (dayDiff(start, end) + 1) * pxPerDay)
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
                        height: rowH,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.hairline,
                        alignItems: 'center',
                      }}
                    >
                      <View style={{ width: labelW, paddingHorizontal: desk ? 16 : 10 }}>
                        <Text variant="label" numberOfLines={1} style={desk ? [LEX.regular, { fontSize: 14, lineHeight: 20 }] : { fontSize: 13 }}>
                          {t.titulo}
                        </Text>
                      </View>
                      <View style={{ width: timelineW, height: rowH, justifyContent: 'center' }}>
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
            ))}
          </View>
          </ScrollView>
        </ScrollView>
      </Card>
    </View>
  )
}
