import { useMemo } from 'react'
import { View, StyleSheet, useWindowDimensions } from 'react-native'
import {
  aggregateHumorByDay,
  buildMoodDistribution,
  buildCurrentMonthCalendar,
  weekdayLabels,
  moodLabel,
  moodColor,
  currentMonthLabel,
} from '@simply-life/shared'
import { Card, Text, SectionHeader, EmptyState } from '../../ui'
import { MoodFaceRow } from '../MoodFace'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { useAuthStore } from '../../store/authStore'
import { useCaptureStore } from '../../store/captureStore'
import { PrimaryButton } from '../../ui'

export function HealthDiaryTab()
{
  const { colors, space, radius } = useTheme()
  const { width } = useWindowDimensions()
  const humor = useDataStore((s) => s.humor)
  const addHumor = useDataStore((s) => s.addHumor)
  const isGuest = useAuthStore((s) => s.isGuest)
  const openCapture = useCaptureStore((s) => s.openCapture)

  const slices = useMemo(() => buildMoodDistribution(humor), [humor])
  const agregados = useMemo(() => aggregateHumorByDay(humor), [humor])
  const cells = useMemo(() => buildCurrentMonthCalendar(agregados), [agregados])
  const total = humor.length
  const last = useMemo(
    () => [...humor].sort((a, b) => (b.created_at || b.data).localeCompare(a.created_at || a.data))[0],
    [humor],
  )
  const cellSize = Math.min(36, Math.floor((width - 64) / 7) - 4)
  const pillBtn = { borderRadius: 999 as const }

  return (
    <View style={{ gap: space.lg }}>
      <Card tone="hero" style={{ gap: space.md }}>
        <Text variant="caption" color={colors.axel}>
          Humor de hoje
        </Text>
        <MoodFaceRow
          value={last?.humor}
          onChange={(m) => void addHumor(m, undefined, isGuest)}
        />
        <PrimaryButton
          label="Escrever nota"
          variant="ghost"
          onPress={() => openCapture('note')}
          style={pillBtn}
        />
      </Card>

      <Card tone="elevated" style={{ gap: space.md }}>
        <SectionHeader title="Distribuição" subtitle={`${total} registros`} />
        {total === 0 ? (
          <EmptyState title="Sem registros" body="Registre humor acima." />
        ) : (
          <View style={{ gap: 10 }}>
            {([1, 2, 3, 4, 5] as const).map((m) =>
            {
              const slice = slices.find((s) => s.mood === m)
              const count = slice?.value ?? 0
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <View key={m} style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        backgroundColor: moodColor(m),
                      }}
                    />
                    <Text variant="caption" style={{ flex: 1 }}>
                      {moodLabel(m)}
                    </Text>
                    <Text variant="micro" muted>
                      {count > 0 ? `${count} · ${pct}%` : '—'}
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 6,
                      borderRadius: radius.pill,
                      backgroundColor: colors.hairline,
                      overflow: 'hidden',
                    }}
                  >
                    <View
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        backgroundColor: moodColor(m),
                      }}
                    />
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </Card>

      <Card tone="elevated" style={{ gap: space.sm }}>
        <Text variant="section" style={{ textTransform: 'capitalize' }}>
          {currentMonthLabel()}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {weekdayLabels().map((d) => (
            <Text
              key={d}
              variant="micro"
              muted
              style={{ width: cellSize, textAlign: 'center' }}
            >
              {d}
            </Text>
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'space-between' }}>
          {cells.map((cell) => (
            <View
              key={cell.date}
              style={{
                width: cellSize,
                height: cellSize,
                borderRadius: 8,
                backgroundColor: cell.humor ? moodColor(cell.humor) : colors.elevated,
                opacity: cell.inMonth ? (cell.humor ? 0.9 : 0.35) : 0,
                borderWidth: cell.inMonth ? StyleSheet.hairlineWidth : 0,
                borderColor: colors.hairline,
              }}
            />
          ))}
        </View>
      </Card>
    </View>
  )
}
