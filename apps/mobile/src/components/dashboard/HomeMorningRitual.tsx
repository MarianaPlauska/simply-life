import { useEffect, useMemo, useState } from 'react'
import { TextInput, View } from 'react-native'
import {
  findHabit,
  formatSleepHours,
  humorDoDia,
  moodLabel,
  SONO_META_H,
} from '@simply-life/shared'
import { Card, Text, PrimaryButton, Chip } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { MoodFaceRow } from '../MoodFace'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { useNotesStore } from '../../store/notesStore'
import { useBodyWeekStore } from '../../store/bodyWeekStore'

const QUICK_HOURS = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9]

const QUALITY: { id: 1 | 2 | 3; label: string }[] = [
  { id: 1, label: 'Mal' },
  { id: 2, label: 'Ok' },
  { id: 3, label: 'Bem' },
]

type RitualStep = 'sleep' | 'mood'

type Props = {
  /** Manhã e sono ainda não registrado */
  needSleep: boolean
  /** Humor do dia ainda não registrado */
  needMood: boolean
  onMoodRegistered?: () => void
}

/**
 * Ritual da manhã (estilo Bearable): sono → humor num único card.
 * A água permanece em card separado na Home.
 */
export function HomeMorningRitual({ needSleep, needMood, onMoodRegistered }: Props)
{
  const { colors, radius, space } = useTheme()
  const isGuest = useAuthStore((s) => s.isGuest)
  const habits = useDataStore((s) => s.habits)
  const humor = useDataStore((s) => s.humor)
  const setSleepHours = useDataStore((s) => s.setSleepHours)
  const addHumor = useDataStore((s) => s.addHumor)
  const recordSleep = useBodyWeekStore((s) => s.recordSleep)
  const createNote = useNotesStore((s) => s.create)
  const updateNote = useNotesStore((s) => s.update)

  const sono = findHabit(habits, 'sono')
  const sleepLogged = (sono?.progressoAtual ?? 0) > 0
  const meta = sono?.metaDiaria || SONO_META_H
  const hoje = useMemo(() => humorDoDia(humor), [humor])

  const initialStep: RitualStep = needSleep && !sleepLogged ? 'sleep' : 'mood'
  const [step, setStep] = useState<RitualStep>(initialStep)
  const [hours, setHours] = useState<number | null>(
    sleepLogged ? (sono?.progressoAtual ?? null) : null,
  )
  const [quality, setQuality] = useState<1 | 2 | 3 | null>(null)
  const [mood, setMood] = useState<number | null>(hoje?.humor ?? null)
  const [nota, setNota] = useState(hoje?.nota ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() =>
  {
    if (!needSleep || sleepLogged)
    {
      setStep('mood')
    }
    else if (needSleep && !sleepLogged)
    {
      setStep('sleep')
    }
  }, [needSleep, sleepLogged])

  useEffect(() =>
  {
    setMood(hoje?.humor ?? null)
    setNota(hoje?.nota ?? '')
  }, [hoje])

  useEffect(() =>
  {
    if (sleepLogged && sono?.progressoAtual)
    {
      setHours(sono.progressoAtual)
    }
  }, [sleepLogged, sono?.progressoAtual])

  const showSleepStep = needSleep && !sleepLogged && step === 'sleep'
  const showMoodStep = needMood && step === 'mood'
  const moodSelected = mood ?? hoje?.humor ?? null
  const moodUnchanged =
    Boolean(hoje)
    && moodSelected === hoje?.humor
    && nota.trim() === (hoje?.nota || '')

  const saveSleep = async (): Promise<boolean> =>
  {
    if (hours == null) return false
    setSaving(true)
    setError(null)
    try
    {
      await setSleepHours(hours, isGuest)
      recordSleep(hours)
      if (needMood)
      {
        setStep('mood')
      }
      return true
    }
    catch (e)
    {
      setError(e instanceof Error ? e.message : 'Não foi possível registrar o sono')
      return false
    }
    finally
    {
      setSaving(false)
    }
  }

  const saveMood = async () =>
  {
    if (moodSelected == null) return
    setSaving(true)
    setError(null)
    try
    {
      const texto = nota.trim()
      await addHumor(moodSelected, texto || undefined, isGuest)
      onMoodRegistered?.()
      if (texto && !isGuest)
      {
        try
        {
          const row = await createNote('diario')
          if (row)
          {
            await updateNote(row.id, {
              titulo: `Humor: ${moodLabel(moodSelected)}`,
              conteudo: texto,
            })
          }
        }
        catch
        {
          /* humor já persistiu */
        }
      }
    }
    catch (e)
    {
      setError(e instanceof Error ? e.message : 'Não foi possível gravar o humor')
    }
    finally
    {
      setSaving(false)
    }
  }

  const onPrimary = () =>
  {
    if (showSleepStep)
    {
      void saveSleep()
      return
    }
    void saveMood()
  }

  const primaryLabel = showSleepStep
    ? hours == null
      ? 'Escolha as horas de sono'
      : `Continuar · ${formatSleepHours(hours)}`
    : moodSelected == null
      ? 'Escolha como está'
      : moodUnchanged
        ? 'Registrado'
        : hoje
          ? `Atualizar · ${moodLabel(moodSelected)}`
          : `Registrar · ${moodLabel(moodSelected)}`

  const primaryDisabled =
    saving
    || (showSleepStep ? hours == null : moodSelected == null || moodUnchanged)

  return (
    <Card
      tone="elevated"
      style={{
        gap: space.md,
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: colors.health,
      }}
    >
      <View style={{ gap: 6 }}>
        <Text variant="caption" color={colors.health} style={{ fontWeight: '700' }}>
          Ritual da manhã
        </Text>
        <Text variant="bodyStrong" style={{ fontSize: 17 }}>
          {showSleepStep ? 'Como foi a noite?' : 'Como você está agora?'}
        </Text>
        {needSleep && needMood ? (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <StepPill
              label="Sono"
              done={sleepLogged}
              active={showSleepStep}
            />
            <View style={{ width: 12, height: 1, backgroundColor: colors.hairline }} />
            <StepPill
              label="Humor"
              done={Boolean(hoje)}
              active={showMoodStep}
            />
          </View>
        ) : null}
      </View>

      {sleepLogged && needSleep && !showSleepStep ? (
        <Text variant="caption" muted>
          Sono: {formatSleepHours(sono!.progressoAtual)} registrado
          {needMood ? ' · agora o humor' : ''}
        </Text>
      ) : null}

      {showSleepStep ? (
        <View style={{ gap: space.sm }}>
          <Text variant="caption" muted>
            Um toque basta. Meta sugerida: {meta}h.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {QUICK_HOURS.map((h) => (
              <Chip
                key={h}
                label={formatSleepHours(h)}
                active={hours === h}
                onPress={() =>
                {
                  setHours(h)
                  setError(null)
                }}
              />
            ))}
          </View>
          <View style={{ gap: 6 }}>
            <Text variant="caption" muted>Descanso (opcional)</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {QUALITY.map((q) => (
                <Chip
                  key={q.id}
                  label={q.label}
                  active={quality === q.id}
                  onPress={() => setQuality(q.id)}
                />
              ))}
            </View>
          </View>
        </View>
      ) : null}

      {showMoodStep ? (
        <View style={{ gap: space.sm }}>
          <Text variant="caption" muted>
            Registro pessoal (1 a 5). Pode pular qualquer dia — detalhes em Saúde.
          </Text>
          <MoodFaceRow
            value={moodSelected}
            onChange={(next) =>
            {
              setMood(next)
              setError(null)
            }}
          />
          <TextInput
            value={nota}
            onChangeText={setNota}
            placeholder="Uma linha sobre agora…"
            placeholderTextColor={colors.inkFaint}
            multiline
            style={{
              minHeight: 52,
              textAlignVertical: 'top',
              borderRadius: radius.control,
              padding: 12,
              fontSize: 15,
              color: colors.ink,
              backgroundColor: colors.canvas,
              borderWidth: 1,
              borderColor: colors.hairline,
            }}
          />
        </View>
      ) : null}

      {error ? (
        <Text variant="caption" color={colors.danger}>{error}</Text>
      ) : null}

      <PrimaryButton
        label={primaryLabel}
        disabled={primaryDisabled}
        loading={saving}
        onPress={onPrimary}
      />
    </Card>
  )
}

function StepPill({
  label,
  done,
  active,
}: {
  label: string
  done: boolean
  active: boolean
})
{
  const { colors } = useTheme()
  return (
    <Text
      variant="caption"
      style={{
        fontWeight: '600',
        color: done ? colors.health : active ? colors.axel : colors.inkMuted,
      }}
    >
      {done ? `${label} ✓` : label}
    </Text>
  )
}
