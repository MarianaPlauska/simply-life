import { useMemo, useState } from 'react'
import { View, StyleSheet, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import {
  aggregateHumorByDay,
  buildMoodDistribution,
  buildCurrentMonthCalendar,
  weekdayLabels,
  moodLabel,
  moodColor,
  currentMonthLabel,
  weeklyMoodReview,
} from '@simply-life/shared'
import { Card, Text, SectionHeader, EmptyState, IconBadge, StatusPill, PrimaryButton, Field } from '../../ui'
import { MoodFaceRow } from '../MoodFace'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { useAuthStore } from '../../store/authStore'

export function HealthDiaryTab()
{
  const { colors, space, radius } = useTheme()
  const { width } = useWindowDimensions()
  const router = useRouter()
  const humor = useDataStore((s) => s.humor)
  const addHumor = useDataStore((s) => s.addHumor)
  const isGuest = useAuthStore((s) => s.isGuest)
  const [nota, setNota] = useState('')

  const slices = useMemo(() => buildMoodDistribution(humor), [humor])
  const agregados = useMemo(() => aggregateHumorByDay(humor), [humor])
  const cells = useMemo(() => buildCurrentMonthCalendar(agregados), [agregados])
  const total = humor.length
  const dia = new Date().toISOString().slice(0, 10)
  const last = useMemo(
    () => humor.find((h) => (h.data || '').slice(0, 10) === dia) ?? null,
    [humor, dia],
  )
  const week = useMemo(() => weeklyMoodReview(humor), [humor])
  const cellSize = Math.min(36, Math.floor((width - 64) / 7) - 4)
  const comNota = useMemo(
    () => [...humor].filter((h) => (h.nota || '').trim()).slice(0, 12),
    [humor],
  )

  return (
    <View style={{ gap: space.md }}>
      <Card tone="hero" style={{ gap: space.md, borderRadius: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <IconBadge name="happy" color={colors.axel} size={44} iconSize={22} />
          <View style={{ flex: 1, gap: 6 }}>
            <Text variant="caption" color={colors.axel} style={{ fontWeight: '700' }}>
              Humor de hoje
            </Text>
            <StatusPill
              label={last ? moodLabel(last.humor) : 'Sem registro'}
              color={last ? moodColor(last.humor) : colors.axel}
            />
          </View>
        </View>
        <MoodFaceRow
          value={last?.humor}
          onChange={(m) => void addHumor(m, nota.trim() || undefined, isGuest)}
        />
        <Field
          label="Como foi o dia (opcional)"
          value={nota}
          onChangeText={setNota}
          placeholder="Uma frase já vira histórico"
          multiline
        />
        <PrimaryButton
          label="Salvar nota no humor"
          disabled={!last}
          onPress={() =>
          {
            if (!last) return
            void addHumor(last.humor, nota.trim() || undefined, isGuest)
            setNota('')
          }}
        />
        <PrimaryButton
          label="Abrir anotações"
          variant="ghost"
          onPress={() => router.push('/anotacoes')}
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
                      {count > 0 ? `${count} · ${pct}%` : '-'}
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
        <SectionHeader title="Revisão semanal" subtitle="Últimos 7 dias" />
        {week.count === 0 ? (
          <Text variant="caption" muted>
            Sem check-ins nesta semana.
          </Text>
        ) : (
          <>
            <Text variant="bodyStrong">
              Média {week.avg.toFixed(1)} · {week.daysLogged} dias
            </Text>
            <Text variant="caption" muted>
              Melhor {moodLabel(week.best)} · mais baixo {moodLabel(week.worst)}
            </Text>
          </>
        )}
      </Card>

      <Card tone="elevated" style={{ gap: space.sm }}>
        <SectionHeader title="Histórico com texto" subtitle="Evolução do que você escreveu" />
        {comNota.length === 0 ? (
          <Text variant="caption" muted>
            Notas do check-in aparecem aqui e também em Anotações.
          </Text>
        ) : (
          comNota.map((h) => (
            <View key={h.id} style={{ gap: 4, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline }}>
              <Text variant="caption" muted>
                {h.data.slice(0, 10)} · {moodLabel(h.humor)}
              </Text>
              <Text variant="body">{h.nota}</Text>
            </View>
          ))
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
