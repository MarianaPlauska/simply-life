import { useMemo } from 'react'
import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  habitAccent,
  routineLeafSummaries,
  routineWeekCompletionPct,
  routineWeekTitle,
  type RoutineLogs,
  type RoutineHabit,
} from '@simply-life/shared'
import { Text, EmptyState } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  items: RoutineHabit[]
  logs: RoutineLogs
  weekOffset: number
}

/** Relatório semanal de hábitos e rotinas. */
export function RoutineReportPane({ items, logs, weekOffset }: Props)
{
  const { colors, space, radius } = useTheme()
  const title = useMemo(() => routineWeekTitle(weekOffset), [weekOffset])
  const rows = useMemo(
    () => routineLeafSummaries(items, logs, weekOffset),
    [items, logs, weekOffset],
  )
  const overall = useMemo(() => routineWeekCompletionPct(rows), [rows])

  if (rows.length === 0)
  {
    return (
      <EmptyState
        title="Sem dados ainda"
        body="Crie hábitos na aba Hoje para ver sequências e progresso da semana."
        icon="bar-chart-outline"
      />
    )
  }

  return (
    <View style={{ gap: space.md }}>
      <View style={{ gap: 4 }}>
        <Text variant="section" style={{ fontSize: 18 }}>
          Relatório
        </Text>
        <Text variant="caption" muted style={{ textTransform: 'capitalize' }}>
          {title}
        </Text>
      </View>

      <View
        style={{
          padding: 16,
          borderRadius: radius.lg,
          backgroundColor: colors.axelMuted,
          gap: 6,
        }}
      >
        <Text variant="caption" color={colors.axel} style={{ fontWeight: '700' }}>
          Média da semana
        </Text>
        <Text variant="hero" style={{ fontSize: 32, letterSpacing: -1 }}>
          {overall}%
        </Text>
        <Text variant="micro" muted>
          {rows.length} hábito{rows.length === 1 ? '' : 's'} acompanhados
        </Text>
      </View>

      {rows.map((row) =>
      {
        const accent = habitAccent(row.id)
        const capped = Math.min(100, row.pct)
        return (
          <View
            key={row.id}
            style={{
              padding: 14,
              borderRadius: radius.lg,
              backgroundColor: colors.elevated,
              gap: 10,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {row.title}
                </Text>
                {row.parentTitle ? (
                  <Text variant="micro" muted numberOfLines={1}>
                    {row.parentTitle}
                  </Text>
                ) : null}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="flame" size={14} color={row.streak > 0 ? accent : colors.inkFaint} />
                <Text variant="caption" style={{ color: row.streak > 0 ? accent : colors.inkMuted, fontWeight: '700' }}>
                  {row.streak}
                </Text>
              </View>
            </View>
            <View style={{ gap: 6 }}>
              <View
                style={{
                  height: 6,
                  borderRadius: 999,
                  backgroundColor: colors.hairline,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    width: `${capped}%`,
                    height: '100%',
                    borderRadius: 999,
                    backgroundColor: accent,
                  }}
                />
              </View>
              <Text variant="micro" muted>
                {row.weekHits}/{row.weekTarget} dias
                {row.cadence === 'weekly' ? ' (meta semanal)' : ''}
                {' · '}
                {capped}%
              </Text>
            </View>
          </View>
        )
      })}
    </View>
  )
}
