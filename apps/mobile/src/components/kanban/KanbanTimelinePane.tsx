import { useMemo, useState } from 'react'
import { View, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import {
  minutesToLabel,
  timelineColorForTask,
  type MobileTask,
} from '@simply-life/shared'
import { Text, EmptyState } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { KanbanDateStrip, buildForwardDays } from './KanbanDateStrip'

type Props = { tasks: MobileTask[] }

const PRI_LABEL: Record<number, string> = { 1: 'Alta', 2: 'Média', 3: 'Baixa' }

function tasksForIso(tasks: MobileTask[], iso: string): MobileTask[]
{
  return tasks
    .filter((t) => t.dataVencimento?.slice(0, 10) === iso)
    .slice()
    .sort((a, b) => (a.horaMinutos ?? 9999) - (b.horaMinutos ?? 9999))
}

function statusLabel(task: MobileTask): string
{
  if (task.status === 'done') return 'Feita'
  if (task.status === 'doing') return 'Em curso'
  return 'A seguir'
}

/** Timeline do dia: faixa de datas + cartões por horário. */
export function KanbanTimelinePane({ tasks }: Props)
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const days = useMemo(() => buildForwardDays(7), [])
  const [dayIso, setDayIso] = useState(days[0]?.iso ?? '')
  const dayTasks = useMemo(() => tasksForIso(tasks, dayIso), [tasks, dayIso])
  const nowMins = new Date().getHours() * 60 + new Date().getMinutes()
  const isToday = dayIso === days[0]?.iso
  const monthLabel = new Date(`${dayIso}T12:00:00`).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <View style={{ gap: space.md }}>
      <Text variant="section" style={{ textTransform: 'capitalize' }}>
        {monthLabel}
      </Text>
      <KanbanDateStrip days={days} selectedIso={dayIso} onSelect={setDayIso} />
      <Text variant="section">Timeline</Text>

      {dayTasks.length === 0 ? (
        <EmptyState title="Sem blocos neste dia" body="Abra a lista para capturar um prazo." icon="time-outline" />
      ) : (
        <View style={{ gap: 12 }}>
          {isToday ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ flex: 1, height: 2, backgroundColor: colors.axel, borderRadius: 999 }} />
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: colors.axel,
                }}
              >
                <Text variant="micro" style={{ color: colors.axelOnFill, fontWeight: '700' }}>
                  {minutesToLabel(nowMins)}
                </Text>
              </View>
            </View>
          ) : null}
          {dayTasks.map((t) =>
          {
            const bg = timelineColorForTask(t)
            const start = t.horaMinutos != null ? minutesToLabel(t.horaMinutos) : '—'
            const end =
              t.horaMinutos != null
                ? minutesToLabel(t.horaMinutos + Math.max(30, t.estimativaMinutos || 30))
                : ''
            return (
              <Pressable
                key={t.id}
                onPress={() => router.push(`/task/${t.id}`)}
                style={{
                  flexDirection: 'row',
                  gap: 10,
                  minHeight: 88,
                }}
              >
                <View style={{ width: 52, paddingTop: 8 }}>
                  <Text variant="micro" muted style={{ fontWeight: '600' }}>
                    {start}
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    borderRadius: 20,
                    backgroundColor: bg,
                    padding: 14,
                    gap: 8,
                    opacity: t.status === 'done' ? 0.7 : 1,
                  }}
                >
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 999,
                        backgroundColor: 'rgba(255,255,255,0.28)',
                      }}
                    >
                      <Text variant="micro" style={{ color: '#FFF', fontWeight: '700' }}>
                        {PRI_LABEL[t.prioridade] ?? 'Média'}
                      </Text>
                    </View>
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 999,
                        backgroundColor: 'rgba(0,0,0,0.18)',
                      }}
                    >
                      <Text variant="micro" style={{ color: '#FFF', fontWeight: '600' }}>
                        {statusLabel(t)}
                      </Text>
                    </View>
                  </View>
                  <Text variant="bodyStrong" style={{ color: '#FFF', fontSize: 16 }}>
                    {t.titulo}
                  </Text>
                  <Text variant="caption" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    {end ? `${start} – ${end}` : start}
                  </Text>
                </View>
              </Pressable>
            )
          })}
        </View>
      )}
    </View>
  )
}
