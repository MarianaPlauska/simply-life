import { useMemo, useState } from 'react'
import { ScrollView, View } from 'react-native'
import {
  cashExpenseTotal,
  creditExpenseTotal,
  formatBRL,
  monthDailyExpenseSeries,
  monthDailyIncomeSeries,
  monthDateFromOffset,
  monthExpenseTotal,
  monthIncomeTotal,
  rankCategoriesBySpend,
  txsInCalendarMonth,
} from '@simply-life/shared'
import {
  Card,
  Chip,
  EmptyState,
  FinanceDonut,
  SectionHeader,
  Text,
} from '../../ui'
import { ExpenseSparkline } from '../../ui/ExpenseSparkline'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { useCategoryMetaStore } from '../../store/categoryMetaStore'
import { colorMapFromMeta } from '../../lib/categoryMeta'
import { useWorkspace } from '../../layout/useWorkspace'

const MONTH_OFFSETS = [0, 1, 2, 3, 4, 5]

function monthChipLabel(offset: number): string
{
  const d = monthDateFromOffset(offset)
  const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
  return label.replace('.', '')
}

/** Relatório mensal: receita, caixa, crédito e categorias. */
export function FinanceMonthReport()
{
  const { colors, space, radius } = useTheme()
  const { isDesktop } = useWorkspace()
  const txs = useDataStore((s) => s.finance)
  const catMap = useCategoryMetaStore((s) => s.map)
  const [offset, setOffset] = useState(0)
  const ref = useMemo(() => monthDateFromOffset(offset), [offset])
  const monthTxs = useMemo(() => txsInCalendarMonth(txs, ref), [txs, ref])
  const receitas = monthIncomeTotal(monthTxs)
  const gastos = monthExpenseTotal(monthTxs)
  const naConta = cashExpenseTotal(monthTxs)
  const noCartao = creditExpenseTotal(monthTxs)
  const saldoMes = receitas - naConta
  const series = useMemo(() => monthDailyExpenseSeries(monthTxs, ref), [monthTxs, ref])
  const incomeSeries = useMemo(() => monthDailyIncomeSeries(monthTxs, ref), [monthTxs, ref])
  const ranking = useMemo(
    () => rankCategoriesBySpend(monthTxs, colorMapFromMeta(catMap)),
    [monthTxs, catMap],
  )
  const max = ranking[0]?.total ?? 1
  const donutSegments = ranking.map((r) => ({
    color: r.color,
    value: r.total,
    label: r.label,
  }))
  const pctReceita = receitas > 0 ? Math.round((naConta / receitas) * 100) : 0
  const monthTitle = ref.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <View style={{ gap: space.md }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {MONTH_OFFSETS.map((n) => (
            <Chip
              key={n}
              label={n === 0 ? 'Este mês' : monthChipLabel(n)}
              active={offset === n}
              onPress={() => setOffset(n)}
            />
          ))}
        </View>
      </ScrollView>

      <Card tone="elevated" style={{ gap: space.sm }}>
        <SectionHeader title="Relatório do mês" subtitle={monthTitle} />
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="caption" muted>
              Receitas
            </Text>
            <Text variant="bodyStrong" color={colors.health}>
              {formatBRL(receitas)}
            </Text>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="caption" muted>
              Saiu do saldo
            </Text>
            <Text variant="bodyStrong" color={colors.finance}>
              {formatBRL(naConta)}
            </Text>
          </View>
          <View style={{ flex: 1, gap: 4, alignItems: 'flex-end' }}>
            <Text variant="caption" muted>
              No cartão
            </Text>
            <Text variant="bodyStrong">
              {formatBRL(noCartao)}
            </Text>
          </View>
        </View>
        <Text variant="caption" muted>
          Crédito só deixa o saldo quando a fatura é paga. Gastou {formatBRL(gastos)} no total.
        </Text>
        <View
          style={{
            height: 8,
            borderRadius: radius.pill,
            backgroundColor: colors.hairline,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: receitas > 0 ? `${Math.min(100, pctReceita)}%` : '0%',
              height: '100%',
              backgroundColor: colors.finance,
            }}
          />
        </View>
        <Text variant="caption" muted>
          {receitas > 0
            ? `${pctReceita}% da receita já saiu da conta · saldo do mês ${formatBRL(saldoMes)}`
            : 'Lance uma receita para ver o ritmo do caixa'}
        </Text>
      </Card>

      <Card tone="elevated" style={{ gap: space.sm }}>
        <SectionHeader title="Receita × gastos" subtitle="Linha verde entra, cobre sai" />
        <ExpenseSparkline
          series={series}
          incomeSeries={incomeSeries}
          height={96}
          color={colors.finance}
          incomeColor={colors.health}
        />
      </Card>

      <View
        style={{
          flexDirection: isDesktop ? 'row' : 'column',
          gap: space.md,
        }}
      >
        <Card
          tone="elevated"
          style={{
            flex: 1,
            alignItems: 'center',
            gap: space.md,
            minHeight: 260,
          }}
        >
          <Text variant="caption" muted>
            Gastos por categoria
          </Text>
          {ranking.length === 0 ? (
            <EmptyState title="Sem gastos" body="Capture um gasto para ver o donut." />
          ) : (
            <FinanceDonut
              segments={donutSegments}
              centerLabel="Gasto total"
              centerValue={formatBRL(gastos)}
              size={isDesktop ? 200 : 176}
              strokeWidth={20}
            />
          )}
        </Card>

        <Card tone="elevated" style={{ flex: 1, gap: space.md }}>
          <SectionHeader title="Ranking" subtitle="Maiores categorias" />
          {ranking.length === 0 ? (
            <EmptyState title="Sem categorias" body="Os gráficos aparecem com o primeiro gasto." />
          ) : (
            ranking.map((row) => (
              <View key={row.categoria} style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        backgroundColor: row.color,
                      }}
                    />
                    <Text variant="bodyStrong">{row.label}</Text>
                  </View>
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
