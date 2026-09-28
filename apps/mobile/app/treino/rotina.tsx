import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  DEFAULT_REST_SEC,
  MUSCLE_GROUP_LABEL,
  type WorkoutRoutine,
  type WorkoutRoutineExercise,
} from '@simply-life/shared'
import { Card, Field, Icon, PrimaryButton, Screen, Text } from '../../src/ui'
import { StackHeader } from '../../src/components/layout/StackHeader'
import { useTheme } from '../../src/theme/ThemeProvider'
import { useAuthStore } from '../../src/store/authStore'
import { newWorkoutId, useWorkoutStore } from '../../src/store/workoutStore'
import { safeBack } from '../../src/lib/safeBack'
import { confirmDestructive } from '../../src/lib/confirmDestructive'
import { useWorkoutHydrate } from '../../src/components/health/workout/useWorkoutHydrate'
import { ExercisePickerSheet } from '../../src/components/health/workout/ExercisePickerSheet'
import { WorkoutStepper } from '../../src/components/health/workout/WorkoutStepper'

function emptyRoutine(): WorkoutRoutine
{
  return { id: newWorkoutId(), remoteId: null, name: '', exercises: [], createdAt: '', updatedAt: '' }
}

export default function TreinoRotinaScreen()
{
  const hydrated = useWorkoutHydrate()
  const { colors, space } = useTheme()
  const router = useRouter()
  const params = useLocalSearchParams<{ id?: string }>()
  const isGuest = useAuthStore((s) => s.isGuest)
  const routines = useWorkoutStore((s) => s.routines)
  const saveRoutine = useWorkoutStore((s) => s.saveRoutine)
  const deleteRoutine = useWorkoutStore((s) => s.deleteRoutine)
  const existing = params.id ? routines.find((r) => r.id === params.id) : undefined

  const [draft, setDraft] = useState<WorkoutRoutine>(() => existing ?? emptyRoutine())
  const [loadedId, setLoadedId] = useState<string | null>(existing?.id ?? null)
  const [picker, setPicker] = useState(false)

  // rotina chega depois da hidratação quando a tela abre direto
  useEffect(() =>
  {
    if (existing && loadedId !== existing.id)
    {
      setDraft(existing)
      setLoadedId(existing.id)
    }
  }, [existing, loadedId])

  const patchEx = (i: number, patch: Partial<WorkoutRoutineExercise>) =>
    setDraft((d) => ({ ...d, exercises: d.exercises.map((e, j) => (j === i ? { ...e, ...patch } : e)) }))

  const move = (i: number, dir: -1 | 1) =>
    setDraft((d) =>
    {
      const j = i + dir
      if (j < 0 || j >= d.exercises.length) return d
      const next = [...d.exercises]
      ;[next[i], next[j]] = [next[j], next[i]]
      return { ...d, exercises: next }
    })

  const save = () =>
  {
    void saveRoutine({ ...draft, name: draft.name.trim() || 'Minha rotina' }, isGuest)
    safeBack(router, '/treino')
  }

  const remove = () =>
    confirmDestructive('Apagar rotina?', 'O histórico dos treinos feitos com ela continua.', () =>
    {
      void deleteRoutine(draft.id, isGuest)
      safeBack(router, '/treino')
    }, 'Apagar')

  if (params.id && !existing && !hydrated)
  {
    return (
      <Screen tabBarInset={false}>
        <StackHeader title="Rotina" />
      </Screen>
    )
  }

  return (
    <Screen scroll tabBarInset={false}>
      <StackHeader title={existing ? 'Editar rotina' : 'Nova rotina'} subtitle="Um modelo para começar treinos mais rápido" />
      <View style={{ gap: space.md }}>
        <Field
          label="Nome"
          value={draft.name}
          onChangeText={(name) => setDraft((d) => ({ ...d, name }))}
          placeholder="Treino A, Pernas, Empurrar"
        />

        {draft.exercises.length === 0 ? (
          <Text variant="caption" muted>
            Adicione os exercícios. No treino, carga e repetições começam pelo que você fez da última vez.
          </Text>
        ) : null}

        {draft.exercises.map((e, i) => (
          <Card key={`${e.exerciseId}-${i}`} tone="elevated" style={{ padding: space.md, gap: space.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text variant="bodyStrong" numberOfLines={2}>{e.name}</Text>
                <Text variant="micro" muted>{MUSCLE_GROUP_LABEL[e.group] ?? ''}</Text>
              </View>
              {([['chevron-up', -1], ['chevron-down', 1]] as const).map(([icon, dir]) => (
                <Pressable
                  key={icon}
                  onPress={() => move(i, dir)}
                  accessibilityRole="button"
                  accessibilityLabel={dir < 0 ? 'Subir' : 'Descer'}
                  style={{ width: 40, height: 44, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Icon name={icon} size={18} color={colors.inkMuted} />
                </Pressable>
              ))}
              <Pressable
                onPress={() => setDraft((d) => ({ ...d, exercises: d.exercises.filter((_, j) => j !== i) }))}
                accessibilityRole="button"
                accessibilityLabel={`Tirar ${e.name}`}
                style={{ width: 40, height: 44, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="trash-outline" size={18} color={colors.inkFaint} />
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
              {[
                { label: 'Séries', node: <WorkoutStepper label="séries" value={e.sets} step={1} min={1} max={20} width={36} onChange={(sets) => patchEx(i, { sets })} /> },
                { label: 'Reps', node: <WorkoutStepper label="repetições" value={e.reps} step={1} min={1} max={200} width={36} onChange={(reps) => patchEx(i, { reps })} /> },
                { label: e.bodyweight ? 'kg extra' : 'kg', node: <WorkoutStepper label="carga" value={e.cargaKg ?? 0} step={2.5} decimals max={999} onChange={(cargaKg) => patchEx(i, { cargaKg })} /> },
                { label: 'Descanso s', node: <WorkoutStepper label="descanso em segundos" value={e.restSec} step={15} max={600} width={40} onChange={(restSec) => patchEx(i, { restSec })} /> },
              ].map((f) => (
                <View key={f.label} style={{ gap: 6 }}>
                  <Text variant="micro" muted>{f.label}</Text>
                  {f.node}
                </View>
              ))}
            </View>
          </Card>
        ))}

        <PrimaryButton label="Adicionar exercício" variant="secondary" icon="add" onPress={() => setPicker(true)} />
        <PrimaryButton label="Salvar rotina" onPress={save} />
        {existing ? <PrimaryButton label="Apagar rotina" variant="link" onPress={remove} /> : null}
      </View>

      <ExercisePickerSheet
        visible={picker}
        onClose={() => setPicker(false)}
        onPick={(ex) =>
          setDraft((d) => ({
            ...d,
            exercises: [
              ...d.exercises,
              { exerciseId: ex.id, name: ex.name, group: ex.group, bodyweight: ex.bodyweight, sets: 3, reps: 10, cargaKg: 0, restSec: DEFAULT_REST_SEC },
            ],
          }))}
      />
    </Screen>
  )
}
