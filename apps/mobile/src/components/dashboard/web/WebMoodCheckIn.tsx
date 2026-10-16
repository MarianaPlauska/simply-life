import { useMemo, useState } from 'react'
import { TextInput, View } from 'react-native'
import { Icon } from '../../../ui/Icon'
import { findHabit, formatSleepHours, humorDoDia, moodColor, moodLabel, SONO_META_H } from '@simply-life/shared'
import { Text } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { useAuthStore } from '../../../store/authStore'
import { useDataStore } from '../../../store/dataStore'
import { useBodyWeekStore } from '../../../store/bodyWeekStore'
import { WebHoverable } from './WebHoverable'
import { useInPanel } from '../../../ui/Panel'
import { webStyle } from './webStyle'

const MOOD_ICONS: Record<number, keyof typeof Icon.glyphMap> = {
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
  const [noteOpen, setNoteOpen] = useState(false)
  const inPanel = useInPanel()

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

  // um botão pequeno, do tamanho do texto (não esticado para preencher a linha)
  const chip = (key: string | number, label: string, selected: boolean, onPress: () => void, icon?: keyof typeof Icon.glyphMap, tint?: string) => (
    <WebHoverable
      key={key}
      onPress={onPress}
      accessibilityLabel={label}
      style={(hovered) => webStyle({
        height: 36,
        paddingHorizontal: 14,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: selected ? `${tint ?? colors.axel}22` : hovered ? colors.surface : 'transparent',
        borderWidth: 1,
        borderColor: selected ? (tint ?? colors.axel) : colors.hairline,
        cursor: 'pointer',
      })}
    >
      {icon ? <Icon name={icon} size={16} color={selected ? tint ?? colors.axel : colors.inkMuted} /> : null}
      <Text variant="caption" style={{ color: selected ? tint ?? colors.axel : colors.ink }}>
        {label}
      </Text>
    </WebHoverable>
  )

  return (
    <View style={inPanel ? { gap: 12 } : { borderRadius: 12, backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.hairline, paddingVertical: 12, paddingHorizontal: 20, gap: 12 }}>
      {showSleep ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Text variant="bodyStrong" style={{ marginRight: 8 }}>
            Quanto você dormiu?
          </Text>
          {QUICK_HOURS.map((h) =>
            chip(h, formatSleepHours(h), hours === h, () =>
            {
              setHours(h)
              void saveSleep(h)
            }),
          )}
        </View>
      ) : null}

      {showMood ? (
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <Text variant="bodyStrong" style={{ marginRight: 8 }}>
              Como você está agora?
            </Text>
            {[1, 2, 3, 4, 5].map((m) =>
              chip(m, moodLabel(m), (mood ?? hoje?.humor) === m, () =>
              {
                setMood(m)
                void saveMood(m)
              }, MOOD_ICONS[m], moodColor(m)),
            )}
            {!noteOpen ? (
              <WebHoverable onPress={() => setNoteOpen(true)} style={webStyle({ paddingHorizontal: 8, cursor: 'pointer' })}>
                <Text variant="caption" color={colors.axel}>
                  Escrever uma linha
                </Text>
              </WebHoverable>
            ) : null}
            {saving ? (
              <Text variant="caption" muted>
                Salvando…
              </Text>
            ) : null}
          </View>
          {noteOpen ? (
            <TextInput
              autoFocus
              value={nota}
              onChangeText={setNota}
              placeholder="Uma linha sobre agora, depois escolha como está"
              placeholderTextColor={colors.inkFaint}
              style={{
                height: 40,
                maxWidth: 560,
                borderRadius: 10,
                paddingHorizontal: 14,
                fontSize: 15,
                fontFamily: 'Lexend_400Regular',
                color: colors.ink,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.hairline,
              }}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  )
}
