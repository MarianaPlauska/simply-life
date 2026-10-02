import { useMemo } from 'react'
import { View } from 'react-native'
import { completionDays, taskActivityByDay, taskActivityGrid, type MobileTask } from '@simply-life/shared'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useAccents } from '../../theme/useAccents'
import { useElo } from '../../hooks/useElo'
import { usePlanLogStore } from '../../store/planLogStore'

/** segunda a domingo, como o mapa de dias do elo */
const DAY_LETTERS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']
const WEEKS = 12

type Props = { tasks: MobileTask[] }

/** Heatmap + barras da semana — complexo de atividades no Kanban. */
export function KanbanActivityComplex({ tasks }: Props)
{
  const { colors } = useTheme()
  const accents = useAccents()
  const completions = usePlanLogStore((s) => s.completions)
  // tarefas CONCLUÍDAS no dia local da conclusão (não as que vencem no dia)
  const doneOn = useMemo(() => completionDays(tasks, completions, false), [tasks, completions])
  const series = useMemo(() => taskActivityGrid(tasks, WEEKS, new Date(), doneOn), [tasks, doneOn])
  const week = useMemo(() => taskActivityByDay(tasks, 7, new Date(), doneOn).slice().reverse(), [tasks, doneOn])
  const peak = Math.max(...week.map((d) => d.count), 1)
  const idle = colors.hairline
  const empty = colors.hairline
  const cardBg = colors.surface
  const elo = useElo()
  const from = series[0]?.iso
  const to = series[series.length - 1]?.iso
  const range =
    from && to
      ? `${from.slice(8, 10)}/${from.slice(5, 7)} a ${to.slice(8, 10)}/${to.slice(5, 7)}`
      : ''

  const columns: { iso: string; count: number }[][] = []
  for (let w = 0; w < WEEKS; w += 1)
  {
    columns.push(series.slice(w * 7, w * 7 + 7))
  }

  function cellColor(count: number): string
  {
    if (count <= 0) return empty
    // teal da paleta em três intensidades (coral fica só para ação)
    if (count === 1) return `${accents.data}59`
    if (count === 2) return `${accents.data}9E`
    return accents.data
  }

  return (
    <View style={{ gap: 16, padding: 20, borderRadius: 20, backgroundColor: cardBg }}>
      <View>
        <Text variant="caption" muted style={{ fontWeight: '700', letterSpacing: 0.6 }}>
          CONSTÂNCIA
        </Text>
        <Text variant="section" style={{ marginTop: 4 }}>
          Elo de {elo.atual} dia{elo.atual === 1 ? '' : 's'}
        </Text>
        <Text variant="caption" muted>
          Recorde {elo.recorde} · {elo.cumpridosNaSemana} dia{elo.cumpridosNaSemana === 1 ? '' : 's'} cumprido{elo.cumpridosNaSemana === 1 ? '' : 's'} nesta semana
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 6 }}>
        <View style={{ gap: 4, paddingRight: 4 }}>
          {DAY_LETTERS.map((l, i) => (
            <Text
              key={`${l}-${i}`}
              variant="micro"
              muted
              style={{ height: 16 }}
            >
              {i % 2 === 0 ? l : ''}
            </Text>
          ))}
        </View>
        <View style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
          {columns.map((col, wi) => (
            <View key={wi} style={{ flex: 1, gap: 4 }}>
              {col.map((d) => (
                <View
                  key={d.iso}
                  style={{
                    width: '100%',
                    height: 16,
                    borderRadius: 4,
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

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 36 }}>
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
                backgroundColor: today ? accents.data : idle,
              }}
            />
          )
        })}
      </View>
    </View>
  )
}
