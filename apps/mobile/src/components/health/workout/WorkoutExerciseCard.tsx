import { Pressable, View } from 'react-native'
import {
  MUSCLE_GROUP_LABEL,
  formatRestClock,
  type WorkoutSessionExercise,
  type WorkoutSet,
} from '@simply-life/shared'
import { Card, Icon, Text } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { WorkoutSetRow } from './WorkoutSetRow'

const REST_STEPS = [0, 30, 45, 60, 90, 120, 150, 180, 240]

type Props = {
  exercise: WorkoutSessionExercise
  lastSets: WorkoutSet[]
  onUpdateSet: (setId: string, patch: Partial<WorkoutSet>) => void
  onToggleSet: (setId: string) => void
  onRemoveSet: (setId: string) => void
  onAddSet: () => void
  onRestChange: (sec: number) => void
  onRemove: () => void
}

export function WorkoutExerciseCard({
  exercise,
  lastSets,
  onUpdateSet,
  onToggleSet,
  onRemoveSet,
  onAddSet,
  onRestChange,
  onRemove,
}: Props)
{
  const { colors, radius, space } = useTheme()
  const doneCount = exercise.sets.filter((s) => s.done).length

  const cycleRest = () =>
  {
    const i = REST_STEPS.findIndex((s) => s > exercise.restSec)
    onRestChange(i === -1 ? REST_STEPS[0] : REST_STEPS[i])
  }

  return (
    <Card tone="elevated" style={{ gap: space.sm, padding: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.sm }}>
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text variant="section" numberOfLines={2}>{exercise.name}</Text>
          <Text variant="caption" muted>
            {MUSCLE_GROUP_LABEL[exercise.group] ?? 'Exercício'} · {doneCount}/{exercise.sets.length} séries
          </Text>
        </View>
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={`Tirar ${exercise.name} do treino`}
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="trash-outline" size={18} color={colors.inkFaint} />
        </Pressable>
      </View>

      <Pressable
        onPress={cycleRest}
        accessibilityRole="button"
        accessibilityLabel="Trocar tempo de descanso"
        style={{
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          minHeight: 32,
          paddingHorizontal: 12,
          borderRadius: radius.pill,
          backgroundColor: colors.canvas,
        }}
      >
        <Icon name="timer-outline" size={14} color={colors.inkMuted} />
        <Text variant="label" muted>
          {exercise.restSec > 0 ? `Descanso ${formatRestClock(exercise.restSec)}` : 'Sem descanso automático'}
        </Text>
      </Pressable>

      <View style={{ flexDirection: 'row', paddingHorizontal: 6, gap: 8 }}>
        <Text variant="micro" muted style={{ width: 28, textAlign: 'center' }}>Série</Text>
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          <Text variant="micro" muted style={{ width: 106, textAlign: 'center' }}>
            {exercise.bodyweight ? 'kg extra' : 'kg'}
          </Text>
          <Text variant="micro" muted style={{ width: 96, textAlign: 'center' }}>reps</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {exercise.sets.map((s, i) => (
        <WorkoutSetRow
          key={s.id}
          index={i}
          set={s}
          previous={lastSets[i]}
          bodyweight={exercise.bodyweight}
          onChange={(patch) => onUpdateSet(s.id, patch)}
          onToggle={() => onToggleSet(s.id)}
          onRemove={() => onRemoveSet(s.id)}
        />
      ))}

      <Pressable
        onPress={onAddSet}
        accessibilityRole="button"
        style={({ pressed }) => ({
          minHeight: 44,
          borderRadius: radius.control,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: colors.canvas,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Icon name="add" size={16} color={colors.ink} />
        <Text variant="label">Adicionar série</Text>
      </Pressable>
    </Card>
  )
}
