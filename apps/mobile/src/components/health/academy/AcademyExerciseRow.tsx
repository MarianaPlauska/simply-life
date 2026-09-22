import { View } from 'react-native'
import type { AcademyExercise } from '@simply-life/shared'
import { Field, PressableScale, Text } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'

type Props = {
  exercise: AcademyExercise
  onChange: (next: AcademyExercise) => void
  onRemove: () => void
}

/** Uma linha do editor: nome, séries, reps e descanso. */
export function AcademyExerciseRow({ exercise, onChange, onRemove }: Props)
{
  const { colors, radius } = useTheme()
  const patch = (partial: Partial<AcademyExercise>) => onChange({ ...exercise, ...partial })

  return (
    <View
      style={{
        gap: 10,
        padding: 12,
        borderRadius: radius.card,
        backgroundColor: colors.elevated,
      }}
    >
      <Field
        label="Exercício"
        value={exercise.name}
        onChangeText={(name) => patch({ name })}
        placeholder="Agachamento"
      />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Field
            label="Séries"
            value={String(exercise.sets)}
            onChangeText={(v) => patch({ sets: Math.max(1, Number(v.replace(/\D/g, '')) || 1) })}
            keyboardType="number-pad"
          />
        </View>
        <View style={{ flex: 1.2 }}>
          <Field
            label="Reps ou tempo"
            value={exercise.reps}
            onChangeText={(reps) => patch({ reps })}
            placeholder="10-12 ou 45s"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Field
            label="Descanso s"
            value={String(exercise.restSec)}
            onChangeText={(v) => patch({ restSec: Math.max(0, Number(v.replace(/\D/g, '')) || 0) })}
            keyboardType="number-pad"
          />
        </View>
      </View>
      <PressableScale onPress={onRemove} style={{ minHeight: 44, justifyContent: 'center' }}>
        <Text variant="caption" color={colors.danger}>
          Remover exercício
        </Text>
      </PressableScale>
    </View>
  )
}
