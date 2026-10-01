import { type ReactNode } from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import {
  moodLabel,
  moodColor,
  formatDayPt,
  type HumorRegistro,
  type MoodDistributionSlice,
  type DiaHumorAgregado,
} from '@simply-life/shared'
import { Text, PrimaryButton, Field } from '../../../ui'
import { MoodFaceRow } from '../../MoodFace'
import { useTheme } from '../../../theme/ThemeProvider'
import { useWorkspace } from '../../../layout/useWorkspace'
import { DiarySection } from './DiarySection'
import { MoodTrendChart, MoodYearGrid } from './MoodCharts'
import { HomeCollapsible } from '../../dashboard/HomeCollapsible'

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
  /** Humor agregado por dia (todo o histórico) */
  days: DiaHumorAgregado[]
  week: WeekReview
  comNota: HumorRegistro[]
  habits: HabitInsight | null
  alertSlot?: ReactNode
  /** "Seu dia": agenda e o que foi concluído, para o registro ter contexto */
  daySlot?: ReactNode
}

function MoodStackBar({ slices, total }: { slices: MoodDistributionSlice[]; total: number })
{
  const { radius, colors } = useTheme()
  if (total === 0) return null

  return (
    <View style={{ gap: 12 }}>
      <View
        style={{
          height: 12,
          borderRadius: radius.pill,
          flexDirection: 'row',
          overflow: 'hidden',
          backgroundColor: colors.featureTrack,
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
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        {([1, 2, 3, 4, 5] as const).map((m) =>
        {
          const slice = slices.find((s) => s.mood === m)
          const count = slice?.value ?? 0
          if (count <= 0) return null
          return (
            <View key={m} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: moodColor(m),
                }}
              />
              <Text variant="micro" style={{ color: colors.featureMuted, fontSize: 11 }}>
                {moodLabel(m)} {Math.round((count / total) * 100)}%
              </Text>
            </View>
          )
        })}
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
    days,
    week,
    comNota,
    habits,
    alertSlot,
    daySlot,
  } = props

  const { colors, space } = useTheme()
  const { showRail } = useWorkspace()
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
      {/* Botão só quando há texto: sem instrução fixa desabilitada na tela */}
      {nota.trim() ? (
        <PrimaryButton
          label={canSave ? 'Salvar nota' : 'Escolha um humor para salvar a nota'}
          disabled={!canSave}
          onPress={onSaveNote}
        />
      ) : null}
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
        <Text variant="body" style={{ color: colors.featureMuted, lineHeight: 22 }}>
          Depois de alguns check-ins, você vê aqui como o humor se distribui e evolui.
        </Text>
      ) : (
        <>
          <MoodStackBar slices={slices} total={total} />
          <MoodTrendChart days={days} />
          <MoodYearGrid days={days} />
        </>
      )}
      {habits ? (
        <View style={{ gap: 12, paddingTop: 4 }}>
          <Text variant="caption" style={{ color: colors.featureMuted, fontWeight: '600' }}>
            Sono e água
          </Text>
          {habits.sleep.good != null && habits.sleep.bad != null ? (
            <Text variant="caption" style={{ color: colors.featureInk, lineHeight: 20 }}>
              Sono: {moodLabel(habits.sleep.good)} quando dormiu bem · {moodLabel(habits.sleep.bad)} quando não
            </Text>
          ) : null}
          {habits.water.good != null && habits.water.bad != null ? (
            <Text variant="caption" style={{ color: colors.featureInk, lineHeight: 20 }}>
              Água: {moodLabel(habits.water.good)} na meta · {moodLabel(habits.water.bad)} abaixo
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  )

  const moodHeadline = last ? moodLabel(last.humor) : 'Como você está hoje?'

  const notesBlock = comNota.length > 0 ? (
    <View>
      {comNota.map((h, i) =>
      {
        const iso = (h.data || '').slice(0, 10)
        if (!iso) return null
        return (
          <View
            key={h.id}
            style={{
              gap: 4,
              paddingVertical: 12,
              borderBottomWidth: i < comNota.length - 1 ? StyleSheet.hairlineWidth : 0,
              borderBottomColor: colors.hairline,
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
    </View>
  ) : null

  const subTitleFor = [
    daySlot ? 'seu dia' : null,
    !showRail ? 'padrões' : null,
    notesBlock ? 'notas' : null,
  ].filter(Boolean).join(', ')

  return (
    <View style={{ gap: space.lg }}>
      {alertSlot ? <View style={{ gap: space.sm }}>{alertSlot}</View> : null}

      {/* 1. Agora: pergunta + registrar, no mesmo grupo */}
      <View style={{ gap: space.md }}>
        <View style={{ gap: 4 }}>
          <Text variant="caption" muted>
            {dateLine}
          </Text>
          <Text variant="hero" style={{ fontSize: 22, lineHeight: 30, letterSpacing: -0.4 }}>
            {moodHeadline}
          </Text>
          <Text variant="caption" muted>
            {weekLine}
          </Text>
        </View>

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
          <View style={{ gap: space.md }}>{registerBlock}</View>
        )}
      </View>

      {/* 2. Consulta: tudo num só bloco recolhido */}
      {subTitleFor ? (
        <HomeCollapsible
          title="Mais do seu diário"
          subtitle={subTitleFor.charAt(0).toUpperCase() + subTitleFor.slice(1)}
          pill="abrir"
          pillColor={colors.health}
        >
          <View style={{ gap: space.lg, paddingTop: space.sm }}>
            {daySlot ? (
              <DiarySection title="Seu dia">{daySlot}</DiarySection>
            ) : null}
            {!showRail ? (
              <DiarySection title="Padrões" dividerTop={Boolean(daySlot)}>
                {patternsBlock}
              </DiarySection>
            ) : null}
            {notesBlock ? (
              <DiarySection title="O que você escreveu" dividerTop>
                {notesBlock}
              </DiarySection>
            ) : null}
          </View>
        </HomeCollapsible>
      ) : null}
    </View>
  )
}
