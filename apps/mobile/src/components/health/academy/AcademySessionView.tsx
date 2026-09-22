import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  academyDayLabel,
  academyWeekKey,
  findHabit,
  resolveAcademyDay,
  weekPlanFromConfig,
  XP_FOCUS_SESSION,
} from '@simply-life/shared'
import { PrimaryButton } from '../../../ui'
import { ThemeProvider } from '../../../theme/ThemeProvider'
import { useKeepAwake } from '../../../lib/keepAwake'
import { safeBack } from '../../../lib/safeBack'
import { hapticLight } from '../../../lib/haptics'
import { useAuthStore } from '../../../store/authStore'
import { useDataStore } from '../../../store/dataStore'
import { useGamificationStore } from '../../../store/gamificationStore'
import {
  academyCurrentStep,
  academyNextStep,
  useAcademySessionStore,
} from '../../../store/academySessionStore'
import { AcademySessionStage } from './AcademySessionStage'

/** Treino em tela cheia: OLED quase apagada, descanso no restSec de cada exercício. */
export function AcademySessionView()
{
  return (
    <ThemeProvider forceMode="dark">
      <AcademySessionInner />
    </ThemeProvider>
  )
}

function AcademySessionInner()
{
  useKeepAwake()
  const router = useRouter()
  const isGuest = useAuthStore((s) => s.isGuest)
  const habits = useDataStore((s) => s.habits)
  const toggleTreinoDone = useDataStore((s) => s.toggleTreinoDone)
  const grantXp = useGamificationStore((s) => s.grantXp)
  const plan = useMemo(
    () => resolveAcademyDay(weekPlanFromConfig(findHabit(habits, 'treino')?.config)),
    [habits],
  )
  const setPlan = useAcademySessionStore((s) => s.setPlan)
  const phase = useAcademySessionStore((s) => s.phase)
  const stepIndex = useAcademySessionStore((s) => s.stepIndex)
  const restLeft = useAcademySessionStore((s) => s.restLeft)
  const workLeft = useAcademySessionStore((s) => s.workLeft)
  const setElapsed = useAcademySessionStore((s) => s.setElapsed)
  const elapsedSec = useAcademySessionStore((s) => s.elapsedSec)
  const start = useAcademySessionStore((s) => s.start)
  const completeSet = useAcademySessionStore((s) => s.completeSet)
  const skipRest = useAcademySessionStore((s) => s.skipRest)
  const tick = useAcademySessionStore((s) => s.tick)
  const reset = useAcademySessionStore((s) => s.reset)
  const restDay = plan.length === 0

  useLayoutEffect(() =>
  {
    setPlan(plan)
  }, [plan, setPlan])
  const prevPhase = useRef(phase)
  const step = academyCurrentStep(stepIndex)
  const upcoming = academyNextStep(stepIndex)
  const timedHold = Boolean(step?.workSec)

  useEffect(() => () => reset(), [reset])

  useEffect(() =>
  {
    if (phase === 'ready' || phase === 'done') return
    const id = setInterval(() => tick(), 250)
    return () => clearInterval(id)
  }, [phase, tick])

  useEffect(() =>
  {
    if (prevPhase.current === 'rest' && (phase === 'work' || phase === 'done'))
    {
      hapticLight()
    }
    prevPhase.current = phase
  }, [phase])

  const leave = () =>
  {
    reset()
    safeBack(router, '/(tabs)/saude?section=cuidados&care=academia')
  }

  const finishDay = () =>
  {
    grantXp(XP_FOCUS_SESSION, 'Sessão de treino')
    const treino = findHabit(habits, 'treino')
    const meta = treino?.metaDiaria || 1
    if (treino && treino.progressoAtual < meta)
    {
      void toggleTreinoDone(isGuest)
    }
    leave()
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }} edges={['top', 'bottom']}>
      <StatusBar hidden style="light" />
      <View style={{ flex: 1, padding: 24, gap: 18, justifyContent: 'space-between' }}>
        <AcademySessionStage
          phase={phase}
          step={step}
          upcoming={upcoming}
          restLeft={restLeft}
          workLeft={workLeft}
          setElapsed={setElapsed}
          elapsedSec={elapsedSec}
          plan={plan}
          dayLabel={academyDayLabel(academyWeekKey())}
        />
        <View style={{ gap: 10 }}>
          {phase === 'ready' && !restDay ? <PrimaryButton label="Começar" onPress={start} /> : null}
          {phase === 'work' && !timedHold ? (
            <PrimaryButton label="Terminei esta série" onPress={completeSet} />
          ) : null}
          {phase === 'work' && timedHold ? (
            <PrimaryButton label="Terminei antes" variant="ghost" onPress={completeSet} />
          ) : null}
          {phase === 'rest' ? (
            <PrimaryButton label="Pular descanso" variant="ghost" onPress={skipRest} />
          ) : null}
          {phase === 'done' ? (
            <PrimaryButton label="Marcar o dia e sair" onPress={finishDay} />
          ) : null}
          <PrimaryButton
            label={phase === 'done' ? 'Sair sem marcar' : 'Sair'}
            variant="ghost"
            onPress={leave}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}
