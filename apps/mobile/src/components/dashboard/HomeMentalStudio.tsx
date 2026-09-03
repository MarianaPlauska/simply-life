import { useMemo, useState } from 'react'
import { View } from 'react-native'
import {
  aggregateHumorByDay,
  isoDaysAgo,
  moodColor,
  moodLabel,
  weeklyMoodReview,
} from '@simply-life/shared'
import { Text, PrimaryButton } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { MoodFaceRow } from '../MoodFace'
import { ExpandableSection } from './ExpandableSection'
import { useRouter } from 'expo-router'

export function HomeMentalStudio()
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const humor = useDataStore((s) => s.humor) ?? []
  const addHumor = useDataStore((s) => s.addHumor)
  const isGuest = useAuthStore((s) => s.isGuest)

  const week = useMemo(() => weeklyMoodReview(humor), [humor])
  const todayIso = new Date().toISOString().slice(0, 10)
  const todayMood = humor.find((h) => (h.data || '').slice(0, 10) === todayIso)?.humor ?? null
  const byDay = useMemo(() =>
  {
    const map = new Map(aggregateHumorByDay(humor).map((d) => [d.data, d.humor]))
    return Array.from({ length: 7 }).map((_, i) =>
    {
      const iso = isoDaysAgo(6 - i)
      const value = map.get(iso) ?? 0
      const weekday = new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'narrow' })
      return { iso, value, weekday }
    })
  }, [humor])

  const subtitle = week.daysLogged > 0
    ? `${week.daysLogged}/7 dias · média ${week.avg.toFixed(1).replace('.', ',')}`
    : 'Sem registros esta semana'

  return (
    <ExpandableSection
      title="Saúde mental"
      subtitle={subtitle}
      pill={todayMood ? moodLabel(todayMood) : 'hoje'}
      pillColor={todayMood ? moodColor(todayMood) : colors.axel}
      accent={colors.axel}
      expanded={open}
      onToggle={() => setOpen((v) => !v)}
      summary={
        <View style={{ gap: space.sm }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              gap: 6,
              height: 72,
            }}
          >
            {byDay.map((d) =>
            {
              const h = d.value > 0 ? 12 + (d.value / 5) * 52 : 8
              return (
                <View key={d.iso} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                  <View
                    style={{
                      width: '100%',
                      height: h,
                      borderRadius: 6,
                      backgroundColor: d.value > 0 ? moodColor(d.value) : colors.hairline,
                      opacity: d.value > 0 ? 1 : 0.5,
                    }}
                  />
                  <Text variant="micro" muted>
                    {d.weekday}
                  </Text>
                </View>
              )
            })}
          </View>
          <Text variant="caption" muted>
            Humor da semana
          </Text>
        </View>
      }
    >
      <MoodFaceRow
        value={todayMood}
        onChange={(m) => void addHumor(m, undefined, isGuest)}
      />
      <PrimaryButton
        label="Abrir diário"
        variant="link"
        size="sm"
        onPress={() => router.push('/(tabs)/saude')}
      />
    </ExpandableSection>
  )
}
