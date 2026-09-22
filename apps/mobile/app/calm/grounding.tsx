import { useEffect } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { GROUNDING_STEPS, calmExerciseById } from '@simply-life/shared'
import { PrimaryButton, Text } from '../../src/ui'
import { CalmExerciseChrome } from '../../src/components/calm/CalmExerciseChrome'
import { CalmGroundingStep } from '../../src/components/calm/CalmGroundingStep'
import { useCalmStore } from '../../src/store/calmStore'
import { useTheme } from '../../src/theme/ThemeProvider'

/** Grounding 5-4-3-2-1 no ritmo de quem usa. */
export default function GroundingScreen()
{
  const { space } = useTheme()
  const router = useRouter()
  const status = useCalmStore((s) => s.status)
  const stepIndex = useCalmStore((s) => s.stepIndex)
  const start = useCalmStore((s) => s.start)
  const nextStep = useCalmStore((s) => s.nextStep)
  const reset = useCalmStore((s) => s.reset)
  const last = stepIndex >= GROUNDING_STEPS.length - 1

  useEffect(() =>
  {
    start('grounding_54321')
    return () => reset()
  }, [start, reset])

  const progress = status === 'done'
    ? 1
    : (stepIndex + 1) / GROUNDING_STEPS.length

  if (status === 'done')
  {
    return (
      <CalmExerciseChrome title={calmExerciseById('grounding_54321')?.title ?? 'Voltar aos cinco sentidos'} progress={1}>
        <View style={{ gap: space.md }}>
          <Text variant="bodyStrong">Pronto. Você pode voltar quando quiser.</Text>
          <Text variant="body" muted>
            Os sentidos ainda estão aí. Pode repetir se o corpo pedir.
          </Text>
          <PrimaryButton label="Voltar" onPress={() => router.back()} />
        </View>
      </CalmExerciseChrome>
    )
  }

  return (
    <CalmExerciseChrome
      title={calmExerciseById('grounding_54321')?.title ?? 'Voltar aos cinco sentidos'}
      progress={progress}
      footer={
        <PrimaryButton
          label={last ? 'Concluir' : 'Próximo sentido'}
          onPress={nextStep}
        />
      }
    >
      <CalmGroundingStep key={stepIndex} stepIndex={stepIndex} />
    </CalmExerciseChrome>
  )
}
