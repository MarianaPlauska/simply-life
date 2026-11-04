import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, TextInput, View } from 'react-native'
import {
  findHabit,
  formatSleepHours,
  humorDoDia,
  moodLabel,
  SONO_META_H,
} from '@simply-life/shared'
import { Card, Text, PrimaryButton, PressableScale, IconBadge } from '../../ui'
import { Icon } from '../../ui/Icon'
import { hapticSelect } from '../../lib/haptics'
import { useTheme } from '../../theme/ThemeProvider'
import { MoodFaceRow } from '../MoodFace'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { useNotesStore } from '../../store/notesStore'
import { useBodyWeekStore } from '../../store/bodyWeekStore'
import { friendlyError } from '../../lib/friendlyError'

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
  const { colors } = useTheme()
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
      setError(friendlyError(e, 'Não foi possível registrar o sono'))
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
      setError(friendlyError(e, 'Não foi possível gravar o humor'))
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
    <Card tone="elevated" style={{ gap: 20, padding: 16, borderRadius: 16, overflow: 'hidden' }}>
      <View style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconBadge
            name={showSleepStep ? 'moon' : 'happy'}
            color={showSleepStep ? colors.tasks : colors.health}
            size={40}
            iconSize={20}
          />
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text variant="caption" muted>
              Ritual da manhã
            </Text>
            <Text variant="section" style={{ fontSize: 19 }} numberOfLines={1}>
              {showSleepStep ? 'Como foi a noite?' : 'Como você está agora?'}
            </Text>
          </View>
          {needSleep && needMood ? (
            <Text variant="micro" muted style={{ fontWeight: '600' }}>
              {showSleepStep ? '1' : '2'} de 2
            </Text>
          ) : null}
        </View>
        {needSleep && needMood ? (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <StepBar label="Sono" done={sleepLogged} active={showSleepStep} />
            <StepBar label="Humor" done={Boolean(hoje)} active={showMoodStep} />
          </View>
        ) : null}
      </View>

      {sleepLogged && needSleep && !showSleepStep ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="checkmark-circle" size={16} color={colors.health} />
          <Text variant="caption" muted>
            Sono de {formatSleepHours(sono!.progressoAtual)} registrado
          </Text>
        </View>
      ) : null}

      {showSleepStep ? (
        <View style={{ gap: 20 }}>
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="caption" muted>Quantas horas você dormiu?</Text>
              <Text variant="micro" color={colors.axel} style={{ fontWeight: '700' }}>
                Meta {meta}h
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -16 }}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
            >
              {QUICK_HOURS.map((h) =>
              {
                const active = hours === h
                const half = h % 1 !== 0
                return (
                  <PressableScale
                    key={h}
                    onPress={() =>
                    {
                      hapticSelect()
                      setHours(h)
                      setError(null)
                    }}
                    accessibilityLabel={formatSleepHours(h)}
                    accessibilityState={{ selected: active }}
                    style={{
                      width: 64,
                      height: 72,
                      borderRadius: 18,
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                      backgroundColor: active ? colors.axelFill : colors.fill,
                      borderWidth: 1,
                      borderColor: active ? colors.axelFill : h === meta ? colors.hairlineStrong : colors.hairline,
                    }}
                  >
                    <Text
                      variant="bodyStrong"
                      style={{ fontSize: 19, lineHeight: 24, color: active ? colors.axelOnFill : colors.ink }}
                    >
                      {Math.floor(h)}h
                    </Text>
                    <Text
                      variant="micro"
                      style={{ color: active ? colors.axelOnFill : colors.inkMuted }}
                    >
                      {half ? '30min' : h === meta ? 'meta' : ' '}
                    </Text>
                  </PressableScale>
                )
              })}
            </ScrollView>
          </View>
          <View style={{ gap: 12 }}>
            <Text variant="caption" muted>Como foi o descanso? (opcional)</Text>
            <View
              style={{
                flexDirection: 'row',
                padding: 4,
                borderRadius: 999,
                backgroundColor: colors.fill,
              }}
            >
              {QUALITY.map((q) =>
              {
                const active = quality === q.id
                return (
                  <Pressable
                    key={q.id}
                    onPress={() =>
                    {
                      hapticSelect()
                      setQuality(active ? null : q.id)
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={{
                      flex: 1,
                      minHeight: 40,
                      borderRadius: 999,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: active ? colors.elevated : 'transparent',
                      borderWidth: active ? 1 : 0,
                      borderColor: colors.hairlineStrong,
                    }}
                  >
                    <Text
                      variant="bodyStrong"
                      style={{ fontSize: 14, color: active ? colors.ink : colors.inkMuted }}
                    >
                      {q.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
        </View>
      ) : null}

      {showMoodStep ? (
        <View style={{ gap: 16 }}>
          <Text variant="caption" muted>
            De 1 a 5, só para você. Pode pular qualquer dia.
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
              borderRadius: 16,
              padding: 16,
              fontSize: 16,
              color: colors.ink,
              backgroundColor: colors.fill,
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

function StepBar({
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
  const color = done ? colors.health : active ? colors.axelFill : colors.inkMuted
  return (
    <View style={{ flex: 1, gap: 6 }}>
      <View style={{ height: 4, borderRadius: 999, backgroundColor: done || active ? color : colors.fill }} />
      <Text variant="micro" style={{ fontWeight: '600', color }}>
        {done ? `${label} ✓` : label}
      </Text>
    </View>
  )
}
