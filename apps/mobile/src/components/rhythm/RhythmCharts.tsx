import { useState } from 'react'
import { Pressable, View, useWindowDimensions } from 'react-native'
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

/**
 * Gráficos do "Meu ritmo". Regras (dataviz): uma cor de dado por gráfico
 * (laranja Axel, contraste >= 3:1 nos dois temas), barras <= 24px com topo
 * arredondado de 4px e base reta, linha de 2px, pontos >= 8px com anel da
 * superfície, grade de 1px recessiva, toque mostra o valor, e sempre existe
 * a visão em tabela. Texto nunca usa a cor do dado.
 */

const PLOT_H = 140
const AXIS_W = 28
const LABEL_H = 18
/** respiro no topo para o rótulo do eixo não ser cortado */
const PAD_T = 10
const FONT = 'Manrope_500Medium'

/** Coluna com topo arredondado (4px) e base reta. */
function columnPath(x: number, y: number, w: number, h: number): string
{
  if (h <= 0) return ''
  const r = Math.min(4, w / 2, h)
  return `M${x},${y + h} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h} Z`
}

function niceMax(v: number): number
{
  if (v <= 4) return Math.max(1, Math.ceil(v))
  const pow = 10 ** Math.floor(Math.log10(v))
  const step = [1, 2, 2.5, 5, 10].find((s) => s * pow >= v / 4)! * pow
  return Math.ceil(v / step) * step
}

export type ColumnDatum = {
  label: string
  value: number
  /** trilho de referência (ex.: planejados). Barra = feitos */
  track?: number
  /** texto do toque / tabela */
  detail: string
}

type ColumnsProps = {
  data: ColumnDatum[]
  formatTick?: (v: number) => string
  /** nomes para a legenda quando há trilho */
  legend?: { value: string; track: string }
  accessibilityLabel: string
}

export function RhythmColumns({ data, formatTick = (v) => String(v), legend, accessibilityLabel }: ColumnsProps)
{
  const { colors } = useTheme()
  const { width: winW } = useWindowDimensions()
  const [selected, setSelected] = useState<number | null>(null)
  const [table, setTable] = useState(false)
  const width = Math.min(winW - 64, 640)
  const plotW = width - AXIS_W
  const max = niceMax(Math.max(1, ...data.map((d) => Math.max(d.value, d.track ?? 0))))
  const slot = plotW / Math.max(1, data.length)
  const barW = Math.max(4, Math.min(24, slot * 0.6))
  const y = (v: number) => PLOT_H - (v / max) * (PLOT_H - PAD_T)
  const showEvery = data.length > 14 ? Math.ceil(data.length / 7) : 1

  return (
    <View style={{ gap: 8 }}>
      {legend ? <Legend items={[{ label: legend.value, color: colors.axel }, { label: legend.track, color: colors.hairlineStrong }]} /> : null}
      <Text variant="caption" muted style={{ minHeight: 18 }}>
        {selected != null ? data[selected]?.detail : 'Toque numa barra para ver o valor'}
      </Text>
      {table ? (
        <DataTable rows={data.map((d) => [d.label, d.detail])} />
      ) : (
        <View accessible accessibilityLabel={accessibilityLabel}>
          <Svg width={width} height={PLOT_H + LABEL_H + 4}>
            {[0, max / 2, max].map((t) => (
              <Line key={t} x1={AXIS_W} x2={width} y1={y(t)} y2={y(t)} stroke={colors.hairline} strokeWidth={1} />
            ))}
            {[0, max].map((t) => (
              <SvgText key={`t${t}`} x={AXIS_W - 6} y={y(t) + 4} fontSize={10} fontFamily={FONT} fill={colors.inkMuted} textAnchor="end">
                {formatTick(t)}
              </SvgText>
            ))}
            {data.map((d, i) =>
            {
              const x = AXIS_W + i * slot + (slot - barW) / 2
              const active = selected === i
              return (
                <G key={`${d.label}-${i}`}>
                  {d.track != null && d.track > 0 ? (
                    <Path d={columnPath(x, y(d.track), barW, PLOT_H - y(d.track))} fill={colors.hairlineStrong} />
                  ) : null}
                  {d.value > 0 ? (
                    <Path
                      d={columnPath(x, y(d.value), barW, PLOT_H - y(d.value))}
                      fill={colors.axel}
                      opacity={selected == null || active ? 1 : 0.45}
                    />
                  ) : null}
                  {i % showEvery === 0 || i === data.length - 1 ? (
                    <SvgText x={x + barW / 2} y={PLOT_H + 14} fontSize={10} fontFamily={FONT} fill={colors.inkMuted} textAnchor="middle">
                      {d.label}
                    </SvgText>
                  ) : null}
                  {/* alvo de toque maior que a barra */}
                  <Rect
                    x={AXIS_W + i * slot}
                    y={0}
                    width={slot}
                    height={PLOT_H + LABEL_H}
                    fill="transparent"
                    onPress={() => setSelected(active ? null : i)}
                  />
                </G>
              )
            })}
          </Svg>
        </View>
      )}
      <TableToggle table={table} onToggle={() => setTable(!table)} />
    </View>
  )
}

export type LineDatum = { label: string; value: number | null; detail: string }

/** Linha de 2px (1 a 5), com pontos; dias sem registro quebram a linha. */
export function RhythmLine({ data, accessibilityLabel }: { data: LineDatum[]; accessibilityLabel: string })
{
  const { colors } = useTheme()
  const { width: winW } = useWindowDimensions()
  const [selected, setSelected] = useState<number | null>(null)
  const [table, setTable] = useState(false)
  const width = Math.min(winW - 64, 640)
  const plotW = width - AXIS_W
  const slot = plotW / Math.max(1, data.length)
  const x = (i: number) => AXIS_W + i * slot + slot / 2
  const y = (v: number) => PLOT_H - 6 - ((v - 1) / 4) * (PLOT_H - PAD_T - 6)
  const showEvery = data.length > 14 ? Math.ceil(data.length / 7) : 1

  let d = ''
  let pen = false
  data.forEach((p, i) =>
  {
    if (p.value == null)
    {
      pen = false
      return
    }
    d += `${pen ? 'L' : 'M'}${x(i)},${y(p.value)} `
    pen = true
  })

  return (
    <View style={{ gap: 8 }}>
      <Text variant="caption" muted style={{ minHeight: 18 }}>
        {selected != null ? data[selected]?.detail : 'Toque num ponto para ver o dia'}
      </Text>
      {table ? (
        <DataTable rows={data.map((p) => [p.label, p.detail])} />
      ) : (
        <View accessible accessibilityLabel={accessibilityLabel}>
          <Svg width={width} height={PLOT_H + LABEL_H + 4}>
            {[1, 3, 5].map((t) => (
              <Line key={t} x1={AXIS_W} x2={width} y1={y(t)} y2={y(t)} stroke={colors.hairline} strokeWidth={1} />
            ))}
            {[1, 3, 5].map((t) => (
              <SvgText key={`t${t}`} x={AXIS_W - 6} y={y(t) + 4} fontSize={10} fontFamily={FONT} fill={colors.inkMuted} textAnchor="end">
                {t}
              </SvgText>
            ))}
            {d ? <Path d={d} stroke={colors.axel} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" /> : null}
            {data.map((p, i) => (
              <G key={`${p.label}-${i}`}>
                {p.value != null ? (
                  <Circle
                    cx={x(i)}
                    cy={y(p.value)}
                    r={selected === i ? 6 : 4.5}
                    fill={colors.axel}
                    stroke={colors.elevated}
                    strokeWidth={2}
                  />
                ) : null}
                {i % showEvery === 0 || i === data.length - 1 ? (
                  <SvgText x={x(i)} y={PLOT_H + 14} fontSize={10} fontFamily={FONT} fill={colors.inkMuted} textAnchor="middle">
                    {p.label}
                  </SvgText>
                ) : null}
                <Rect
                  x={AXIS_W + i * slot}
                  y={0}
                  width={slot}
                  height={PLOT_H + LABEL_H}
                  fill="transparent"
                  onPress={() => setSelected(selected === i ? null : i)}
                />
              </G>
            ))}
          </Svg>
        </View>
      )}
      <TableToggle table={table} onToggle={() => setTable(!table)} />
    </View>
  )
}

function Legend({ items }: { items: { label: string; color: string }[] })
{
  return (
    <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
      {items.map((it) => (
        <View key={it.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: it.color }} />
          <Text variant="caption" muted>{it.label}</Text>
        </View>
      ))}
    </View>
  )
}

function TableToggle({ table, onToggle }: { table: boolean; onToggle: () => void })
{
  const { colors } = useTheme()
  return (
    <Pressable onPress={onToggle} accessibilityRole="button" hitSlop={8} style={{ alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' }}>
      <Text variant="caption" color={colors.axel} style={{ fontWeight: '600' }}>
        {table ? 'Ver gráfico' : 'Ver em tabela'}
      </Text>
    </Pressable>
  )
}

function DataTable({ rows }: { rows: [string, string][] })
{
  const { colors } = useTheme()
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: colors.hairline }}>
      {rows.map(([a, b], i) => (
        <View key={`${a}-${i}`} style={{ flexDirection: 'row', gap: 12, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
          <Text variant="caption" style={{ width: 52 }}>{a}</Text>
          <Text variant="caption" muted style={{ flex: 1 }}>{b}</Text>
        </View>
      ))}
    </View>
  )
}

/** KPI: rótulo em frase, valor grande, contexto curto. */
export function StatTile({ label, value, sub }: { label: string; value: string; sub?: string })
{
  const { colors } = useTheme()
  return (
    <View
      style={{
        flexGrow: 1,
        flexBasis: '45%',
        padding: 12,
        borderRadius: 14,
        backgroundColor: colors.hairline,
        gap: 2,
      }}
    >
      <Text variant="caption" muted>{label}</Text>
      <Text variant="title" style={{ fontSize: 24 }}>{value}</Text>
      {sub ? <Text variant="micro" muted>{sub}</Text> : null}
    </View>
  )
}
