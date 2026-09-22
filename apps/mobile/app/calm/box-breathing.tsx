import { useEffect } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { BOX_CYCLE_COUNT, boxElapsedSec, boxTotalSec, calmExerciseById } from '@simply-life/shared'
import { PrimaryButton, Text } from '../../src/ui'
import { CalmExerciseChrome } from '../../src/components/calm/CalmExerciseChrome'
import { CalmBreathVisual } from '../../src/components/calm/CalmBreathVisual'
import { useCalmStore } from '../../src/store/calmStore'
import { useTheme } from '../../src/theme/ThemeProvider'

/** Respiração box: 4 tempos de 4 s, cerca de 2 minutos. */
export default function BoxBreathingScreen()
{
  const { space } = useTheme()
  const router = useRouter()
  const status = useCalmStore((s) => s.status)
  const phase = useCalmStore((s) => s.phase)
  const remainingSec = useCalmStore((s) => s.remainingSec)
  const cycle = useCalmStore((s) => s.cycle)
  const running = useCalmStore((s) => s.running)
  const start = useCalmStore((s) => s.start)
  const pause = useCalmStore((s) => s.pause)
  const resume = useCalmStore((s) => s.resume)
  const tick = useCalmStore((s) => s.tick)
  const reset = useCalmStore((s) => s.reset)

  useEffect(() =>
  {
    start('box_breathing')
    return () => reset()
  }, [start, reset])

  useEffect(() =>
  {
    if (!running) return
    const t = setInterval(() => tick(), 1000)
    return () => clearInterval(t)
  }, [running, tick])

  const progress = status === 'done'
    ? 1
    : boxElapsedSec(cycle, phase, remainingSec) / boxTotalSec()

  if (status === 'done')
  {
    return (
      <CalmExerciseChrome title={calmExerciseById('box_breathing')?.title ?? 'Respirar em 4 tempos'} progress={1}>
        <View style={{ gap: space.md }}>
          <Text variant="bodyStrong">Pronto. Você pode voltar quando quiser.</Text>
          <Text variant="body" muted>
            Se o aperto voltar, o exercício está em Apoio e no botão Acalmar.
          </Text>
          <PrimaryButton label="Voltar" onPress={() => router.back()} />
        </View>
      </CalmExerciseChrome>
    )
  }

  return (
    <CalmExerciseChrome
      title={calmExerciseById('box_breathing')?.title ?? 'Respirar em 4 tempos'}
      progress={progress}
      footer={
        <PrimaryButton
          label={running ? 'Pausar' : 'Continuar'}
          variant={running ? 'ghost' : 'primary'}
          onPress={() => (running ? pause() : resume())}
        />
      }
    >
      <CalmBreathVisual
        phase={phase}
        remainingSec={remainingSec}
        cycle={cycle}
        totalCycles={BOX_CYCLE_COUNT}
      />
    </CalmExerciseChrome>
  )
}
