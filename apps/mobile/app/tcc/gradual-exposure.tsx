import { useMemo, useState } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  emptyGradualExposureDraft,
  gradualExposureDiaryTitle,
  gradualExposureTaskNotes,
  gradualExposureToMarkdown,
  newExposureStep,
  pickDefaultExposureStep,
  sortExposureSteps,
  todayIso,
  type ExposureHierarchyStep,
  type GradualExposureDraft,
} from '@simply-life/shared'
import { Screen, Text, Card, Field, PrimaryButton, Chip } from '../../src/ui'
import { SettingsHero } from '../../src/components/settings/SettingsHero'
import { useTheme } from '../../src/theme/ThemeProvider'
import { useAuthStore } from '../../src/store/authStore'
import { useDataStore } from '../../src/store/dataStore'
import { useNotesStore } from '../../src/store/notesStore'
import { useGamificationStore } from '../../src/store/gamificationStore'
import { saveGradualExposure } from '../../src/lib/tccPersist'

const STEP_COUNT = 4
const ANXIETY_LEVELS = [2, 4, 6, 8, 10]

/** TCC: hierarquia de evitação → menor passo vira tarefa de hoje. */
export default function GradualExposureScreen()
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const isGuest = useAuthStore((s) => s.isGuest)
  const addTask = useDataStore((s) => s.addTask)
  const createNote = useNotesStore((s) => s.create)
  const updateNote = useNotesStore((s) => s.update)
  const grantXp = useGamificationStore((s) => s.grantXp)
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<GradualExposureDraft>(emptyGradualExposureDraft())
  const [stepDraft, setStepDraft] = useState('')
  const [stepAnxiety, setStepAnxiety] = useState(5)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const sortedSteps = useMemo(() => sortExposureSteps(draft.steps), [draft.steps])
  const chosen = draft.steps.find((s) => s.id === draft.chosenStepId) ?? null

  const canContinue =
    step === 0
      ? draft.situation.trim().length > 0
      : step === 1
        ? draft.steps.filter((s) => s.label.trim()).length >= 2
        : step === 2
          ? Boolean(draft.chosenStepId)
          : true

  const addHierarchyStep = () =>
  {
    const label = stepDraft.trim()
    if (!label) return
    const row = newExposureStep(label, stepAnxiety)
    setDraft((prev) => ({ ...prev, steps: [...prev.steps, row] }))
    setStepDraft('')
    setStepAnxiety(5)
  }

  const finish = async () =>
  {
    const pick = draft.steps.find((s) => s.id === draft.chosenStepId)
    if (!pick) return
    setSaving(true)
    setError(null)
    try
    {
      const entry = await saveGradualExposure(draft)
      await addTask(pick.label.trim(), isGuest, gradualExposureTaskNotes(draft, pick.label), {
        dataVencimento: todayIso(),
        estimativaMinutos: 20,
        prioridade: 2,
        status: 'todo',
      })
      grantXp(10, 'Exposição gradual', 'TCC')
      if (!isGuest)
      {
        try
        {
          const row = await createNote('diario')
          if (row)
          {
            await updateNote(row.id, {
              titulo: gradualExposureDiaryTitle(entry),
              conteudo: gradualExposureToMarkdown(entry),
            })
          }
        }
        catch
        {
          /* tarefa e registro local salvos */
        }
      }
      setDone(true)
    }
    catch (e)
    {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar')
    }
    finally
    {
      setSaving(false)
    }
  }

  const onNext = () =>
  {
    if (step === 1)
    {
      const defaultPick = pickDefaultExposureStep(draft.steps)
      if (defaultPick && !draft.chosenStepId)
      {
        setDraft((prev) => ({ ...prev, chosenStepId: defaultPick.id }))
      }
    }
    if (step < STEP_COUNT - 1)
    {
      setStep((s) => s + 1)
      return
    }
    void finish()
  }

  const onBack = () =>
  {
    if (done)
    {
      router.replace('/(tabs)/saude?section=apoio')
      return
    }
    if (step > 0)
    {
      setStep((s) => s - 1)
      return
    }
    router.back()
  }

  if (done && chosen)
  {
    return (
      <Screen scroll tabBarInset={false}>
        <SettingsHero title="Passo no seu dia" />
        <View style={{ gap: space.lg, maxWidth: 480, alignSelf: 'center', width: '100%' }}>
          <Card tone="elevated" style={{ gap: space.md }}>
            <Text variant="section">Exposição gradual</Text>
            <Text variant="body" muted>
              “{chosen.label.trim()}” foi adicionado às tarefas de hoje. Avance no menor degrau —
              repetir o mesmo passo até a ansiedade baixar é parte do método.
            </Text>
          </Card>
          <PrimaryButton label="Ver tarefas" onPress={() => router.replace('/(tabs)/kanban')} />
          <PrimaryButton
            label="Voltar ao Apoio"
            variant="secondary"
            onPress={() => router.replace('/(tabs)/saude?section=apoio')}
          />
        </View>
      </Screen>
    )
  }

  return (
    <Screen scroll tabBarInset={false}>
      <SettingsHero title="Exposição gradual" />
      <View style={{ gap: space.lg, maxWidth: 480, alignSelf: 'center', width: '100%' }}>
        <Text variant="caption" muted>Passo {step + 1} de {STEP_COUNT}</Text>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {Array.from({ length: STEP_COUNT }, (_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 999,
                backgroundColor: i <= step ? colors.health : colors.hairline,
              }}
            />
          ))}
        </View>

        {step === 0 ? (
          <Card tone="elevated" style={{ gap: space.md }}>
            <Text variant="section">O que você evita?</Text>
            <Text variant="body" muted>
              Nomeie a situação ou medo — sem precisar enfrentar tudo de uma vez.
            </Text>
            <Field
              label="Situação"
              placeholder="Ex.: ligar para o médico, ir ao mercado lotado…"
              value={draft.situation}
              onChangeText={(situation) => setDraft((prev) => ({ ...prev, situation }))}
              multiline
              style={{ minHeight: 100, textAlignVertical: 'top', paddingTop: 14 }}
            />
          </Card>
        ) : null}

        {step === 1 ? (
          <Card tone="elevated" style={{ gap: space.md }}>
            <Text variant="section">Hierarquia</Text>
            <Text variant="body" muted>
              Adicione pelo menos dois passos, do mais fácil ao mais difícil. Marque a ansiedade
              esperada (0 = nada, 10 = máximo).
            </Text>
            {draft.steps.map((row) => (
              <StepRow
                key={row.id}
                row={row}
                onRemove={() =>
                  setDraft((prev) => ({
                    ...prev,
                    steps: prev.steps.filter((s) => s.id !== row.id),
                    chosenStepId: prev.chosenStepId === row.id ? '' : prev.chosenStepId,
                  }))
                }
              />
            ))}
            <Field
              label="Novo passo"
              placeholder="Ex.: ler sobre o assunto por 5 min"
              value={stepDraft}
              onChangeText={setStepDraft}
            />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {ANXIETY_LEVELS.map((n) => (
                <Chip
                  key={n}
                  label={`${n}/10`}
                  active={stepAnxiety === n}
                  onPress={() => setStepAnxiety(n)}
                />
              ))}
            </View>
            <PrimaryButton
              label="Incluir na hierarquia"
              variant="secondary"
              disabled={!stepDraft.trim()}
              onPress={addHierarchyStep}
            />
          </Card>
        ) : null}

        {step === 2 ? (
          <Card tone="elevated" style={{ gap: space.md }}>
            <Text variant="section">Passo de hoje</Text>
            <Text variant="body" muted>
              Escolha o menor degrau possível. O objetivo é praticar, não “vencer” o medo de uma vez.
            </Text>
            {sortedSteps.map((row) => (
              <Chip
                key={row.id}
                label={`${row.label.trim()} · ${row.anxiety}/10`}
                active={draft.chosenStepId === row.id}
                onPress={() => setDraft((prev) => ({ ...prev, chosenStepId: row.id }))}
              />
            ))}
          </Card>
        ) : null}

        {step === 3 ? (
          <Card tone="elevated" style={{ gap: space.md }}>
            <Text variant="section">Confirmar</Text>
            <Text variant="caption" muted>Situação</Text>
            <Text variant="body">{draft.situation.trim()}</Text>
            <Text variant="caption" muted>Passo de hoje</Text>
            <Text variant="bodyStrong">{chosen?.label.trim()}</Text>
            <Text variant="caption" muted>
              Será criada uma tarefa para hoje (~20 min previstos).
            </Text>
          </Card>
        ) : null}

        {error ? <Text variant="caption" color={colors.danger}>{error}</Text> : null}
        <Text variant="caption" muted>Não substitui terapia. CVV: 188.</Text>

        <View style={{ gap: space.sm }}>
          <PrimaryButton
            label={step === STEP_COUNT - 1 ? 'Criar tarefa para hoje' : 'Continuar'}
            disabled={!canContinue}
            loading={saving}
            onPress={onNext}
          />
          <PrimaryButton label={step === 0 ? 'Cancelar' : 'Voltar'} variant="ghost" onPress={onBack} />
        </View>
      </View>
    </Screen>
  )
}

function StepRow({
  row,
  onRemove,
}: {
  row: ExposureHierarchyStep
  onRemove: () => void
})
{
  const { colors, space } = useTheme()
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.sm,
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: colors.hairline,
      }}
    >
      <Text variant="body" style={{ flex: 1 }}>{row.label}</Text>
      <Text variant="caption" muted>{row.anxiety}/10</Text>
      <PrimaryButton label="×" variant="ghost" size="sm" onPress={onRemove} />
    </View>
  )
}
