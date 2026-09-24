import { type ReactNode } from 'react'
import { View, Pressable, StyleSheet, useWindowDimensions } from 'react-native'
import {
  moodLabel,
  moodColor,
  formatDayPt,
  currentMonthLabel,
  weekdayLabels,
  type HumorRegistro,
  type MoodDistributionSlice,
  type DiaHumorAgregado,
  type MoodCalendarCell,
} from '@simply-life/shared'
import { Text, PrimaryButton, Field, MiniSparkline } from '../../../ui'
import { MoodFaceRow } from '../../MoodFace'
import { useTheme } from '../../../theme/ThemeProvider'
import { useWorkspace } from '../../../layout/useWorkspace'
import { DiarySection } from './DiarySection'
import { DIARY_DIVIDER } from './diaryStyles'

type WeekReview = {
  avg: number
  daysLogged: number
  best: number
  worst: number
  count: number
}

type HabitInsight = {
  sleep: { good: number | null; bad: number | null; goodCount: number; badCount: number }
  water: { good: number | null; bad: number | null; goodCount: number; badCount: number }
}

type Props = {
  last: HumorRegistro | null
  prompt: string
  nota: string
  onNotaChange: (v: string) => void
  onMood: (m: number) => void
  onSaveNote: () => void
  onOpenNotes: () => void
  total: number
  slices: MoodDistributionSlice[]
  trend: DiaHumorAgregado[]
  week: WeekReview
  cells: MoodCalendarCell[]
  comNota: HumorRegistro[]
  habits: HabitInsight | null
  alertSlot?: ReactNode
  /** "Seu dia": agenda e o que foi concluído, para o registro ter contexto */
  daySlot?: ReactNode
}

function MoodStackBar({ slices, total }: { slices: MoodDistributionSlice[]; total: number })
{
  const { radius } = useTheme()
  if (total === 0) return null

  return (
    <View style={{ gap: 10 }}>
      <View
        style={{
          height: 12,
          borderRadius: radius.pill,
          flexDirection: 'row',
          overflow: 'hidden',
          backgroundColor: 'rgba(245, 241, 236, 0.08)',
        }}
      >
        {([1, 2, 3, 4, 5] as const).map((m) =>
        {
          const slice = slices.find((s) => s.mood === m)
          const count = slice?.value ?? 0
          if (count <= 0) return null
          const pct = (count / total) * 100
          return (
            <View
              key={m}
              style={{
                width: `${pct}%`,
                height: '100%',
                backgroundColor: moodColor(m),
              }}
            />
          )
        })}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {([1, 2, 3, 4, 5] as const).map((m) =>
        {
          const slice = slices.find((s) => s.mood === m)
          const count = slice?.value ?? 0
          if (count <= 0) return null
          return (
            <View key={m} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: moodColor(m),
                }}
              />
              <Text variant="micro" style={{ color: 'rgba(245, 241, 236, 0.72)', fontSize: 11 }}>
                {moodLabel(m)} {Math.round((count / total) * 100)}%
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

const HEATMAP_GAP = 4
/** Célula vazia no mês — tom discreto estilo contribution graph (GitHub). */
const HEATMAP_EMPTY = 'rgba(245, 241, 236, 0.1)'

function heatmapWeeks(cells: MoodCalendarCell[]): MoodCalendarCell[][]
{
  const weeks: MoodCalendarCell[][] = []
  for (let i = 0; i < cells.length; i += 7)
  {
    weeks.push(cells.slice(i, i + 7))
  }
  return weeks
}

function MonthHeatmap({ cells }: { cells: MoodCalendarCell[] })
{
  const { colors } = useTheme()
  const today = new Date().toISOString().slice(0, 10)
  const weeks = heatmapWeeks(cells)
  const rowStyle = { flexDirection: 'row' as const, gap: HEATMAP_GAP, width: '100%' as const }

  return (
    <View style={{ gap: 8, alignSelf: 'stretch', width: '100%' }}>
      <Text
        variant="caption"
        muted
        style={{ fontWeight: '600', textTransform: 'capitalize' }}
      >
        {currentMonthLabel()}
      </Text>
      <View style={rowStyle}>
        {weekdayLabels().map((d) => (
          <Text
            key={d}
            variant="micro"
            style={{
              flex: 1,
              textAlign: 'center',
              color: colors.inkMuted,
              fontSize: 10,
              lineHeight: 14,
            }}
          >
            {d}
          </Text>
        ))}
      </View>
      <View style={{ gap: HEATMAP_GAP, width: '100%' }}>
        {weeks.map((week, wi) => (
          <View key={`w-${wi}`} style={rowStyle}>
            {week.map((cell) =>
            {
              const isToday = cell.date === today && cell.inMonth
              const visible = cell.inMonth
              const fill = cell.humor ? moodColor(cell.humor) : HEATMAP_EMPTY

              return (
                <View
                  key={cell.date}
                  style={{
                    flex: 1,
                    aspectRatio: 1,
                    borderRadius: 3,
                    backgroundColor: visible ? fill : 'transparent',
                    opacity: visible ? 1 : 0,
                    borderWidth: isToday ? 1 : 0,
                    borderColor: isToday ? colors.ink : 'transparent',
                  }}
                  accessibilityLabel={
                    visible && cell.humor
                      ? `${cell.date}: ${moodLabel(cell.humor)}`
                      : undefined
                  }
                />
              )
            })}
          </View>
        ))}
      </View>
    </View>
  )
}

/** Diário unificado: um painel, hierarquia clara (hoje → registrar → padrões → histórico). */
export function HealthDiaryStudio(props: Props)
{
  const {
    last,
    prompt,
    nota,
    onNotaChange,
    onMood,
    onSaveNote,
    onOpenNotes,
    total,
    slices,
    trend,
    week,
    cells,
    comNota,
    habits,
    alertSlot,
    daySlot,
  } = props

  const { colors, space } = useTheme()
  const { showRail } = useWorkspace()
  const { width } = useWindowDimensions()
  const canSave = Boolean(last && nota.trim())
  const dateLine = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  })

  const weekLine =
    week.count > 0
      ? `Semana: média ${week.avg.toFixed(1)} · ${week.daysLogged} dia(s) com registro`
      : 'Ainda sem registros esta semana'

  const chartW = Math.min(showRail ? 340 : width - 88, width - 48)

  const registerBlock = (
    <>
      <MoodFaceRow value={last?.humor} onChange={onMood} onWidget />
      <Field
        label={prompt}
        value={nota}
        onChangeText={onNotaChange}
        placeholder="Uma frase já vira histórico"
        multiline
        tone="widget"
      />
      <PrimaryButton
        label={canSave ? 'Salvar nota' : 'Escreva algo para salvar a nota'}
        disabled={!canSave}
        onPress={onSaveNote}
      />
      <Pressable
        onPress={onOpenNotes}
        accessibilityRole="button"
        style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text variant="caption" style={{ color: colors.axel, fontWeight: '600' }}>
          Abrir anotações
        </Text>
      </Pressable>
    </>
  )

  const patternsBlock = (
    <View style={{ gap: space.md }}>
      {total === 0 ? (
        <Text variant="body" style={{ color: colors.widgetMuted, lineHeight: 22 }}>
          Depois de alguns check-ins, você vê aqui como o humor se distribui e evolui.
        </Text>
      ) : (
        <>
          <MoodStackBar slices={slices} total={total} />
          {trend.length >= 2 ? (
            <View style={{ gap: 6 }}>
              <Text variant="caption" style={{ color: colors.widgetMuted, fontWeight: '600' }}>
                Evolução recente
              </Text>
              <MiniSparkline
                values={trend.map((t) => t.humor)}
                color={colors.health}
                width={chartW}
                height={56}
              />
            </View>
          ) : null}
          <MonthHeatmap cells={cells} />
        </>
      )}
      {habits ? (
        <View style={{ gap: 8, paddingTop: 4 }}>
          <Text variant="caption" style={{ color: colors.widgetMuted, fontWeight: '600' }}>
            Sono e água
          </Text>
          {habits.sleep.good != null && habits.sleep.bad != null ? (
            <Text variant="caption" style={{ color: 'rgba(245, 241, 236, 0.78)', lineHeight: 20 }}>
              Sono: {moodLabel(habits.sleep.good)} quando dormiu bem · {moodLabel(habits.sleep.bad)} quando não
            </Text>
          ) : null}
          {habits.water.good != null && habits.water.bad != null ? (
            <Text variant="caption" style={{ color: 'rgba(245, 241, 236, 0.78)', lineHeight: 20 }}>
              Água: {moodLabel(habits.water.good)} na meta · {moodLabel(habits.water.bad)} abaixo
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  )

  const moodHeadline = last ? moodLabel(last.humor) : 'Como você está hoje?'

  return (
    <View style={{ gap: space.md }}>
      {alertSlot ? <View style={{ gap: space.sm }}>{alertSlot}</View> : null}

      <View style={{ gap: 2 }}>
        <Text variant="caption" muted>
          {dateLine}
        </Text>
        <Text variant="hero" style={{ fontSize: 28, letterSpacing: -0.8 }}>
          {moodHeadline}
        </Text>
        <Text variant="caption" muted>
          {weekLine}
          {total > 0 ? ` · ${total} registros no total` : ''}
        </Text>
      </View>

      <DiarySection title="Registrar" dividerTop>
        {showRail ? (
          <View style={{ flexDirection: 'row', gap: 24, alignItems: 'flex-start' }}>
            <View style={{ flex: 1, minWidth: 0, gap: space.md }}>{registerBlock}</View>
            <View style={{ flex: 1, minWidth: 0, gap: space.md }}>
              <Text variant="caption" muted style={{ fontWeight: '600' }}>
                Padrões
              </Text>
              {patternsBlock}
            </View>
          </View>
        ) : (
          registerBlock
        )}
      </DiarySection>

      {daySlot ? (
        <DiarySection title="Seu dia" dividerTop>
          {daySlot}
        </DiarySection>
      ) : null}

      {!showRail ? (
        <DiarySection title="Padrões" dividerTop>
          {patternsBlock}
        </DiarySection>
      ) : null}

      {comNota.length > 0 ? (
        <DiarySection title="O que você escreveu" dividerTop>
          {comNota.map((h, i) =>
          {
            const iso = (h.data || '').slice(0, 10)
            if (!iso) return null
            return (
              <View
                key={h.id}
                style={{
                  gap: 4,
                  paddingVertical: 10,
                  borderBottomWidth: i < comNota.length - 1 ? StyleSheet.hairlineWidth : 0,
                  borderBottomColor: DIARY_DIVIDER,
                }}
              >
                <Text variant="caption" muted>
                  {formatDayPt(iso)} · {moodLabel(h.humor)}
                </Text>
                <Text variant="body" style={{ lineHeight: 22 }}>
                  {h.nota}
                </Text>
              </View>
            )
          })}
        </DiarySection>
      ) : null}
    </View>
  )
}
