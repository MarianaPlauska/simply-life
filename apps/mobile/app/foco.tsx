import { useEffect, useMemo, useRef, useState } from 'react'
import { View, Pressable, ScrollView } from 'react-native'
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  buildVisualDay,
  firstTinyStep,
  learnedFactorFor,
  formatMinutesPt,
  localTodayIso,
  nowAndNext,
  priorityTodayTasks,
  timerMilestonesCrossed,
  TIMER_MILESTONE_COPY,
  XP_FOCUS_SESSION,
  type TimerMilestone,
} from '@simply-life/shared'
import { Text, PressableScale, Chip } from '../src/ui'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAuthStore } from '../src/store/authStore'
import { useFocusStore } from '../src/store/focusStore'
import { usePrefsStore } from '../src/store/prefsStore'
import { useDataStore } from '../src/store/dataStore'
import { useGamificationStore } from '../src/store/gamificationStore'
import { ExecuteTimerFace } from '../src/components/timer/ExecuteTimerFace'
import { useNeuroStore } from '../src/store/neuroStore'
import { useCalendarStore } from '../src/store/calendarStore'
import { cancelFocusEnd, scheduleFocusEnd } from '../src/lib/pushNotifications'
import { hapticLight } from '../src/lib/haptics'
import { useTimeLearning } from '../src/lib/timeLearning'

const PRESETS = [10, 15, 25, 30, 45, 60]

export default function FocoScreen()
{
  const { colors } = useTheme()
  const userId = useAuthStore((s) => s.userId)
  const isGuest = useAuthStore((s) => s.isGuest)
  const router = useRouter()
  const params = useLocalSearchParams<{ taskId?: string | string[] }>()
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

  const timeAlerts = useNeuroStore((s) => s.timeAlerts)
  const hyperfocusGuardMin = useNeuroStore((s) => s.hyperfocusGuardMin)
  const estimateFactor = useNeuroStore((s) => s.estimateFactor)
  const hydrateNeuro = useNeuroStore((s) => s.hydrate)
  const calendarEvents = useCalendarStore((s) => s.events)
  const learning = useTimeLearning()
  const [milestone, setMilestone] = useState<TimerMilestone | null>(null)
  const prevElapsed = useRef(0)

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
    void hydrateNeuro()
  }, [hydrateNeuro])

  // cegueira temporal: avisa uma vez em cada marco (metade, faltam 5, fim, hiperfoco)
  const elapsedSec = durationSec > 0 ? durationSec - remainingSec : 0
  useEffect(() =>
  {
    if (phase !== 'focus')
    {
      prevElapsed.current = 0
      return
    }
    const hit = timerMilestonesCrossed(durationSec, prevElapsed.current, elapsedSec, { timeAlerts, hyperfocusGuardMin })
    prevElapsed.current = elapsedSec
    if (hit.length)
    {
      setMilestone(hit[hit.length - 1])
      hapticLight()
    }
  }, [elapsedSec, durationSec, phase, timeAlerts, hyperfocusGuardMin])

  // fim do timer avisa mesmo com o app fechado
  useEffect(() =>
  {
    if (running && phase === 'focus') void scheduleFocusEnd(remainingSec, currentTask?.titulo ?? null)
    else void cancelFocusEnd()
    // só quando liga/desliga, não a cada segundo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, phase])

  useEffect(() =>
  {
    if (completedFocusSessions <= lastAwarded.current) return
    lastAwarded.current = completedFocusSessions
    grantXp(XP_FOCUS_SESSION, 'Sessão de foco', currentTask?.titulo ?? 'Deep work')
  }, [completedFocusSessions, grantXp, currentTask?.titulo])

  useEffect(() =>
  {
    const raw = Array.isArray(params.taskId) ? params.taskId[0] : params.taskId
    if (raw) setTargetTask(raw)
  }, [params.taskId, setTargetTask])

  useEffect(() =>
  {
    // tarefa vinda pelo link (?taskId) tem prioridade: não sobrescrever com a sugestão
    const raw = Array.isArray(params.taskId) ? params.taskId[0] : params.taskId
    if (!raw && !targetTaskId && currentTask) setTargetTask(currentTask.id)
  }, [targetTaskId, currentTask, setTargetTask, params.taskId])

  // o que vem depois (agenda + tarefas encaixadas): transição sem susto
  const upcoming = useMemo(() =>
  {
    const day = buildVisualDay({ date: localTodayIso(), tasks, events: calendarEvents, estimateFactor })
    return nowAndNext(day, new Date(), 2).next.find((b) => b.taskId !== currentTask?.id) ?? null
  }, [tasks, calendarEvents, estimateFactor, currentTask?.id])
  const taskMinutes = currentTask
    ? Math.max(5, Math.round((currentTask.estimativaMinutos || 25) * (1 - (currentTask.progresso || 0))
      * learnedFactorFor(currentTask.titulo, learning, estimateFactor) / 5) * 5)
    : null

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
              onPress={() =>
              {
                // o tempo feito até aqui conta para aprender o seu ritmo
                useFocusStore.getState().flush()
                void toggleTaskDone(currentTask.id, isGuest)
              }}
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

        {currentTask ? (
          <Text variant="body" muted>
            Comece por: {firstTinyStep(currentTask.titulo, currentTask.checklist).toLowerCase()}.
          </Text>
        ) : null}

        {milestone ? (
          <Pressable
            onPress={() => setMilestone(null)}
            accessibilityRole="alert"
            style={{ padding: 12, borderRadius: 14, backgroundColor: colors.axelMuted, flexDirection: 'row', gap: 8, alignItems: 'center' }}
          >
            <Ionicons name={milestone === 'hiperfoco' ? 'cafe-outline' : 'time-outline'} size={18} color={colors.axel} />
            <Text variant="body" style={{ flex: 1, fontSize: 14 }}>{TIMER_MILESTONE_COPY[milestone]}</Text>
            <Ionicons name="close" size={16} color={colors.inkMuted} />
          </Pressable>
        ) : null}

        {phase === 'focus' && durationSec > 0 ? (
          <Text variant="bodyStrong" accessibilityLiveRegion="polite">
            Restam {formatMinutesPt(Math.ceil(remainingSec / 60))} · já foram {formatMinutesPt(Math.floor(elapsedSec / 60))}
          </Text>
        ) : null}

        {upcoming ? (
          <Text variant="caption" muted>
            Depois disso: {upcoming.titulo} às {Math.floor(upcoming.inicio / 60)}:{String(upcoming.inicio % 60).padStart(2, '0')}
            {upcoming.fixed ? ' (horário marcado)' : ''}
          </Text>
        ) : null}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {taskMinutes && !PRESETS.includes(taskMinutes) ? (
            <Chip
              label={`Tempo da tarefa · ${formatMinutesPt(taskMinutes)}`}
              active={goalMin === taskMinutes && (running || phase !== 'idle')}
              onPress={() => reset(taskMinutes)}
            />
          ) : null}
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
