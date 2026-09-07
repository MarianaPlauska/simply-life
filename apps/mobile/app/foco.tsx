import { useEffect, useMemo, useRef } from 'react'
import { View, Pressable, ScrollView } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { priorityTodayTasks, XP_FOCUS_SESSION } from '@simply-life/shared'
import { Text, PressableScale, Chip } from '../src/ui'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAuthStore } from '../src/store/authStore'
import { useFocusStore } from '../src/store/focusStore'
import { usePrefsStore } from '../src/store/prefsStore'
import { useDataStore } from '../src/store/dataStore'
import { useGamificationStore } from '../src/store/gamificationStore'
import { ExecuteTimerFace } from '../src/components/timer/ExecuteTimerFace'

const PRESETS = [10, 15, 25, 30, 45, 60]

export default function FocoScreen()
{
  const { colors } = useTheme()
  const userId = useAuthStore((s) => s.userId)
  const isGuest = useAuthStore((s) => s.isGuest)
  const router = useRouter()
  const prefs = usePrefsStore((s) => s.prefs)
  const tasks = useDataStore((s) => s.tasks) ?? []
  const toggleTaskDone = useDataStore((s) => s.toggleTaskDone)
  const grantXp = useGamificationStore((s) => s.grantXp)

  const remainingSec = useFocusStore((s) => s.remainingSec)
  const durationSec = useFocusStore((s) => s.durationSec)
  const running = useFocusStore((s) => s.running)
  const phase = useFocusStore((s) => s.phase)
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

  const goalMin = Math.max(1, Math.round((durationSec || prefs.pomodoro_focus * 60) / 60))
  const display =
    phase === 'idle' && remainingSec === 0
      ? prefs.pomodoro_focus * 60
      : remainingSec || prefs.pomodoro_focus * 60

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

  const onToggle = () =>
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
    start(Math.max(1, Math.round(display / 60)), 'focus', currentTask?.id ?? null)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Fechar"
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="close" size={22} color={colors.ink} />
          </Pressable>
          <View style={{ flex: 1 }} />
        </View>

        <ExecuteTimerFace
          remainingSec={display}
          durationSec={durationSec || prefs.pomodoro_focus * 60}
          running={running}
          onToggle={onToggle}
        />

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
              borderColor: colors.axel,
            }}
          />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="caption" muted>
              Tarefa atual
            </Text>
            <Text variant="bodyStrong" numberOfLines={1}>
              {currentTask?.titulo ?? 'Nenhuma tarefa — capture uma'}
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
                backgroundColor: colors.axelMuted,
              }}
            >
              <Ionicons name="checkmark" size={20} color={colors.axel} />
            </PressableScale>
          ) : null}
        </Pressable>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {PRESETS.map((mins) => (
            <Chip
              key={mins}
              label={`${mins}m`}
              active={goalMin === mins && (running || phase !== 'idle')}
              onPress={() => reset(mins)}
            />
          ))}
        </View>

        <Text variant="caption" muted>
          {cycles} ciclo{cycles === 1 ? '' : 's'} hoje. Pause no botão — o setor cobre o tempo já feito.
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}
