import { useState } from 'react'
import { View, type LayoutChangeEvent } from 'react-native'
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg'
import {
  localTodayIso,
  moodColor,
  moodLabel,
  type DiaHumorAgregado,
} from '@simply-life/shared'
import { Text } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function isoOf(d: Date): string
{
  return localTodayIso(d)
}

function addDays(d: Date, n: number): Date
{
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function useWidth(): [number, (e: LayoutChangeEvent) => void]
{
  const [w, setW] = useState(0)
  return [w, (e) => setW(Math.round(e.nativeEvent.layout.width))]
}

/**
 * Calendário estilo GitHub: cada coluna é uma semana (seg a dom), cada quadrado um dia,
 * na cor do humor. Mostra quantas semanas couberem, terminando na semana atual.
 */
export function MoodYearGrid({ days }: { days: DiaHumorAgregado[] })
{
  const { colors } = useTheme()
  const [width, onLayout] = useWidth()
  const byDay = new Map(days.map((d) => [d.data, d.humor]))
  const today = new Date()
  const todayIso = isoOf(today)

  const LABEL_W = 26
  const GAP = 3
  const CELL = 13
  const weeks = width > 0 ? Math.max(8, Math.min(26, Math.floor((width - LABEL_W + GAP) / (CELL + GAP)))) : 0

  // Segunda-feira da semana atual, depois volta (weeks - 1) semanas
  const mondayOffset = (today.getDay() + 6) % 7
  const start = addDays(today, -mondayOffset - (weeks - 1) * 7)
  const columns = Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)),
  )
  const logged = columns.flat().filter((d) => byDay.has(isoOf(d))).length

  return (
    <View style={{ gap: 12, width: '100%' }} onLayout={onLayout}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text variant="caption" style={{ color: colors.featureMuted, fontWeight: '600' }}>
          Calendário do humor
        </Text>
        {weeks > 0 ? (
          <Text variant="micro" style={{ color: colors.featureMuted }}>
            {logged} {logged === 1 ? 'dia registrado' : 'dias registrados'} em {weeks} semanas
          </Text>
        ) : null}
      </View>

      {weeks > 0 ? (
        <View style={{ gap: 6 }}>
          {/* Meses: aparecem na coluna em que o mês começa */}
          <View style={{ flexDirection: 'row', paddingLeft: LABEL_W, height: 14 }}>
            {columns.map((col, i) =>
            {
              const first = col.find((d) => d.getDate() === 1)
              const show = i === 0 ? col[0].getDate() <= 7 || !first : Boolean(first)
              const month = (first ?? col[0]).getMonth()
              return (
                <View key={`m-${i}`} style={{ width: CELL + GAP, overflow: 'visible' }}>
                  {show ? (
                    <Text variant="micro" numberOfLines={1} style={{ color: colors.featureMuted, fontSize: 11, lineHeight: 14, width: 40 }}>
                      {MONTHS[month]}
                    </Text>
                  ) : null}
                </View>
              )
            })}
          </View>

          <View style={{ flexDirection: 'row' }}>
            <View style={{ width: LABEL_W, gap: GAP }}>
              {['Seg', '', 'Qua', '', 'Sex', '', ''].map((l, i) => (
                <View key={`d-${i}`} style={{ height: CELL, justifyContent: 'center' }}>
                  <Text variant="micro" style={{ color: colors.featureMuted, fontSize: 11, lineHeight: CELL }}>
                    {l}
                  </Text>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: GAP }}>
              {columns.map((col, i) => (
                <View key={`c-${i}`} style={{ gap: GAP }}>
                  {col.map((d) =>
                  {
                    const iso = isoOf(d)
                    const future = iso > todayIso
                    const mood = byDay.get(iso)
                    return (
                      <View
                        key={iso}
                        accessibilityLabel={mood ? `${iso}: ${moodLabel(mood)}` : undefined}
                        style={{
                          width: CELL,
                          height: CELL,
                          borderRadius: 3,
                          backgroundColor: future ? 'transparent' : mood ? moodColor(mood) : colors.featureTrack,
                          borderWidth: iso === todayIso ? 1.5 : 0,
                          borderColor: colors.featureInk,
                        }}
                      />
                    )
                  })}
                </View>
              ))}
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 2 }}>
            <Text variant="micro" style={{ color: colors.featureMuted, fontSize: 11, marginRight: 2 }}>
              Péssimo
            </Text>
            {[1, 2, 3, 4, 5].map((m) => (
              <View key={m} style={{ width: 11, height: 11, borderRadius: 2, backgroundColor: moodColor(m) }} />
            ))}
            <Text variant="micro" style={{ color: colors.featureMuted, fontSize: 11, marginLeft: 2 }}>
              Ótimo
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  )
}

/**
 * Evolução dos últimos 30 dias em escala fixa (Péssimo a Ótimo), com cada ponto na data real.
 * Dias sem registro ficam vazios, sem inventar linha entre eles.
 */
export function MoodTrendChart({ days, span = 30 }: { days: DiaHumorAgregado[]; span?: number })
{
  const { colors } = useTheme()
  const [width, onLayout] = useWidth()
  const today = new Date()
  const from = addDays(today, -(span - 1))
  const fromIso = isoOf(from)
  const points = days.filter((d) => d.data >= fromIso && d.data <= isoOf(today))

  const H = 132
  const LEFT = 56
  const RIGHT = 8
  const TOP = 8
  const BOTTOM = 18
  const plotW = Math.max(0, width - LEFT - RIGHT)
  const plotH = H - TOP - BOTTOM
  const y = (m: number) => TOP + ((5 - m) / 4) * plotH
  const x = (iso: string) =>
  {
    const d = new Date(`${iso}T12:00:00`)
    const idx = Math.round((d.getTime() - from.getTime()) / 86400000)
    return LEFT + (Math.max(0, Math.min(span - 1, idx)) / (span - 1)) * plotW
  }

  const avg = points.length ? points.reduce((s, p) => s + p.humor, 0) / points.length : null
  // Linha só liga registros com até 3 dias de distância; lacunas maiores ficam abertas
  const segments: DiaHumorAgregado[][] = []
  for (const p of points)
  {
    const lastSeg = segments[segments.length - 1]
    const prev = lastSeg?.[lastSeg.length - 1]
    const gap = prev ? (new Date(`${p.data}T12:00:00`).getTime() - new Date(`${prev.data}T12:00:00`).getTime()) / 86400000 : 0
    if (!lastSeg || gap > 3) segments.push([p])
    else lastSeg.push(p)
  }

  const fmt = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`

  return (
    <View style={{ gap: 8, width: '100%' }} onLayout={onLayout}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text variant="caption" style={{ color: colors.featureMuted, fontWeight: '600' }}>
          Últimos {span} dias
        </Text>
        {avg != null ? (
          <Text variant="micro" style={{ color: colors.featureInk, fontWeight: '700' }}>
            Média {avg.toFixed(1).replace('.', ',')} · {moodLabel(avg)}
          </Text>
        ) : null}
      </View>
      {width > 0 ? (
        <Svg width={width} height={H}>
          {[5, 4, 3, 2, 1].map((m) => (
            <Line key={`g-${m}`} x1={LEFT} x2={width - RIGHT} y1={y(m)} y2={y(m)} stroke={colors.hairline} strokeWidth={1} />
          ))}
          {[5, 4, 3, 2, 1].map((m) => (
            <SvgText key={`l-${m}`} x={0} y={y(m) + 4} fontSize={11} fill={colors.featureMuted} fontFamily="Lexend_500Medium">
              {moodLabel(m)}
            </SvgText>
          ))}
          {avg != null ? (
            <Line x1={LEFT} x2={width - RIGHT} y1={y(avg)} y2={y(avg)} stroke={colors.featureInk} strokeOpacity={0.45} strokeWidth={1} strokeDasharray="4 4" />
          ) : null}
          {segments.filter((s) => s.length > 1).map((s, i) => (
            <Polyline
              key={`s-${i}`}
              points={s.map((p) => `${x(p.data)},${y(p.humor)}`).join(' ')}
              fill="none"
              stroke={colors.featureMuted}
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
          ))}
          {points.map((p) => (
            <Circle key={p.data} cx={x(p.data)} cy={y(p.humor)} r={5} fill={moodColor(p.humor)} stroke={colors.featureBg} strokeWidth={1.5} />
          ))}
          <SvgText x={LEFT} y={H - 4} fontSize={11} fill={colors.featureMuted} fontFamily="Lexend_500Medium">
            {fmt(from)}
          </SvgText>
          <SvgText x={width - RIGHT} y={H - 4} fontSize={11} fill={colors.featureMuted} fontFamily="Lexend_500Medium" textAnchor="end">
            Hoje
          </SvgText>
        </Svg>
      ) : null}
      {points.length === 0 ? (
        <Text variant="caption" style={{ color: colors.featureMuted }}>
          Nenhum registro nos últimos {span} dias.
        </Text>
      ) : null}
    </View>
  )
}
