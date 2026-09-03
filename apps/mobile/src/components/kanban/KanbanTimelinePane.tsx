import { useMemo, useState } from 'react'
import { View, Pressable, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import {
  minutesToLabel,
  timelineIconForTask,
  timelineColorForTask,
  type MobileTask,
} from '@simply-life/shared'
import { Text, EmptyState, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { useCaptureStore } from '../../store/captureStore'

type Props = { tasks: MobileTask[] }

/** Fundo suave da ref “Organize seu dia com clareza” */
const DAY_BG = '#F3F7F2'

function isoOffset(days: number): string
{
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function tasksForIso(tasks: MobileTask[], iso: string): MobileTask[]
{
  return tasks
    .filter((t) => t.dataVencimento?.slice(0, 10) === iso)
    .slice()
    .sort((a, b) => (a.horaMinutos ?? 9999) - (b.horaMinutos ?? 9999))
}

/**
 * Timeline vertical com date strip + nós com ícone colorido (ref verde).
 */
export function KanbanTimelinePane({ tasks }: Props)
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const isGuest = useAuthStore((s) => s.isGuest)
  const toggleTaskDone = useDataStore((s) => s.toggleTaskDone)
  const openCapture = useCaptureStore((s) => s.openCapture)
  const [dayOffset, setDayOffset] = useState(0)

  const strip = useMemo(() =>
  {
    return Array.from({ length: 7 }).map((_, i) =>
    {
      const offset = i
      const iso = isoOffset(offset)
      const date = new Date(`${iso}T12:00:00`)
      return {
        offset,
        iso,
        dayNum: date.getDate(),
        weekday: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
        monthLabel: date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      }
    })
  }, [])

  const selected = strip[dayOffset] ?? strip[0]
  const dayTasks = useMemo(
    () => tasksForIso(tasks, selected.iso),
    [tasks, selected.iso],
  )

  return (
    <View
      style={{
        gap: space.md,
        borderRadius: 24,
        backgroundColor: DAY_BG,
        padding: space.md,
        overflow: 'hidden',
      }}
    >
      {/* Cabeçalho mês + bookmark */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text
          variant="section"
          style={{ fontSize: 18, textTransform: 'capitalize', color: '#1F2A24' }}
        >
          {selected.monthLabel}
        </Text>
        <PressableScale
          accessibilityLabel="Abrir calendário"
          onPress={() => router.push('/calendario')}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FFF',
          }}
        >
          <Ionicons name="bookmark-outline" size={20} color="#E85D4C" />
        </PressableScale>
      </View>

      {/* Date strip horizontal */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
      >
        {strip.map((d) =>
        {
          const active = d.offset === dayOffset
          return (
            <Pressable
              key={d.iso}
              onPress={() => setDayOffset(d.offset)}
              style={{
                width: 52,
                minHeight: 64,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                backgroundColor: active ? '#FFF' : 'transparent',
                borderWidth: active ? 1 : 0,
                borderColor: 'rgba(31,42,36,0.08)',
              }}
            >
              <Text
                variant="micro"
                style={{
                  color: active ? '#1F2A24' : '#8A968E',
                  textTransform: 'capitalize',
                  fontWeight: '600',
                }}
              >
                {d.weekday}
              </Text>
              <Text
                variant="bodyStrong"
                style={{
                  fontSize: 18,
                  color: active ? '#1F2A24' : '#8A968E',
                }}
              >
                {d.dayNum}
              </Text>
              {active ? (
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    backgroundColor: '#3DBE8B',
                  }}
                />
              ) : (
                <View style={{ height: 6 }} />
              )}
            </Pressable>
          )
        })}
      </ScrollView>

      {/* Spine vertical */}
      {dayTasks.length === 0 ? (
        <EmptyState
          title="Dia livre"
          body="Nada com prazo neste dia. Capture um bloco."
          icon="sunny-outline"
        />
      ) : (
        <View style={{ gap: 0, paddingTop: space.sm }}>
          {dayTasks.map((t, i) =>
          {
            const color = timelineColorForTask(t)
            const icon = timelineIconForTask(t) as keyof typeof Ionicons.glyphMap
            const last = i === dayTasks.length - 1
            return (
              <View key={t.id} style={{ flexDirection: 'row', gap: 14, minHeight: 72 }}>
                {/* Coluna do nó + linha */}
                <View style={{ width: 44, alignItems: 'center' }}>
                  <PressableScale
                    accessibilityLabel={t.status === 'done' ? 'Reabrir' : 'Concluir'}
                    onPress={() => void toggleTaskDone(t.id, isGuest)}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 999,
                      backgroundColor: t.status === 'done' ? colors.health : color,
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1,
                    }}
                  >
                    <Ionicons
                      name={t.status === 'done' ? 'checkmark' : icon}
                      size={20}
                      color="#FFF"
                    />
                  </PressableScale>
                  {!last ? (
                    <View
                      style={{
                        width: 3,
                        flex: 1,
                        minHeight: 28,
                        backgroundColor: 'rgba(61, 190, 139, 0.28)',
                        borderRadius: 999,
                        marginTop: -2,
                      }}
                    />
                  ) : null}
                </View>

                <Pressable
                  onPress={() => router.push(`/task/${t.id}`)}
                  style={{
                    flex: 1,
                    paddingTop: 8,
                    paddingBottom: last ? 8 : 20,
                    gap: 4,
                  }}
                >
                  {t.horaMinutos != null ? (
                    <Text variant="micro" style={{ color: '#8A968E', fontWeight: '600' }}>
                      {minutesToLabel(t.horaMinutos)}
                    </Text>
                  ) : null}
                  <Text
                    variant="bodyStrong"
                    style={{
                      fontSize: 16,
                      color: '#1F2A24',
                      textDecorationLine: t.status === 'done' ? 'line-through' : 'none',
                      opacity: t.status === 'done' ? 0.55 : 1,
                    }}
                  >
                    {t.titulo}
                  </Text>
                </Pressable>
              </View>
            )
          })}
        </View>
      )}

      {/* FAB rosa - capturar (ref) */}
      <View style={{ alignItems: 'flex-end', marginTop: space.sm }}>
        <PressableScale
          accessibilityLabel="Nova tarefa"
          onPress={() => openCapture('dump')}
          style={{
            width: 56,
            height: 56,
            borderRadius: 999,
            backgroundColor: '#FF6B9D',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="add" size={28} color="#FFF" />
        </PressableScale>
      </View>
    </View>
  )
}
