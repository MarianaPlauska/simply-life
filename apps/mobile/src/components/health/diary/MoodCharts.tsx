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
import { useWebDesk } from '../../dashboard/web/webBox'
import { DeskBlockHeader } from './DeskBlockHeader'

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
  const desk = useWebDesk()
  const [width, onLayout] = useWidth()
  const byDay = new Map(days.map((d) => [d.data, d.humor]))
  const today = new Date()
  const todayIso = isoOf(today)

  // computador: até um ano, quadrados um pouco maiores e rótulos legíveis (13px)
  const LABEL_W = desk ? 40 : 26
  const GAP = desk ? 4 : 3
  const MAX_WEEKS = desk ? 53 : 26
  const fitCell = desk && width > 0 ? Math.floor((width - LABEL_W + GAP) / MAX_WEEKS) - GAP : 13
  const CELL = desk ? Math.max(14, Math.min(20, fitCell)) : 13
  const weeks = width > 0 ? Math.max(8, Math.min(MAX_WEEKS, Math.floor((width - LABEL_W + GAP) / (CELL + GAP)))) : 0
  const tick = desk ? 13 : 11
  const tickColor = desk ? colors.inkMuted : colors.featureMuted
  const empty = desk ? colors.hairline : colors.featureTrack

  // Segunda-feira da semana atual, depois volta (weeks - 1) semanas
  const mondayOffset = (today.getDay() + 6) % 7
  const start = addDays(today, -mondayOffset - (weeks - 1) * 7)
  const columns = Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)),
  )
  const logged = columns.flat().filter((d) => byDay.has(isoOf(d))).length

  return (
    <View style={{ gap: desk ? 16 : 12, width: '100%' }} onLayout={onLayout}>
      {desk ? (
        <DeskBlockHeader
          title="Calendário do humor"
          subtitle={weeks > 0 ? `${logged} ${logged === 1 ? 'dia registrado' : 'dias registrados'} em ${weeks} semanas` : undefined}
        />
      ) : (
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
      )}

      {weeks > 0 ? (
        <View style={{ gap: 6 }}>
          {/* Meses: aparecem na coluna em que o mês começa */}
          <View style={{ flexDirection: 'row', paddingLeft: LABEL_W, height: desk ? 18 : 14 }}>
            {columns.map((col, i) =>
            {
              const first = col.find((d) => d.getDate() === 1)
              // computador: a 1ª coluna só ganha rótulo se o próximo mês não começa logo em seguida
              const nextStarts = desk && columns.slice(1, 3).some((c) => c.some((d) => d.getDate() === 1))
              const show = i === 0 ? (col[0].getDate() <= 7 || !first) && !nextStarts : Boolean(first)
              const month = (first ?? col[0]).getMonth()
              return (
                <View key={`m-${i}`} style={{ width: CELL + GAP, overflow: 'visible' }}>
                  {show ? (
                    <Text variant="micro" numberOfLines={desk ? undefined : 1} style={desk ? { color: tickColor, fontSize: tick, lineHeight: 18, position: 'absolute', left: 0, width: 48 } : { color: tickColor, fontSize: tick, lineHeight: 14, width: 40 }}>
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
                  <Text variant="micro" style={{ color: tickColor, fontSize: tick, lineHeight: CELL }}>
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
                          backgroundColor: future ? 'transparent' : mood ? moodColor(mood) : empty,
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
            <Text variant="micro" style={{ color: tickColor, fontSize: tick, marginRight: 2 }}>
              Péssimo
            </Text>
            {[1, 2, 3, 4, 5].map((m) => (
              <View key={m} style={{ width: desk ? 12 : 11, height: desk ? 12 : 11, borderRadius: 2, backgroundColor: moodColor(m) }} />
            ))}
            <Text variant="micro" style={{ color: tickColor, fontSize: tick, marginLeft: 2 }}>
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
  const desk = useWebDesk()
  const [width, onLayout] = useWidth()
  const today = new Date()
  const from = addDays(today, -(span - 1))
  const fromIso = isoOf(from)
  const points = days.filter((d) => d.data >= fromIso && d.data <= isoOf(today))

  // computador: gráfico mais alto, eixos em 13px e datas a cada semana
  const H = desk ? 200 : 132
  const LEFT = desk ? 72 : 56
  const RIGHT = 8
  const TOP = desk ? 10 : 8
  const BOTTOM = desk ? 28 : 18
  const tick = desk ? 13 : 11
  const tickColor = desk ? colors.inkMuted : colors.featureMuted
  const tickFont = desk ? 'Lexend_400Regular' : 'Lexend_500Medium'
  const plotW = Math.max(0, width - LEFT - RIGHT)
  const plotH = H - TOP - BOTTOM
  const y = (m: number) => TOP + ((5 - m) / 4) * plotH
  const xIdx = (idx: number) => LEFT + (Math.max(0, Math.min(span - 1, idx)) / (span - 1)) * plotW
  const x = (iso: string) =>
  {
    const d = new Date(`${iso}T12:00:00`)
    return xIdx(Math.round((d.getTime() - from.getTime()) / 86400000))
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
  // datas intermediárias (só no computador): uma por semana, contando de hoje para trás
  const midTicks = desk ? [7, 14, 21].filter((back) => back < span - 4).map((back) => span - 1 - back) : []
  const avgText = avg != null ? `Média ${avg.toFixed(1).replace('.', ',')} · ${moodLabel(avg)}` : null

  return (
    <View style={{ gap: desk ? 16 : 8, width: '100%' }} onLayout={onLayout}>
      {desk ? (
        <DeskBlockHeader
          title={`Últimos ${span} dias`}
          subtitle={avgText ? `${avgText}, linha tracejada` : 'Cada ponto é um dia com registro'}
        />
      ) : (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text variant="caption" style={{ color: colors.featureMuted, fontWeight: '600' }}>
            Últimos {span} dias
          </Text>
          {avgText ? (
            <Text variant="micro" style={{ color: colors.featureInk, fontWeight: '700' }}>
              {avgText}
            </Text>
          ) : null}
        </View>
      )}
      {width > 0 ? (
        <Svg width={width} height={H}>
          {[5, 4, 3, 2, 1].map((m) => (
            <Line key={`g-${m}`} x1={LEFT} x2={width - RIGHT} y1={y(m)} y2={y(m)} stroke={colors.hairline} strokeWidth={1} />
          ))}
          {[5, 4, 3, 2, 1].map((m) => (
            <SvgText key={`l-${m}`} x={0} y={y(m) + 4} fontSize={tick} fill={tickColor} fontFamily={tickFont}>
              {moodLabel(m)}
            </SvgText>
          ))}
          {avg != null ? (
            <Line x1={LEFT} x2={width - RIGHT} y1={y(avg)} y2={y(avg)} stroke={desk ? colors.ink : colors.featureInk} strokeOpacity={0.45} strokeWidth={1} strokeDasharray="4 4" />
          ) : null}
          {segments.filter((s) => s.length > 1).map((s, i) => (
            <Polyline
              key={`s-${i}`}
              points={s.map((p) => `${x(p.data)},${y(p.humor)}`).join(' ')}
              fill="none"
              stroke={desk ? colors.inkFaint : colors.featureMuted}
              strokeWidth={desk ? 2 : 1.5}
              strokeLinejoin="round"
            />
          ))}
          {points.map((p) => (
            <Circle key={p.data} cx={x(p.data)} cy={y(p.humor)} r={desk ? 6 : 5} fill={moodColor(p.humor)} stroke={desk ? colors.elevated : colors.featureBg} strokeWidth={desk ? 2 : 1.5} />
          ))}
          <SvgText x={LEFT} y={H - (desk ? 6 : 4)} fontSize={tick} fill={tickColor} fontFamily={tickFont}>
            {fmt(from)}
          </SvgText>
          {midTicks.map((idx) => (
            <SvgText key={`t-${idx}`} x={xIdx(idx)} y={H - (desk ? 6 : 4)} fontSize={tick} fill={tickColor} fontFamily={tickFont} textAnchor="middle">
              {fmt(addDays(from, idx))}
            </SvgText>
          ))}
          <SvgText x={width - RIGHT} y={H - (desk ? 6 : 4)} fontSize={tick} fill={tickColor} fontFamily={tickFont} textAnchor="end">
            Hoje
          </SvgText>
        </Svg>
      ) : null}
      {points.length === 0 ? (
        <Text variant="caption" style={{ color: tickColor }}>
          Nenhum registro nos últimos {span} dias.
        </Text>
      ) : null}
    </View>
  )
}
