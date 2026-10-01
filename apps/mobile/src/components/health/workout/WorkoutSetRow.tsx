import { useState } from 'react'
import { Pressable, View } from 'react-native'
import type { WorkoutSet } from '@simply-life/shared'
import { Icon, Text } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { WorkoutStepper } from './WorkoutStepper'

type Props = {
  index: number
  set: WorkoutSet
  previous?: WorkoutSet
  bodyweight?: boolean
  onChange: (patch: Partial<WorkoutSet>) => void
  onToggle: () => void
  onRemove: () => void
}

const RPE_OPTIONS = [6, 7, 8, 9, 10]

/** Uma série: carga, reps e o toque que marca feita (liga o descanso). */
export function WorkoutSetRow({ index, set, previous, bodyweight, onChange, onToggle, onRemove }: Props)
{
  const { colors, radius, space } = useTheme()
  const [open, setOpen] = useState(false)
  const prevLabel = previous
    ? `${previous.cargaKg ? `${String(previous.cargaKg).replace('.', ',')} kg × ` : ''}${previous.reps}`
    : null

  return (
    <View
      style={{
        gap: space.xs,
        paddingVertical: 4,
        paddingHorizontal: 6,
        borderRadius: radius.control,
        backgroundColor: set.done ? colors.healthMuted : 'transparent',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pressable
          onPress={() => setOpen((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={`Série ${index + 1}, opções`}
          style={{ width: 28, height: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text variant="bodyStrong" color={colors.inkMuted}>{index + 1}</Text>
        </Pressable>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          <WorkoutStepper
            label={bodyweight ? 'carga extra em kg' : 'carga em kg'}
            value={set.cargaKg}
            step={bodyweight ? 1 : 2.5}
            decimals
            max={999}
            onChange={(cargaKg) => onChange({ cargaKg })}
          />
          <WorkoutStepper
            label="repetições"
            value={set.reps}
            step={1}
            max={200}
            width={36}
            onChange={(reps) => onChange({ reps })}
          />
        </View>
        <Pressable
          onPress={onToggle}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: set.done }}
          accessibilityLabel={`Série ${index + 1} feita`}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: radius.control,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: set.done ? colors.done : colors.elevated,
            borderWidth: set.done ? 0 : 1,
            borderColor: colors.hairlineStrong,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Icon name="checkmark" size={20} color={set.done ? colors.surface : colors.inkFaint} weight="bold" />
        </Pressable>
      </View>
      {(prevLabel || set.rpe) && !open ? (
        <Text variant="micro" muted style={{ marginLeft: 34 }}>
          {prevLabel ? `Última vez ${prevLabel}` : ''}
          {prevLabel && set.rpe ? ' · ' : ''}
          {set.rpe ? `RPE ${set.rpe}` : ''}
        </Text>
      ) : null}
      {open ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginLeft: 34 }}>
          <Text variant="micro" muted>Esforço (RPE)</Text>
          {RPE_OPTIONS.map((r) => (
            <Pressable
              key={r}
              onPress={() => onChange({ rpe: set.rpe === r ? null : r })}
              accessibilityRole="button"
              accessibilityState={{ selected: set.rpe === r }}
              style={{
                minWidth: 36,
                height: 32,
                borderRadius: radius.pill,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: set.rpe === r ? colors.brand : colors.elevated,
              }}
            >
              <Text variant="label" color={set.rpe === r ? colors.onBrand : colors.ink}>{r}</Text>
            </Pressable>
          ))}
          <Pressable
            onPress={onRemove}
            accessibilityRole="button"
            style={{ height: 32, paddingHorizontal: 10, justifyContent: 'center' }}
          >
            <Text variant="label" color={colors.danger}>Remover série</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  )
}
