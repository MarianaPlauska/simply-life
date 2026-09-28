import { useEffect, useMemo, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native'
import { useRouter, type Href } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  XP_FOCUS_SESSION,
  findHabit,
  formatRestClock,
  formatWorkoutKg,
  lastTimeSets,
  routineFromSession,
  workoutDurationMin,
  workoutSessionTotals,
} from '@simply-life/shared'
import { Card, Icon, PrimaryButton, Text } from '../../src/ui'
import { useTheme } from '../../src/theme/ThemeProvider'
import { useKeepAwake } from '../../src/lib/keepAwake'
import { hapticLight, hapticRestDone } from '../../src/lib/haptics'
import { safeBack } from '../../src/lib/safeBack'
import { confirmDestructive } from '../../src/lib/confirmDestructive'
import { useAuthStore } from '../../src/store/authStore'
import { useDataStore } from '../../src/store/dataStore'
import { useGamificationStore } from '../../src/store/gamificationStore'
import { useWorkoutStore, type WorkoutSummary } from '../../src/store/workoutStore'
import { useWorkoutHydrate } from '../../src/components/health/workout/useWorkoutHydrate'
import { WorkoutExerciseCard } from '../../src/components/health/workout/WorkoutExerciseCard'
import { WorkoutRestBar } from '../../src/components/health/workout/WorkoutRestBar'
import { ExercisePickerSheet } from '../../src/components/health/workout/ExercisePickerSheet'

const HUB = '/treino'

export default function TreinoSessaoScreen()
{
  const hydrated = useWorkoutHydrate()
  useKeepAwake()
  const { colors, space, radius, type } = useTheme()
  const router = useRouter()
  const isGuest = useAuthStore((s) => s.isGuest)
  const habits = useDataStore((s) => s.habits)
  const toggleTreinoDone = useDataStore((s) => s.toggleTreinoDone)
  const grantXp = useGamificationStore((s) => s.grantXp)

  const active = useWorkoutStore((s) => s.active)
  const sessions = useWorkoutStore((s) => s.sessions)
  const rest = useWorkoutStore((s) => s.rest)
  const store = useWorkoutStore.getState

  const [now, setNow] = useState(() => Date.now())
  const [picker, setPicker] = useState(false)
  const [summary, setSummary] = useState<WorkoutSummary | null>(null)
  const [savedRoutine, setSavedRoutine] = useState(false)
  const restFired = useRef<number | null>(null)

  useEffect(() =>
  {
    const id = setInterval(() => setNow(Date.now()), rest ? 250 : 1000)
    return () => clearInterval(id)
  }, [rest])

  // fim do descanso: vibra uma vez e some
  useEffect(() =>
  {
    if (!rest || now < rest.endsAt || restFired.current === rest.endsAt) return
    restFired.current = rest.endsAt
    hapticRestDone()
    store().skipRest()
  }, [now, rest, store])

  const lastByExercise = useMemo(() =>
  {
    const map: Record<string, ReturnType<typeof lastTimeSets>> = {}
    for (const e of active?.exercises ?? []) map[e.exerciseId] = lastTimeSets(sessions, e.exerciseId)
    return map
  }, [active?.exercises, sessions])

  const leave = () => safeBack(router, HUB)

  const finish = () =>
  {
    const treino = findHabit(habits, 'treino')
    const result = store().finishSession(isGuest, treino?.id)
    if (!result)
    {
      leave()
      return
    }
    grantXp(XP_FOCUS_SESSION, 'Sessão de treino')
    if (treino && treino.progressoAtual < (treino.metaDiaria || 1)) void toggleTreinoDone(isGuest)
    hapticLight()
    setSummary(result)
  }

  const askFinish = () =>
  {
    if (!active) return
    const t = workoutSessionTotals(active)
    if (t.sets === 0)
    {
      confirmDestructive(
        'Nenhuma série marcada',
        'Sem séries feitas, nada vai para o histórico. Quer sair e descartar este treino?',
        () =>
        {
          store().discardSession()
          leave()
        },
        'Descartar',
      )
      return
    }
    finish()
  }

  const askDiscard = () =>
  {
    confirmDestructive('Descartar treino?', 'As séries desta sessão não serão salvas.', () =>
    {
      store().discardSession()
      leave()
    }, 'Descartar')
  }

  /* ---------------- resumo ---------------- */
  if (summary)
  {
    const s = summary.session
    const t = workoutSessionTotals(s)
    const canSaveRoutine = !s.routineId && !savedRoutine
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
          <View style={{ gap: space.xs }}>
            <Text variant="micro" muted>Treino salvo</Text>
            <Text variant="hero">Bom trabalho</Text>
            <Text variant="voice" muted>
              Você apareceu e fez. Descansar agora também faz parte do treino.
            </Text>
          </View>
          <Card tone="elevated" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.lg }}>
            {[
              { label: 'Duração', value: `${workoutDurationMin(s)} min` },
              { label: 'Volume', value: formatWorkoutKg(t.volumeKg) },
              { label: 'Séries', value: String(t.sets) },
              { label: 'Exercícios', value: String(t.exercises) },
            ].map((m) => (
              <View key={m.label} style={{ minWidth: 120, gap: 4 }}>
                <Text variant="micro" muted>{m.label}</Text>
                <Text variant="title">{m.value}</Text>
              </View>
            ))}
          </Card>
          <Card tone="elevated" style={{ gap: space.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <Icon name="trophy" size={18} color={colors.attention} />
              <Text variant="section">Recordes</Text>
            </View>
            {summary.prs.length === 0 ? (
              <Text variant="caption" muted>
                Nenhum recorde hoje, e está tudo bem. Constância pesa mais que um dia forte.
              </Text>
            ) : (
              summary.prs.map((p) => (
                <View key={p.exerciseId} style={{ gap: 4 }}>
                  <Text variant="bodyStrong">{p.name}</Text>
                  <Text variant="caption" muted>
                    {p.best.cargaKg ? `${String(p.best.cargaKg).replace('.', ',')} kg × ${p.best.reps}` : `${p.best.reps} reps`}
                    {p.best.e1rm ? ` · 1RM estimado ${String(p.best.e1rm).replace('.', ',')} kg` : ''}
                    {p.previous.e1rm ? ` (antes ${String(p.previous.e1rm).replace('.', ',')} kg)` : ` (antes ${p.previous.reps} reps)`}
                  </Text>
                </View>
              ))
            )}
          </Card>
          <View style={{ gap: space.sm }}>
            <PrimaryButton label="Concluir" onPress={() => router.replace(HUB as Href)} />
            {canSaveRoutine ? (
              <PrimaryButton
                label="Salvar como rotina"
                variant="secondary"
                icon="duplicate"
                onPress={() =>
                {
                  void store().saveRoutine(routineFromSession(s, s.title, new Date().toISOString()), isGuest)
                  setSavedRoutine(true)
                }}
              />
            ) : null}
            {savedRoutine ? <Text variant="caption" muted>Rotina salva. Ela aparece em Minhas rotinas.</Text> : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  /* ---------------- sem treino aberto ---------------- */
  if (!active)
  {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas, padding: space.lg, gap: space.md }} edges={['top', 'bottom']}>
        <Text variant="title">{hydrated ? 'Nenhum treino aberto' : 'Carregando'}</Text>
        {hydrated ? (
          <>
            <Text variant="body" muted>Comece um treino livre ou a partir de uma rotina.</Text>
            <PrimaryButton label="Começar treino livre" onPress={() => store().startSession(null)} />
            <PrimaryButton label="Voltar" variant="ghost" onPress={() => router.replace(HUB as Href)} />
          </>
        ) : null}
      </SafeAreaView>
    )
  }

  /* ---------------- treino em andamento ---------------- */
  const t = workoutSessionTotals(active)
  const elapsed = Math.max(0, Math.floor((now - Date.parse(active.startedAt)) / 1000))
  const hours = Math.floor(elapsed / 3600)
  const clock = hours > 0 ? `${hours}:${formatRestClock(elapsed % 3600)}` : formatRestClock(elapsed)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.sm,
            paddingHorizontal: space.lg,
            paddingVertical: space.sm,
          }}
        >
          <Pressable
            onPress={leave}
            accessibilityRole="button"
            accessibilityLabel="Minimizar, o treino continua aberto"
            style={{
              width: 44,
              height: 44,
              borderRadius: radius.pill,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.elevated,
            }}
          >
            <Icon name="chevron-down" size={22} color={colors.ink} />
          </Pressable>
          <View style={{ flex: 1, minWidth: 0 }}>
            <TextInput
              value={active.title}
              onChangeText={(v) => store().renameActive(v)}
              accessibilityLabel="Nome do treino"
              style={{
                color: colors.ink,
                fontFamily: 'Lexend_600SemiBold',
                fontSize: type.section.size,
                paddingVertical: 2,
              }}
            />
            <Text variant="caption" muted style={{ fontVariant: ['tabular-nums'] }}>
              {clock} · {t.sets} {t.sets === 1 ? 'série' : 'séries'} · {formatWorkoutKg(t.volumeKg)}
            </Text>
          </View>
          <PrimaryButton label="Concluir" size="sm" onPress={askFinish} />
        </View>

        <ScrollView
          contentContainerStyle={{ padding: space.lg, paddingTop: space.sm, gap: space.md, paddingBottom: 160 }}
          keyboardShouldPersistTaps="handled"
        >
          {active.exercises.length === 0 ? (
            <Card tone="inset" style={{ gap: space.xs }}>
              <Text variant="bodyStrong">Treino vazio</Text>
              <Text variant="caption" muted>
                Adicione o primeiro exercício. Carga e repetições vêm preenchidas com a sua última vez.
              </Text>
            </Card>
          ) : null}
          {active.exercises.map((e) => (
            <WorkoutExerciseCard
              key={e.id}
              exercise={e}
              lastSets={lastByExercise[e.exerciseId] ?? []}
              onUpdateSet={(setId, patch) => store().updateSet(e.id, setId, patch)}
              onToggleSet={(setId) =>
              {
                hapticLight()
                store().toggleSetDone(e.id, setId)
              }}
              onRemoveSet={(setId) => store().removeSet(e.id, setId)}
              onAddSet={() => store().addSet(e.id)}
              onRestChange={(sec) => store().setRestSec(e.id, sec)}
              onRemove={() =>
                confirmDestructive('Tirar exercício?', `${e.name} sai deste treino.`, () => store().removeExercise(e.id), 'Tirar')}
            />
          ))}
          <PrimaryButton label="Adicionar exercício" variant="secondary" icon="add" onPress={() => setPicker(true)} />
          <PrimaryButton label="Descartar treino" variant="link" onPress={askDiscard} />
        </ScrollView>

        {rest ? (
          <View style={{ position: 'absolute', left: space.lg, right: space.lg, bottom: space.lg }}>
            <WorkoutRestBar
              rest={rest}
              now={now}
              onAdjust={(d) => store().adjustRest(d)}
              onSkip={() => store().skipRest()}
            />
          </View>
        ) : null}
      </KeyboardAvoidingView>

      <ExercisePickerSheet visible={picker} onClose={() => setPicker(false)} onPick={(ex) => store().addExercise(ex)} />
    </SafeAreaView>
  )
}
