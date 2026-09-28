import { useMemo } from 'react'
import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  formatWorkoutKg,
  weeklyVolumeByGroup,
  workoutSessionVolume,
  workoutSessionsInRange,
  workoutWeekRange,
  type WorkoutRoutine,
} from '@simply-life/shared'
import { Card, Icon, PrimaryButton, Screen, Text } from '../../src/ui'
import { StackHeader } from '../../src/components/layout/StackHeader'
import { useTheme } from '../../src/theme/ThemeProvider'
import { useWorkoutStore } from '../../src/store/workoutStore'
import { confirmDestructive } from '../../src/lib/confirmDestructive'
import { useWorkoutHydrate } from '../../src/components/health/workout/useWorkoutHydrate'
import { WorkoutVolumeBars } from '../../src/components/health/workout/WorkoutVolumeBars'
import { WorkoutSessionItem } from '../../src/components/health/workout/WorkoutSessionItem'

const RECENT = 5

export default function TreinoHubScreen()
{
  useWorkoutHydrate()
  const { colors, space } = useTheme()
  const router = useRouter()
  const sessions = useWorkoutStore((s) => s.sessions)
  const routines = useWorkoutStore((s) => s.routines)
  const active = useWorkoutStore((s) => s.active)
  const startSession = useWorkoutStore((s) => s.startSession)

  const week = useMemo(() =>
  {
    const { from, to } = workoutWeekRange()
    const list = workoutSessionsInRange(sessions, from, to)
    return {
      count: list.length,
      volume: list.reduce((acc, s) => acc + workoutSessionVolume(s), 0),
      groups: weeklyVolumeByGroup(sessions),
    }
  }, [sessions])

  const begin = (routine: WorkoutRoutine | null) =>
  {
    const go = () =>
    {
      startSession(routine)
      router.push('/treino/sessao')
    }
    if (active)
    {
      confirmDestructive(
        'Já tem um treino aberto',
        'Começar outro descarta as séries do treino em andamento.',
        go,
        'Descartar e começar',
      )
      return
    }
    go()
  }

  return (
    <Screen scroll tabBarInset={false}>
      <StackHeader title="Treino" subtitle="Rotinas e histórico sem limite" />
      <View style={{ gap: space.lg }}>
        {active ? (
          <Card tone="hero" style={{ gap: space.sm }}>
            <Text variant="micro" muted>Em andamento</Text>
            <Text variant="section">{active.title}</Text>
            <Text variant="caption" muted>
              {active.exercises.length} {active.exercises.length === 1 ? 'exercício' : 'exercícios'} · as séries ficam salvas aqui.
            </Text>
            <PrimaryButton label="Continuar treino" icon="play" onPress={() => router.push('/treino/sessao')} />
          </Card>
        ) : (
          <Card tone="hero" style={{ gap: space.sm }}>
            <Text variant="section">Bora treinar?</Text>
            <Text variant="caption" muted>
              Comece do zero e adicione exercícios, ou escolha uma rotina abaixo.
            </Text>
            <PrimaryButton label="Começar treino livre" icon="barbell" onPress={() => begin(null)} />
          </Card>
        )}

        <View style={{ gap: space.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="section">Minhas rotinas</Text>
            <PrimaryButton label="Nova" icon="add" variant="secondary" size="sm" onPress={() => router.push('/treino/rotina')} />
          </View>
          {routines.length === 0 ? (
            <Text variant="caption" muted>
              Uma rotina é um modelo, tipo Treino A ou Pernas. Crie quantas quiser.
            </Text>
          ) : null}
          {routines.map((r) => (
            <Card key={r.id} tone="elevated" style={{ padding: space.md, gap: space.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.sm }}>
                <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                  <Text variant="bodyStrong" numberOfLines={1}>{r.name}</Text>
                  <Text variant="caption" muted numberOfLines={2}>
                    {r.exercises.length
                      ? r.exercises.map((e) => e.name).join(', ')
                      : 'Sem exercícios ainda'}
                  </Text>
                </View>
                <Pressable
                  onPress={() => router.push({ pathname: '/treino/rotina', params: { id: r.id } })}
                  accessibilityRole="button"
                  accessibilityLabel={`Editar ${r.name}`}
                  style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Icon name="pencil" size={18} color={colors.inkMuted} />
                </Pressable>
              </View>
              <PrimaryButton label="Começar esta rotina" variant="secondary" size="sm" icon="play" onPress={() => begin(r)} />
            </Card>
          ))}
        </View>

        <Card tone="elevated" style={{ gap: space.md }}>
          <View style={{ gap: 4 }}>
            <Text variant="section">Esta semana</Text>
            <Text variant="caption" muted>
              {week.count === 0
                ? 'Nenhum treino registrado ainda.'
                : `${week.count} ${week.count === 1 ? 'treino' : 'treinos'}${week.volume > 0 ? ` · ${formatWorkoutKg(week.volume)} levantados` : ''}`}
            </Text>
          </View>
          <WorkoutVolumeBars rows={week.groups} />
        </Card>

        <View style={{ gap: space.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="section">Histórico</Text>
            {sessions.length > RECENT ? (
              <PrimaryButton label="Ver tudo" variant="link" size="sm" onPress={() => router.push('/treino/historico')} />
            ) : null}
          </View>
          {sessions.length === 0 ? (
            <Text variant="caption" muted>Seus treinos aparecem aqui, todos eles, sem limite.</Text>
          ) : null}
          {sessions.slice(0, RECENT).map((s) => (
            <WorkoutSessionItem key={s.id} session={s} />
          ))}
        </View>
      </View>
    </Screen>
  )
}
