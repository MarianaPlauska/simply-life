import { useState, type ReactNode } from 'react'
import { TextInput, View, type TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import {
  moodLabel,
  moodColor,
  formatDayPt,
  type HumorRegistro,
  type MoodDistributionSlice,
  type DiaHumorAgregado,
} from '@simply-life/shared'
import { Text, PrimaryButton } from '../../../ui'
import { Icon } from '../../../ui/Icon'
import { Panel } from '../../../ui/Panel'
import { useTheme } from '../../../theme/ThemeProvider'
import { useWorkspace } from '../../../layout/useWorkspace'
import { WebHoverable } from '../../dashboard/web/WebHoverable'
import { webStyle } from '../../dashboard/web/webStyle'
import { WEB_DISPLAY_FONT } from '../../dashboard/web/webTypography'
import { MoodTrendChart, MoodYearGrid } from './MoodCharts'
import { DeskBlockHeader } from './DeskBlockHeader'
import { MoodChipRow } from '../web/MoodChipRow'

const NOTES_PER_PAGE = 5

type WeekReview = { avg: number; daysLogged: number; best: number; worst: number; count: number }

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
  days: DiaHumorAgregado[]
  week: WeekReview
  comNota: HumorRegistro[]
  habits: HabitInsight | null
  alertSlot?: ReactNode
  daySlot?: ReactNode
}

/**
 * Diário no computador: grade de 3 colunas (uma só abaixo de 1280px), cada célula
 * uma superfície. Registrar fica no topo; gráficos e notas em células do tamanho certo.
 */
export function HealthDiaryDesk(props: Props)
{
  const { last, prompt, nota, onNotaChange, onMood, onSaveNote, onOpenNotes, total, slices, days, week, comNota, habits, alertSlot, daySlot } = props
  const { colors } = useTheme()
  const { width } = useWorkspace()
  const router = useRouter()
  const wideGrid = width >= 1280
  const span2 = webStyle({ gridColumn: wideGrid ? 'span 2' : undefined })
  const spanAll = webStyle({ gridColumn: wideGrid ? 'span 3' : undefined })
  const [page, setPage] = useState(0)
  const [noteH, setNoteH] = useState(0)
  const canSave = Boolean(last && nota.trim())

  const dateRaw = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const dateLine = dateRaw.charAt(0).toUpperCase() + dateRaw.slice(1)
  const pages = Math.max(1, Math.ceil(comNota.length / NOTES_PER_PAGE))
  const pageSafe = Math.min(page, pages - 1)
  const pageNotes = comNota.slice(pageSafe * NOTES_PER_PAGE, (pageSafe + 1) * NOTES_PER_PAGE)

  // ---- células ----

  const checkIn = (
    <View style={{ gap: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <View style={{ gap: 4, flex: 1, minWidth: 0 }}>
          <Text variant="caption" muted>
            {dateLine}
          </Text>
          <Text style={{ fontFamily: WEB_DISPLAY_FONT, fontSize: 26, lineHeight: 34, letterSpacing: -0.3, color: colors.ink }}>
            {last ? `Hoje você está ${moodLabel(last.humor).toLowerCase()}` : 'Como você está hoje?'}
          </Text>
        </View>
        <WebHoverable onPress={onOpenNotes} style={webStyle({ cursor: 'pointer', paddingTop: 4 })}>
          {(hovered) => (
            <Text variant="caption" style={{ color: colors.axel, textDecorationLine: hovered ? 'underline' : 'none' }}>
              Abrir anotações
            </Text>
          )}
        </WebHoverable>
      </View>

      <MoodChipRow value={last?.humor} onChange={onMood} />

      <View style={{ gap: 8 }}>
        <Text variant="caption" muted>
          {prompt}
        </Text>
        {/* campo cresce com o texto: começa com duas linhas, sem área vazia gigante */}
        <TextInput
          multiline
          value={nota}
          onChangeText={onNotaChange}
          onContentSizeChange={(e) => setNoteH(e.nativeEvent.contentSize.height)}
          placeholder="Uma frase já vira histórico"
          placeholderTextColor={colors.inkFaint}
          style={webStyle({
            height: Math.max(72, Math.min(220, noteH + 2)),
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 16,
            lineHeight: 24,
            fontFamily: 'Lexend_400Regular',
            color: colors.ink,
            backgroundColor: colors.canvas,
            borderWidth: 1,
            borderColor: colors.hairline,
            outlineStyle: 'none',
            resize: 'none',
          }) as TextStyle}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, minHeight: 44 }}>
          <Text variant="caption" muted style={{ flex: 1 }}>
            {!last ? 'Escolha um humor acima para salvar junto com a nota.' : nota.trim() ? 'A nota fica no histórico de hoje.' : 'Escrever é opcional.'}
          </Text>
          {nota.trim() ? (
            <PrimaryButton label="Salvar nota" size="sm" disabled={!canSave} onPress={onSaveNote} />
          ) : null}
        </View>
      </View>
    </View>
  )

  const statCell = (label: string, value: string, tint?: string) => (
    <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
      <Text variant="caption" muted>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {tint ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: tint }} /> : null}
        <Text variant="body">{value}</Text>
      </View>
    </View>
  )

  const weekBlock = (
    <View style={{ gap: 16 }}>
      <DeskBlockHeader title="Esta semana" subtitle="Últimos 7 dias" />
      {week.count > 0 ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 12 }}>
            <Text style={{ fontFamily: WEB_DISPLAY_FONT, fontSize: 40, lineHeight: 48, color: colors.ink }}>
              {week.avg.toFixed(1).replace('.', ',')}
            </Text>
            <Text variant="body" muted>
              média, {moodLabel(week.avg).toLowerCase()}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            {statCell('Registros', `${week.daysLogged} de 7 dias`)}
            {statCell('Melhor', moodLabel(week.best), moodColor(week.best))}
            {statCell('Mais difícil', moodLabel(week.worst), moodColor(week.worst))}
          </View>
        </>
      ) : (
        <Text variant="body" muted>
          Ainda sem registros esta semana.
        </Text>
      )}
    </View>
  )

  const distributionBlock = (
    <View style={{ gap: 16 }}>
      <DeskBlockHeader title="Como o humor se distribui" subtitle={`${total} ${total === 1 ? 'registro' : 'registros'} no total`} />
      {total === 0 ? (
        <Text variant="body" muted>
          Depois de alguns check-ins, você vê aqui como o humor se distribui.
        </Text>
      ) : (
        <View style={{ gap: 16 }}>
          {[5, 4, 3, 2, 1].map((m) =>
          {
            const count = slices.find((s) => s.mood === m)?.value ?? 0
            const pct = Math.round((count / total) * 100)
            return (
              <View key={m} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text variant="caption" style={{ width: 72 }}>
                  {moodLabel(m)}
                </Text>
                <View style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.hairline, overflow: 'hidden' }}>
                  <View style={{ width: `${pct}%`, height: '100%', borderRadius: 5, backgroundColor: moodColor(m) }} />
                </View>
                <Text variant="caption" muted style={{ width: 44, textAlign: 'right' }}>
                  {pct}%
                </Text>
              </View>
            )
          })}
        </View>
      )}
    </View>
  )

  const habitRow = (icon: keyof typeof Icon.glyphMap, label: string, good: number, goodHint: string, bad: number, badHint: string) => (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name={icon} size={16} color={colors.inkMuted} />
        <Text variant="bodyStrong" style={{ fontSize: 15 }}>
          {label}
        </Text>
      </View>
      {[
        [goodHint, good],
        [badHint, bad],
      ].map(([hint, value]) => (
        <View key={hint as string} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Text variant="caption" muted>
            {hint as string}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: moodColor(value as number) }} />
            <Text variant="caption">{moodLabel(value as number)}</Text>
          </View>
        </View>
      ))}
    </View>
  )

  const habitsBlock = habits ? (
    <View style={{ gap: 16 }}>
      <DeskBlockHeader title="Sono e água" subtitle="Seu humor médio em cada caso" />
      {habits.sleep.good != null && habits.sleep.bad != null
        ? habitRow('moon-outline', 'Sono', habits.sleep.good, 'Dormiu 7h ou mais', habits.sleep.bad, 'Dormiu menos')
        : null}
      {habits.water.good != null && habits.water.bad != null
        ? habitRow('water-outline', 'Água', habits.water.good, 'Na meta', habits.water.bad, 'Abaixo da meta')
        : null}
    </View>
  ) : null

  const notesBlock = (
    <View style={{ gap: 12 }}>
      <DeskBlockHeader
        title="O que você escreveu"
        subtitle={comNota.length ? `${comNota.length} ${comNota.length === 1 ? 'nota' : 'notas'}` : undefined}
      />
      {comNota.length === 0 ? (
        <Text variant="body" muted>
          As notas que você escrever no check-in aparecem aqui.
        </Text>
      ) : (
        <View>
          {pageNotes.map((h, i) =>
          {
            const iso = (h.data || '').slice(0, 10)
            if (!iso) return null
            return (
              <View
                key={h.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  gap: 16,
                  paddingVertical: 12,
                  borderTopWidth: i > 0 ? 1 : 0,
                  borderTopColor: colors.hairline,
                }}
              >
                <Text variant="caption" muted style={{ width: 128 }}>
                  {formatDayPt(iso)}
                </Text>
                <View style={{ width: 96, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: moodColor(h.humor) }} />
                  <Text variant="caption">{moodLabel(h.humor)}</Text>
                </View>
                <Text variant="body" style={{ flex: 1, minWidth: 0 }}>
                  {h.nota}
                </Text>
              </View>
            )
          })}
          {pages > 1 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 12 }}>
              <Text variant="caption" muted style={{ flex: 1 }}>
                Página {pageSafe + 1} de {pages}
              </Text>
              <PrimaryButton label="Mais novas" variant="ghost" size="sm" disabled={pageSafe === 0} onPress={() => setPage(pageSafe - 1)} />
              <PrimaryButton label="Mais antigas" variant="ghost" size="sm" disabled={pageSafe >= pages - 1} onPress={() => setPage(pageSafe + 1)} />
            </View>
          ) : null}
        </View>
      )}
    </View>
  )

  const reportBlock = (
    <View style={{ gap: 8 }}>
      <DeskBlockHeader title="Relatório por período" />
      <Text variant="caption" muted>
        Humor, gastos, comida, água, sono e tarefas das datas que você escolher, em PDF.
      </Text>
      <WebHoverable onPress={() => router.push('/relatorio' as never)} style={webStyle({ cursor: 'pointer', alignSelf: 'flex-start', paddingVertical: 4 })}>
        {(hovered) => (
          <Text variant="caption" style={{ color: colors.axel, textDecorationLine: hovered ? 'underline' : 'none' }}>
            Gerar relatório
          </Text>
        )}
      </WebHoverable>
    </View>
  )

  return (
    <View style={{ gap: 16 }}>
      {alertSlot ? <Panel>{alertSlot}</Panel> : null}

      <View style={webStyle({ display: 'grid', gridTemplateColumns: wideGrid ? 'repeat(3, minmax(0, 1fr))' : 'minmax(0, 1fr)', gap: 16, alignItems: 'start' })}>
        <Panel style={span2}>{checkIn}</Panel>
        <Panel>
          {weekBlock}
          {reportBlock}
        </Panel>

        <Panel style={span2}>
          <MoodTrendChart days={days} />
        </Panel>
        <Panel>{distributionBlock}</Panel>

        <Panel style={span2}>
          <MoodYearGrid days={days} />
        </Panel>
        <Panel>
          {habitsBlock}
          {daySlot ? (
            <View style={{ gap: 12 }}>
              <DeskBlockHeader title="Seu dia" />
              {daySlot}
            </View>
          ) : null}
        </Panel>

        <Panel style={spanAll}>{notesBlock}</Panel>
      </View>
    </View>
  )
}
