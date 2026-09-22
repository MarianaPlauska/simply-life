import { useState } from 'react'
import { View } from 'react-native'
import { GROUNDING_STEPS } from '@simply-life/shared'
import { Card, Field, Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  stepIndex: number
}

/** Um passo do grounding 5-4-3-2-1, com nota opcional. */
export function CalmGroundingStep({ stepIndex }: Props)
{
  const { colors, space } = useTheme()
  const step = GROUNDING_STEPS[stepIndex]
  const [note, setNote] = useState('')

  if (!step) return null

  return (
    <Card tone="elevated" style={{ gap: space.md, borderRadius: 18 }}>
      <Text variant="caption" color={colors.health} style={{ fontWeight: '700' }}>
        Passo {stepIndex + 1} de {GROUNDING_STEPS.length} · {step.sense}
      </Text>
      <Text variant="section">{step.prompt}</Text>
      <Text variant="body" muted>
        {step.hint}
      </Text>
      <Field
        label="Anotar (opcional)"
        value={note}
        onChangeText={setNote}
        placeholder="Só se quiser guardar o que notou"
        multiline
      />
    </Card>
  )
}
