import { useMemo, useState } from 'react'
import { TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { findHabit, formatSleepHours, humorDoDia, moodColor, moodLabel, SONO_META_H } from '@simply-life/shared'
import { Text } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { useAuthStore } from '../../../store/authStore'
import { useDataStore } from '../../../store/dataStore'
import { useBodyWeekStore } from '../../../store/bodyWeekStore'
import { WebHoverable } from './WebHoverable'
import { webStyle } from './webStyle'

const MOOD_ICONS: Record<number, keyof typeof Ionicons.glyphMap> = {
  1: 'sad',
  2: 'sad-outline',
  3: 'remove-outline',
  4: 'happy-outline',
  5: 'happy',
}

const QUICK_HOURS = [6, 6.5, 7, 7.5, 8, 8.5]

type Props = {
  needSleep: boolean
  needMood: boolean
}

/** Check-in do dia em uma faixa compacta — segmentos pequenos, não círculos de 56px. */
export function WebMoodCheckIn({ needSleep, needMood }: Props)
{
  const { colors } = useTheme()
  const isGuest = useAuthStore((s) => s.isGuest)
  const habits = useDataStore((s) => s.habits)
  const humor = useDataStore((s) => s.humor)
  const setSleepHours = useDataStore((s) => s.setSleepHours)
  const addHumor = useDataStore((s) => s.addHumor)
  const recordSleep = useBodyWeekStore((s) => s.recordSleep)

  const sono = findHabit(habits, 'sono')
  const sleepLogged = (sono?.progressoAtual ?? 0) > 0
  const meta = sono?.metaDiaria || SONO_META_H
  const hoje = useMemo(() => humorDoDia(humor), [humor])

  const [hours, setHours] = useState<number | null>(sleepLogged ? sono?.progressoAtual ?? null : null)
  const [mood, setMood] = useState<number | null>(hoje?.humor ?? null)
  const [nota, setNota] = useState(hoje?.nota ?? '')
  const [saving, setSaving] = useState(false)

  const showSleep = needSleep && !sleepLogged
  const showMood = needMood

  if (!showSleep && !showMood) return null

  const saveSleep = async (h: number) =>
  {
    setSaving(true)
    try
    {
      await setSleepHours(h, isGuest)
      recordSleep(h)
    }
    finally
    {
      setSaving(false)
    }
  }

  const saveMood = async (m: number) =>
  {
    setSaving(true)
    try
    {
      await addHumor(m, nota.trim() || undefined, isGuest)
    }
    finally
    {
      setSaving(false)
    }
  }

  return (
    <View style={{ borderRadius: 14, backgroundColor: colors.elevated, padding: 16, gap: 14 }}>
      {showSleep ? (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="caption" style={{ fontWeight: '700' }}>
              Sono — meta {meta}h
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {QUICK_HOURS.map((h) => (
              <WebHoverable
                key={h}
                onPress={() =>
                {
                  setHours(h)
                  void saveSleep(h)
                }}
                style={webStyle({
                  height: 30,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: hours === h ? colors.axel : colors.surface,
                  cursor: 'pointer',
                })}
              >
                <Text
                  variant="caption"
                  style={{ color: hours === h ? '#FFFFFF' : colors.ink, fontWeight: '600' }}
                >
                  {formatSleepHours(h)}
                </Text>
              </WebHoverable>
            ))}
          </View>
        </View>
      ) : null}

      {showMood ? (
        <View style={{ gap: 8 }}>
          <Text variant="caption" style={{ fontWeight: '700' }}>
            Como você está agora?
          </Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {[1, 2, 3, 4, 5].map((m) =>
            {
              const selected = (mood ?? hoje?.humor) === m
              return (
                <WebHoverable
                  key={m}
                  onPress={() =>
                  {
                    setMood(m)
                    void saveMood(m)
                  }}
                  accessibilityLabel={moodLabel(m)}
                  style={webStyle({
                    flex: 1,
                    height: 44,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 6,
                    backgroundColor: selected ? `${moodColor(m)}22` : colors.surface,
                    borderWidth: 1,
                    borderColor: selected ? moodColor(m) : colors.hairline,
                    cursor: 'pointer',
                  })}
                >
                  <Ionicons name={MOOD_ICONS[m]} size={16} color={selected ? moodColor(m) : colors.inkMuted} />
                  <Text
                    variant="micro"
                    style={{ color: selected ? moodColor(m) : colors.inkMuted, fontWeight: '700' }}
                  >
                    {moodLabel(m)}
                  </Text>
                </WebHoverable>
              )
            })}
          </View>
          <TextInput
            value={nota}
            onChangeText={setNota}
            onBlur={() =>
            {
              const m = mood ?? hoje?.humor
              if (m != null) void saveMood(m)
            }}
            placeholder="Uma linha sobre agora… (opcional)"
            placeholderTextColor={colors.inkFaint}
            style={{
              height: 36,
              borderRadius: 8,
              paddingHorizontal: 12,
              fontSize: 13,
              color: colors.ink,
              backgroundColor: colors.surface,
            }}
          />
          {saving ? (
            <Text variant="micro" muted>
              Salvando…
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}
