import { useMemo } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  formatBRL,
  monthExpenseTotal,
  monthDailyExpenseSeries,
  rankCategoriesBySpend,
} from '@simply-life/shared'
import { Card, Text, PrimaryButton, FinanceDonut } from '../../ui'
import { ExpenseSparkline } from '../../ui/ExpenseSparkline'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { useWorkspace } from '../../layout/useWorkspace'

/** Gráficos e panorama abaixo da dobra - Início não fica “vazio”. */
export function HomePanorama()
{
  const { colors, space, radius } = useTheme()
  const { isDesktop } = useWorkspace()
  const router = useRouter()
  const finance = useDataStore((s) => s.finance) ?? []
  const gastos = monthExpenseTotal(finance)
  const series = useMemo(() => monthDailyExpenseSeries(finance), [finance])
  const ranking = useMemo(() => rankCategoriesBySpend(finance).slice(0, 5), [finance])
  const max = ranking[0]?.total ?? 1
  const donutSegments = ranking.map((r) => ({
    color: r.color,
    value: r.total,
    label: r.label,
  }))

  return (
    <View style={{ gap: space.md }}>
      <PrimaryButton
        label="Abrir Finanças"
        variant="secondary"
        size="sm"
        onPress={() => router.push('/(tabs)/financeiro')}
        style={{ alignSelf: 'flex-start', borderRadius: 999 }}
      />

      <Card tone="elevated" style={{ gap: space.sm, borderRadius: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text variant="caption" muted>
            Evolução de gastos
          </Text>
          <Text variant="bodyStrong" color={colors.finance}>
            {formatBRL(gastos)}
          </Text>
        </View>
        <ExpenseSparkline series={series} height={72} color={colors.finance} />
      </Card>

      <View
        style={{
          flexDirection: isDesktop ? 'row' : 'column',
          gap: space.md,
          alignItems: isDesktop ? 'stretch' : undefined,
        }}
      >
        <Card
          tone="elevated"
          style={{
            flex: isDesktop ? 1 : undefined,
            alignItems: 'center',
            gap: space.sm,
            borderRadius: 16,
            minHeight: 220,
          }}
        >
          <Text variant="caption" muted>
            Por categoria
          </Text>
          {ranking.length === 0 ? (
            <Text variant="caption" muted>
              Sem gastos no mês ainda
            </Text>
          ) : (
            <FinanceDonut
              segments={donutSegments}
              centerLabel="Gasto"
              centerValue={formatBRL(gastos)}
              size={isDesktop ? 168 : 156}
              strokeWidth={18}
            />
          )}
        </Card>

        <Card tone="elevated" style={{ flex: isDesktop ? 1 : undefined, gap: space.md, borderRadius: 16 }}>
          <Text variant="caption" muted>
            Ranking do mês
          </Text>
          {ranking.length === 0 ? (
            <Text variant="body" muted>
              Lance um gasto para eu montar o mapa.
            </Text>
          ) : (
            ranking.map((row) => (
              <View key={row.categoria} style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                  <Text variant="bodyStrong">{row.label}</Text>
                  <Text variant="caption" muted>
                    {formatBRL(row.total)} · {row.pct}%
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
                      width: `${Math.round((row.total / max) * 100)}%`,
                      height: '100%',
                      backgroundColor: row.color,
                    }}
                  />
                </View>
              </View>
            ))
          )}
        </Card>
      </View>
    </View>
  )
}
