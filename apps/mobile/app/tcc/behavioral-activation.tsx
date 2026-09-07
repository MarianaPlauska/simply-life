import { useState } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  BEHAVIORAL_ACTION_SUGGESTIONS,
  BEHAVIORAL_DURATION_OPTIONS,
  behavioralActivationDiaryTitle,
  behavioralActivationTaskNotes,
  behavioralActivationToMarkdown,
  emptyBehavioralActivationDraft,
  todayIso,
  type BehavioralActivationDraft,
} from '@simply-life/shared'
import { Screen, Text, Card, Field, PrimaryButton, Chip } from '../../src/ui'
import { SettingsHero } from '../../src/components/settings/SettingsHero'
import { useTheme } from '../../src/theme/ThemeProvider'
import { useAuthStore } from '../../src/store/authStore'
import { useDataStore } from '../../src/store/dataStore'
import { useNotesStore } from '../../src/store/notesStore'
import { useGamificationStore } from '../../src/store/gamificationStore'
import { saveBehavioralActivation } from '../../src/lib/tccPersist'

const STEP_COUNT = 3

/** TCC: uma micro-ação vira tarefa de hoje no Kanban. */
export default function BehavioralActivationScreen()
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const isGuest = useAuthStore((s) => s.isGuest)
  const addTask = useDataStore((s) => s.addTask)
  const createNote = useNotesStore((s) => s.create)
  const updateNote = useNotesStore((s) => s.update)
  const grantXp = useGamificationStore((s) => s.grantXp)
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<BehavioralActivationDraft>(emptyBehavioralActivationDraft())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const canContinue =
    step === 0
      ? true
      : step === 1
        ? draft.action.trim().length > 0
        : true

  const finish = async () =>
  {
    setSaving(true)
    setError(null)
    try
    {
      const entry = await saveBehavioralActivation(draft)
      await addTask(draft.action.trim(), isGuest, behavioralActivationTaskNotes(draft), {
        dataVencimento: todayIso(),
        estimativaMinutos: draft.durationMin,
        prioridade: 2,
        status: 'todo',
      })
      grantXp(8, 'Ativação comportamental', 'TCC')
      if (!isGuest)
      {
        try
        {
          const row = await createNote('diario')
          if (row)
          {
            await updateNote(row.id, {
              titulo: behavioralActivationDiaryTitle(entry),
              conteudo: behavioralActivationToMarkdown(entry),
            })
          }
        }
        catch
        {
          /* tarefa e registro local já salvos */
        }
      }
      setDone(true)
    }
    catch (e)
    {
      setError(e instanceof Error ? e.message : 'Não foi possível criar a tarefa')
    }
    finally
    {
      setSaving(false)
    }
  }

  const onNext = () =>
  {
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

  if (done)
  {
    return (
      <Screen scroll tabBarInset={false}>
        <SettingsHero title="Tarefa criada" />
        <View style={{ gap: space.lg, maxWidth: 480, alignSelf: 'center', width: '100%' }}>
          <Card tone="elevated" style={{ gap: space.md }}>
            <Text variant="section">No seu dia</Text>
            <Text variant="body" muted>
              “{draft.action.trim()}” foi adicionada às tarefas de hoje ({draft.durationMin} min).
              Um passo já é suficiente — não precisa fazer mais nada agora.
            </Text>
          </Card>
          <PrimaryButton
            label="Ver tarefas"
            onPress={() => router.replace('/(tabs)/kanban')}
          />
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
      <SettingsHero title="Ativação comportamental" />
      <View style={{ gap: space.lg, maxWidth: 480, alignSelf: 'center', width: '100%' }}>
        <Text variant="caption" muted>
          Passo {step + 1} de {STEP_COUNT}
        </Text>
        <View
          style={{ flexDirection: 'row', gap: 4 }}
          accessibilityRole="progressbar"
          accessibilityValue={{ now: step + 1, min: 1, max: STEP_COUNT }}
        >
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
            <Text variant="section">O que está pesado?</Text>
            <Text variant="body" muted>
              Opcional. Nomear o bloqueio ajuda a escolher uma ação menor — sem resolver tudo de uma vez.
            </Text>
            <Field
              label="Contexto"
              placeholder="Ex.: energia baixa, evitei responder mensagens…"
              value={draft.barrier}
              onChangeText={(barrier) => setDraft((prev) => ({ ...prev, barrier }))}
              multiline
              style={{ minHeight: 100, textAlignVertical: 'top', paddingTop: 14 }}
            />
          </Card>
        ) : null}

        {step === 1 ? (
          <Card tone="elevated" style={{ gap: space.md }}>
            <Text variant="section">Uma micro-ação</Text>
            <Text variant="body" muted>
              Escolha uma sugestão ou escreva a sua. O objetivo é movimento mínimo, não produtividade máxima.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {BEHAVIORAL_ACTION_SUGGESTIONS.map((suggestion) => (
                <Chip
                  key={suggestion}
                  label={suggestion}
                  active={draft.action === suggestion}
                  onPress={() => setDraft((prev) => ({ ...prev, action: suggestion }))}
                />
              ))}
            </View>
            <Field
              label="Sua ação"
              placeholder="O que você consegue fazer agora?"
              value={draft.action}
              onChangeText={(action) => setDraft((prev) => ({ ...prev, action }))}
              multiline
              style={{ minHeight: 88, textAlignVertical: 'top', paddingTop: 14 }}
            />
          </Card>
        ) : null}

        {step === 2 ? (
          <Card tone="elevated" style={{ gap: space.md }}>
            <Text variant="section">Tempo previsto</Text>
            <Text variant="body" muted>
              Quanto tempo você reserva para esta ação? Será criada uma tarefa para hoje no Kanban.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {BEHAVIORAL_DURATION_OPTIONS.map((opt) => (
                <Chip
                  key={opt.id}
                  label={opt.label}
                  active={draft.durationMin === opt.id}
                  onPress={() => setDraft((prev) => ({ ...prev, durationMin: opt.id }))}
                />
              ))}
            </View>
            <Text variant="bodyStrong">{draft.action.trim()}</Text>
            {draft.barrier.trim() ? (
              <Text variant="caption" muted>
                Contexto: {draft.barrier.trim()}
              </Text>
            ) : null}
          </Card>
        ) : null}

        {error ? <Text variant="caption" color={colors.danger}>{error}</Text> : null}
        <Text variant="caption" muted>
          Não substitui atendimento profissional. CVV: 188.
        </Text>

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
