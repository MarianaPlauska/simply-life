import { useState } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  THOUGHT_RECORD_STEPS,
  emptyThoughtRecordDraft,
  thoughtRecordDiaryTitle,
  thoughtRecordToMarkdown,
  type ThoughtRecordDraft,
} from '@simply-life/shared'
import { Screen, Text, Card, Field, PrimaryButton } from '../../src/ui'
import { SettingsHero } from '../../src/components/settings/SettingsHero'
import { useTheme } from '../../src/theme/ThemeProvider'
import { useAuthStore } from '../../src/store/authStore'
import { useNotesStore } from '../../src/store/notesStore'
import { useGamificationStore } from '../../src/store/gamificationStore'
import { saveThoughtRecord } from '../../src/lib/tccPersist'

const STEP_COUNT = THOUGHT_RECORD_STEPS.length

/** Jornada TCC: registro de pensamento em 5 passos. */
export default function ThoughtRecordScreen()
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const isGuest = useAuthStore((s) => s.isGuest)
  const createNote = useNotesStore((s) => s.create)
  const updateNote = useNotesStore((s) => s.update)
  const grantXp = useGamificationStore((s) => s.grantXp)
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<ThoughtRecordDraft>(emptyThoughtRecordDraft())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const current = THOUGHT_RECORD_STEPS[step]
  const value = draft[current.id]

  const patch = (text: string) =>
  {
    setDraft((prev) => ({ ...prev, [current.id]: text }))
  }

  const canContinue = value.trim().length > 0

  const finish = async () =>
  {
    setSaving(true)
    setError(null)
    try
    {
      const entry = await saveThoughtRecord(draft)
      grantXp(10, 'Registro de pensamento', 'TCC')
      if (!isGuest)
      {
        try
        {
          const row = await createNote('diario')
          if (row)
          {
            await updateNote(row.id, {
              titulo: thoughtRecordDiaryTitle(entry),
              conteudo: thoughtRecordToMarkdown(entry),
            })
          }
        }
        catch
        {
          /* registro local já foi salvo */
        }
      }
      router.replace('/(tabs)/saude?section=apoio')
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
    if (step < STEP_COUNT - 1)
    {
      setStep((s) => s + 1)
      return
    }
    void finish()
  }

  const onBack = () =>
  {
    if (step > 0)
    {
      setStep((s) => s - 1)
      return
    }
    router.back()
  }

  return (
    <Screen scroll tabBarInset={false}>
      <SettingsHero title="Registro de pensamento" />
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
                backgroundColor: i <= step ? colors.axel : colors.hairline,
              }}
            />
          ))}
        </View>

        <Card tone="elevated" style={{ gap: space.md }}>
          <Text variant="section">{current.title}</Text>
          <Text variant="body" muted>{current.hint}</Text>
          <Field
            label={current.title}
            placeholder={current.placeholder}
            value={value}
            onChangeText={patch}
            multiline
            style={{ minHeight: 120, textAlignVertical: 'top', paddingTop: 14 }}
          />
          {error ? <Text variant="caption" color={colors.danger}>{error}</Text> : null}
          <Text variant="caption" muted>
            Este exercício não substitui atendimento profissional. CVV: 188.
          </Text>
        </Card>

        <View style={{ gap: space.sm }}>
          <PrimaryButton
            label={step === STEP_COUNT - 1 ? 'Salvar registro' : 'Continuar'}
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
