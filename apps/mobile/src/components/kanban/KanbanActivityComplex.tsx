import { useMemo } from 'react'
import { View } from 'react-native'
import { consecutiveActivity, taskActivityByDay, taskActivityGrid, type MobileTask } from '@simply-life/shared'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

const DAY_LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const WEEKS = 12

type Props = { tasks: MobileTask[] }

/** Heatmap + barras da semana — complexo de atividades no Kanban. */
export function KanbanActivityComplex({ tasks }: Props)
{
  const { colors, mode } = useTheme()
  const series = useMemo(() => taskActivityGrid(tasks, WEEKS), [tasks])
  const week = useMemo(() => taskActivityByDay(tasks, 7).slice().reverse(), [tasks])
  const peak = Math.max(...week.map((d) => d.count), 1)
  const idle = mode === 'dark' ? '#2C2C2E' : '#E4D8C8'
  const empty = mode === 'dark' ? '#2C2C2E' : '#EDE8E0'
  const cardBg = mode === 'dark' ? 'rgba(28, 28, 30, 0.5)' : 'rgba(255, 255, 255, 0.72)'
  const streak = useMemo(
    () => consecutiveActivity(series.filter((d) => d.count > 0).map((d) => d.iso)),
    [series],
  )
  const from = series[0]?.iso
  const to = series[series.length - 1]?.iso
  const range =
    from && to
      ? `${from.slice(8, 10)}/${from.slice(5, 7)} – ${to.slice(8, 10)}/${to.slice(5, 7)}`
      : ''

  const columns: { iso: string; count: number }[][] = []
  for (let w = 0; w < WEEKS; w += 1)
  {
    columns.push(series.slice(w * 7, w * 7 + 7))
  }

  function cellColor(count: number): string
  {
    if (count <= 0) return empty
    if (count === 1) return 'rgba(232, 115, 74, 0.35)'
    if (count === 2) return 'rgba(232, 115, 74, 0.62)'
    return colors.axel
  }

  return (
    <View style={{ gap: 14, padding: 18, borderRadius: 24, backgroundColor: cardBg }}>
      <View>
        <Text variant="caption" muted style={{ fontWeight: '700', letterSpacing: 0.6 }}>
          CONSTÂNCIA
        </Text>
        <Text variant="section" style={{ fontSize: 17, marginTop: 4 }}>
          {streak.current} dias de ritmo
        </Text>
        <Text variant="caption" muted>
          Recorde {streak.record} · {streak.weekLogged}/7 nesta semana
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 4 }}>
        <View style={{ gap: 3, paddingTop: 2, paddingRight: 4 }}>
          {DAY_LETTERS.map((l, i) => (
            <Text
              key={`${l}-${i}`}
              variant="micro"
              muted
              style={{ height: 11, fontSize: 8, lineHeight: 11 }}
            >
              {i % 2 === 0 ? l : ''}
            </Text>
          ))}
        </View>
        <View style={{ flex: 1, flexDirection: 'row', gap: 3 }}>
          {columns.map((col, wi) => (
            <View key={wi} style={{ flex: 1, gap: 3 }}>
              {col.map((d) => (
                <View
                  key={d.iso}
                  style={{
                    width: '100%',
                    height: 11,
                    borderRadius: 3,
                    backgroundColor: cellColor(d.count),
                  }}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      <Text variant="caption" muted>
        {range}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 36 }}>
        {week.map((d, i) =>
        {
          const ht = d.count <= 0 ? 10 : 10 + Math.round((d.count / peak) * 26)
          const today = i === 0
          return (
            <View
              key={d.iso}
              style={{
                flex: 1,
                height: ht,
                borderRadius: 8,
                backgroundColor: today ? colors.axel : idle,
              }}
            />
          )
        })}
      </View>
    </View>
  )
}
