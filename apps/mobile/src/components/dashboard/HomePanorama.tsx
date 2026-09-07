import { useEffect, useMemo } from 'react'
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
import { useCategoryMetaStore } from '../../store/categoryMetaStore'
import { colorMapFromMeta } from '../../lib/categoryMeta'

/** Gráficos e panorama abaixo da dobra - Início não fica “vazio”. */
export function HomePanorama()
{
  const { colors, space, radius } = useTheme()
  const { isDesktop } = useWorkspace()
  const router = useRouter()
  const finance = useDataStore((s) => s.finance) ?? []
  const hydrateCats = useCategoryMetaStore((s) => s.hydrate)
  const catMap = useCategoryMetaStore((s) => s.map)
  const gastos = monthExpenseTotal(finance)
  const series = useMemo(() => monthDailyExpenseSeries(finance), [finance])
  const ranking = useMemo(
    () => rankCategoriesBySpend(finance, colorMapFromMeta(catMap)).slice(0, 5),
    [finance, catMap],
  )

  useEffect(() =>
  {
    void hydrateCats()
  }, [hydrateCats])
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

      <Card tone="elevated" style={{ gap: space.xs, borderRadius: 14, padding: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text variant="caption" muted>
            Evolução de gastos
          </Text>
          <Text variant="bodyStrong" color={colors.finance}>
            {formatBRL(gastos)}
          </Text>
        </View>
        <ExpenseSparkline series={series} height={56} color={colors.finance} />
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
            gap: space.xs,
            borderRadius: 14,
            minHeight: 180,
            padding: 10,
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
              size={isDesktop ? 148 : 132}
              strokeWidth={14}
            />
          )}
        </Card>

        <Card tone="elevated" style={{ flex: isDesktop ? 1 : undefined, gap: space.sm, borderRadius: 14, padding: 10 }}>
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
