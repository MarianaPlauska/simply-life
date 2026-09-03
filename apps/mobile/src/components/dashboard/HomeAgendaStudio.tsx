import { useMemo, useState } from 'react'
import { View, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import {
  minutesToLabel,
  priorityTodayTasks,
  partitionTodayTimeline,
  classifyDueBucket,
  type MobileTask,
} from '@simply-life/shared'
import {
  Text,
  PrimaryButton,
  StatusPill,
  EmptyState,
  PressableScale,
} from '../../ui'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme/ThemeProvider'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { ExpandableSection } from './ExpandableSection'

type Props = {
  tasks: MobileTask[]
}

type DayMode = 'dia' | 'semana'

function isoOffset(days: number): string
{
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function chipColor(
  bucket: string,
  colors: { danger: string; axel: string; health: string; finance: string; inkMuted: string },
): string
{
  if (bucket === 'vencido') return colors.danger
  if (bucket === 'hoje') return colors.axel
  if (bucket === 'esta_semana') return colors.finance
  if (bucket === 'proxima_semana') return colors.health
  return colors.inkMuted
}

/**
 * Agenda / Kanban na Home - dia colorido + faixa de semana (refs calendário).
 */
export function HomeAgendaStudio({ tasks }: Props)
{
  const { colors, space, radius } = useTheme()
  const router = useRouter()
  const isGuest = useAuthStore((s) => s.isGuest)
  const toggleTaskDone = useDataStore((s) => s.toggleTaskDone)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<DayMode>('dia')

  const priority = useMemo(() => priorityTodayTasks(tasks, new Date(), 6), [tasks])
  const timeline = useMemo(() => partitionTodayTimeline(tasks), [tasks])
  const pending = priority.length

  const weekDays = useMemo(() =>
  {
    return Array.from({ length: 7 }).map((_, i) =>
    {
      const iso = isoOffset(i)
      const label = new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: 'numeric',
      })
      const dayTasks = tasks.filter(
        (t) => t.status !== 'done' && t.dataVencimento?.slice(0, 10) === iso,
      )
      return { iso, label, dayTasks, offset: i }
    })
  }, [tasks])

  const summaryList = priority.slice(0, 3)

  return (
    <ExpandableSection
      title="Agenda & Kanban"
      subtitle={pending === 0 ? 'Nada urgente' : `${pending} no radar de hoje`}
      pill={pending === 0 ? 'ok' : `${pending}`}
      pillColor={pending === 0 ? colors.health : colors.axel}
      accent={colors.axel}
      expanded={open}
      onToggle={() => setOpen((v) => !v)}
      summary={
        <View style={{ gap: 6 }}>
          {summaryList.length === 0 ? (
            <Text variant="caption" muted>
              Dia leve. Expanda para ver a semana.
            </Text>
          ) : (
            summaryList.map(({ task, bucket }) => (
              <View
                key={task.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingVertical: 4,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    backgroundColor: chipColor(bucket, colors),
                  }}
                />
                <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
                  {task.titulo}
                </Text>
                <Text variant="caption" muted>
                  {task.horaMinutos != null ? minutesToLabel(task.horaMinutos) : '-'}
                </Text>
              </View>
            ))
          )}
        </View>
      }
    >
      {/* Toggle Dia / Semana */}
      <View
        style={{
          flexDirection: 'row',
          gap: 8,
          padding: 4,
          borderRadius: 999,
          backgroundColor: colors.surface,
          alignSelf: 'flex-start',
        }}
      >
        {([
          { id: 'dia' as const, label: 'Dia' },
          { id: 'semana' as const, label: 'Semana' },
        ]).map((tab) => (
          <Pressable
            key={tab.id}
            onPress={() => setMode(tab.id)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 999,
              minHeight: 36,
              backgroundColor: mode === tab.id ? colors.axelMuted : 'transparent',
            }}
          >
            <Text
              variant="label"
              color={mode === tab.id ? colors.axel : colors.inkMuted}
              style={{ fontWeight: '700' }}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {mode === 'dia' ? (
        <View style={{ gap: space.sm }}>
          {timeline.length === 0 && priority.length === 0 ? (
            <EmptyState title="Agenda livre" body="Capture uma tarefa ou abra o Kanban." />
          ) : (
            (priority.length ? priority.map((p) => p.task) : timeline).map((task) =>
            {
              const bucket = classifyDueBucket(task.dataVencimento, task.status)
              const color = chipColor(bucket, colors)
              const bg =
                bucket === 'vencido'
                  ? 'rgba(232, 107, 107, 0.12)'
                  : bucket === 'hoje'
                    ? colors.axelMuted
                    : colors.healthMuted
              return (
                <Pressable
                  key={task.id}
                  onPress={() => router.push(`/task/${task.id}`)}
                  style={{
                    flexDirection: 'row',
                    gap: 10,
                    padding: space.md,
                    borderRadius: 14,
                    backgroundColor: bg,
                    borderWidth: 1,
                    borderColor: colors.hairline,
                    minHeight: 56,
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 4,
                      alignSelf: 'stretch',
                      borderRadius: 999,
                      backgroundColor: color,
                    }}
                  />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text variant="bodyStrong">{task.titulo}</Text>
                    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                      <StatusPill
                        label={
                          task.horaMinutos != null
                            ? minutesToLabel(task.horaMinutos)
                            : 'Sem hora'
                        }
                        color={color}
                      />
                      <StatusPill
                        label={
                          bucket === 'vencido'
                            ? 'Atrasada'
                            : bucket === 'hoje'
                              ? 'Hoje'
                              : bucket === 'esta_semana'
                                ? 'Semana'
                                : bucket === 'proxima_semana'
                                  ? 'Próx.'
                                  : 'Sem prazo'
                        }
                        color={color}
                      />
                    </View>
                  </View>
                  <PressableScale
                    accessibilityLabel="Concluir tarefa"
                    onPress={() => void toggleTaskDone(task.id, isGuest)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.elevated,
                    }}
                  >
                    <Ionicons
                      name={task.status === 'done' ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={task.status === 'done' ? colors.health : colors.inkMuted}
                    />
                  </PressableScale>
                </Pressable>
              )
            })
          )}
        </View>
      ) : (
        <View style={{ gap: space.sm }}>
          {weekDays.map((day) => (
            <View
              key={day.iso}
              style={{
                gap: 8,
                padding: space.sm,
                borderRadius: 14,
                backgroundColor: day.offset === 0 ? colors.axelMuted : colors.surface,
                borderWidth: 1,
                borderColor: colors.hairline,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="label" style={{ textTransform: 'capitalize' }}>
                  {day.label}
                  {day.offset === 0 ? ' · hoje' : ''}
                </Text>
                <Text variant="caption" muted>
                  {day.dayTasks.length} tarefa{day.dayTasks.length === 1 ? '' : 's'}
                </Text>
              </View>
              {day.dayTasks.length === 0 ? (
                <Text variant="caption" muted>
                  -
                </Text>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {day.dayTasks.slice(0, 4).map((t) =>
                  {
                    const bucket = classifyDueBucket(t.dataVencimento, t.status)
                    const color = chipColor(bucket, colors)
                    return (
                      <Pressable
                        key={t.id}
                        onPress={() => router.push(`/task/${t.id}`)}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 10,
                          backgroundColor: colors.elevated,
                          borderLeftWidth: 3,
                          borderLeftColor: color,
                          maxWidth: '100%',
                        }}
                      >
                        <Text variant="caption" numberOfLines={1} style={{ fontWeight: '600' }}>
                          {t.horaMinutos != null ? `${minutesToLabel(t.horaMinutos)} · ` : ''}
                          {t.titulo}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <PrimaryButton
          label="Abrir Kanban"
          size="sm"
          onPress={() => router.push('/(tabs)/kanban')}
          style={{ borderRadius: 999 }}
        />
        <PrimaryButton
          label="Calendário"
          size="sm"
          variant="secondary"
          onPress={() => router.push('/calendario')}
          style={{ borderRadius: 999 }}
        />
      </View>
    </ExpandableSection>
  )
}
