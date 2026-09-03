import { useEffect, useMemo, useRef } from 'react'
import { View, Pressable, ScrollView } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import Svg, { Circle, G } from 'react-native-svg'
import { SafeAreaView } from 'react-native-safe-area-context'
import { priorityTodayTasks, XP_FOCUS_SESSION } from '@simply-life/shared'
import { Text, PressableScale } from '../src/ui'
import { useAuthStore } from '../src/store/authStore'
import { useFocusStore } from '../src/store/focusStore'
import { usePrefsStore } from '../src/store/prefsStore'
import { useDataStore } from '../src/store/dataStore'
import { useGamificationStore } from '../src/store/gamificationStore'

/** Rosa da ref - timer de tarefa (layout exacto, superfície clara) */
const FOCUS_PINK = '#FF6B9D'
const FOCUS_PINK_SOFT = 'rgba(255, 107, 157, 0.14)'
const FOCUS_TRACK = 'rgba(255, 107, 157, 0.18)'
const INK = '#1A1A1A'
const MUTED = '#8A8A8A'
const PAGE_BG = '#FAFAFA'

function mmss(total: number): string
{
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function FocusHeroRing({
  progress,
  minutesLabel,
  timeLabel,
}: {
  progress: number
  minutesLabel: string
  timeLabel: string
})
{
  const size = 220
  const stroke = 10
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, progress))
  const filled = (pct / 100) * c

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={FOCUS_TRACK}
          strokeWidth={stroke}
          fill="none"
        />
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={FOCUS_PINK}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${filled} ${Math.max(0, c - filled)}`}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center', gap: 4 }}>
        <Text
          variant="hero"
          style={{ fontSize: 64, letterSpacing: -2, color: FOCUS_PINK, fontVariant: ['tabular-nums'] }}
        >
          {minutesLabel}
        </Text>
        <Text
          variant="title"
          style={{ fontSize: 28, color: INK, fontVariant: ['tabular-nums'], letterSpacing: -0.5 }}
        >
          {timeLabel}
        </Text>
      </View>
    </View>
  )
}

export default function FocoScreen()
{
  const userId = useAuthStore((s) => s.userId)
  const isGuest = useAuthStore((s) => s.isGuest)
  const router = useRouter()
  const prefs = usePrefsStore((s) => s.prefs)
  const tasks = useDataStore((s) => s.tasks) ?? []
  const toggleTaskDone = useDataStore((s) => s.toggleTaskDone)
  const grantXp = useGamificationStore((s) => s.grantXp)

  const phase = useFocusStore((s) => s.phase)
  const remainingSec = useFocusStore((s) => s.remainingSec)
  const durationSec = useFocusStore((s) => s.durationSec)
  const running = useFocusStore((s) => s.running)
  const cycles = useFocusStore((s) => s.cycles)
  const targetTaskId = useFocusStore((s) => s.targetTaskId)
  const completedFocusSessions = useFocusStore((s) => s.completedFocusSessions)
  const start = useFocusStore((s) => s.start)
  const pause = useFocusStore((s) => s.pause)
  const resume = useFocusStore((s) => s.resume)
  const reset = useFocusStore((s) => s.reset)
  const tick = useFocusStore((s) => s.tick)
  const setTargetTask = useFocusStore((s) => s.setTargetTask)

  const lastAwarded = useRef(0)

  const priority = useMemo(() => priorityTodayTasks(tasks, new Date(), 8), [tasks])
  const currentTask = useMemo(() =>
  {
    if (targetTaskId)
    {
      const found = tasks.find((t) => t.id === targetTaskId)
      if (found && found.status !== 'done') return found
    }
    return priority.find((p) => p.task.status !== 'done')?.task ?? null
  }, [targetTaskId, tasks, priority])

  const todayIso = new Date().toISOString().slice(0, 10)
  const doneToday = useMemo(
    () => tasks.filter((t) => t.status === 'done' && t.dataVencimento?.slice(0, 10) === todayIso),
    [tasks, todayIso],
  )

  useEffect(() =>
  {
    if (!running) return
    const t = setInterval(() => tick(), 1000)
    return () => clearInterval(t)
  }, [running, tick])

  useEffect(() =>
  {
    if (completedFocusSessions <= lastAwarded.current) return
    lastAwarded.current = completedFocusSessions
    grantXp(XP_FOCUS_SESSION, 'Sessão de foco', currentTask?.titulo ?? 'Deep work')
  }, [completedFocusSessions, grantXp, currentTask?.titulo])

  useEffect(() =>
  {
    if (!targetTaskId && currentTask) setTargetTask(currentTask.id)
  }, [targetTaskId, currentTask, setTargetTask])

  if (!userId) return <Redirect href="/login" />

  const progress =
    durationSec > 0 ? ((durationSec - remainingSec) / durationSec) * 100 : 0
  const minutesLeft = Math.max(0, Math.ceil(remainingSec / 60))
  const displayRemaining =
    phase === 'idle' && remainingSec === 0
      ? prefs.pomodoro_focus * 60
      : remainingSec || prefs.pomodoro_focus * 60

  const onPlay = () =>
  {
    if (running)
    {
      pause()
      return
    }
    if (phase !== 'idle' && remainingSec > 0)
    {
      resume()
      return
    }
    start(prefs.pomodoro_focus, 'focus', currentTask?.id ?? null)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: PAGE_BG }} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.05)',
            }}
          >
            <Ionicons name="chevron-back" size={22} color={INK} />
          </Pressable>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="title" style={{ color: INK, fontSize: 18 }}>
              Temporizador de tarefas
            </Text>
            <Text variant="caption" style={{ color: MUTED }}>
              Não se preocupe, vamos lembrá-lo
            </Text>
          </View>
        </View>

        <View style={{ gap: 24, alignItems: 'center', paddingTop: 12 }}>
          <FocusHeroRing
            progress={phase === 'idle' && !running ? 8 : progress}
            minutesLabel={String(minutesLeft || prefs.pomodoro_focus)}
            timeLabel={mmss(running || phase !== 'idle' ? remainingSec : displayRemaining)}
          />

          <View style={{ width: '100%', gap: 10 }}>
            <Pressable
              onPress={() =>
              {
                if (currentTask) router.push(`/task/${currentTask.id}`)
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                minHeight: 52,
                paddingVertical: 8,
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  borderWidth: 2,
                  borderColor: FOCUS_PINK,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: FOCUS_PINK_SOFT,
                }}
              >
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    backgroundColor: FOCUS_PINK,
                  }}
                />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="caption" style={{ fontSize: 12, color: MUTED }}>
                  Tarefa atual
                </Text>
                <Text variant="bodyStrong" numberOfLines={1} style={{ color: INK, fontSize: 16 }}>
                  {currentTask?.titulo ?? 'Nenhuma tarefa - capture uma'}
                </Text>
              </View>
              {currentTask ? (
                <PressableScale
                  accessibilityLabel="Concluir tarefa"
                  onPress={() => void toggleTaskDone(currentTask.id, isGuest)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: FOCUS_PINK_SOFT,
                  }}
                >
                  <Ionicons name="checkmark" size={20} color={FOCUS_PINK} />
                </PressableScale>
              ) : null}
            </Pressable>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                minHeight: 48,
                paddingVertical: 6,
                borderTopWidth: 1,
                borderTopColor: 'rgba(0,0,0,0.06)',
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  backgroundColor: FOCUS_PINK,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="checkmark" size={16} color="#FFF" />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong" style={{ color: INK, fontSize: 15 }}>
                  O tempo trabalhou hoje
                </Text>
                <Text variant="caption" style={{ color: MUTED }}>
                  {doneToday.length} concluída{doneToday.length === 1 ? '' : 's'} · {cycles} ciclo
                  {cycles === 1 ? '' : 's'}
                </Text>
              </View>
            </View>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 28,
              marginTop: 8,
            }}
          >
            <PressableScale
              accessibilityLabel={running ? 'Pausar' : 'Iniciar foco'}
              onPress={onPlay}
              style={{
                width: 72,
                height: 72,
                borderRadius: 999,
                backgroundColor: FOCUS_PINK,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name={running ? 'pause' : 'play'}
                size={32}
                color="#FFF"
                style={{ marginLeft: running ? 0 : 3 }}
              />
            </PressableScale>
            <PressableScale
              accessibilityLabel="Resetar timer"
              onPress={() => reset(prefs.pomodoro_focus)}
              style={{
                width: 52,
                height: 52,
                borderRadius: 999,
                backgroundColor: INK,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="refresh" size={22} color="#FFF" />
            </PressableScale>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <PressableScale
              onPress={() => start(prefs.pomodoro_short, 'short')}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: FOCUS_PINK_SOFT,
                minHeight: 40,
              }}
            >
              <Text variant="label" style={{ color: FOCUS_PINK }}>
                Pausa {prefs.pomodoro_short}m
              </Text>
            </PressableScale>
            <PressableScale
              onPress={() => start(prefs.pomodoro_long, 'long')}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: 'rgba(0,0,0,0.06)',
                minHeight: 40,
              }}
            >
              <Text variant="label" style={{ color: MUTED }}>
                Longa {prefs.pomodoro_long}m
              </Text>
            </PressableScale>
            <PressableScale
              onPress={() => router.push('/(tabs)/kanban')}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: 'rgba(0,0,0,0.06)',
                minHeight: 40,
              }}
            >
              <Text variant="label" style={{ color: MUTED }}>
                Trocar tarefa
              </Text>
            </PressableScale>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
