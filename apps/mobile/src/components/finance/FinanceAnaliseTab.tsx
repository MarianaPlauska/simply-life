import { useMemo } from 'react'
import { View } from 'react-native'
import {
  formatBRL,
  monthExpenseTotal,
  monthIncomeTotal,
  monthDailyExpenseSeries,
  rankCategoriesBySpend,
} from '@simply-life/shared'
import {
  Card,
  Text,
  SectionHeader,
  EmptyState,
  SubNavTabs,
  FinanceDonut,
} from '../../ui'
import { ExpenseSparkline } from '../../ui/ExpenseSparkline'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { useWorkspace } from '../../layout/useWorkspace'
import { FinanceGoalWizard } from './FinanceGoalWizard'
import { FinanceCoachCards } from './FinanceCoachCards'
import { ANALISE_SUB_TABS, type AnaliseSubTab } from './financeNav'

type Props = {
  subTab: AnaliseSubTab
  onSubTabChange: (tab: AnaliseSubTab) => void
}

export function FinanceAnaliseTab({ subTab, onSubTabChange }: Props)
{
  const { colors, space, radius } = useTheme()
  const { isDesktop } = useWorkspace()
  const txs = useDataStore((s) => s.finance)
  const goals = useDataStore((s) => s.financeGoals)
  const receitas = monthIncomeTotal(txs)
  const despesas = monthExpenseTotal(txs)
  const saldo = receitas - despesas
  const series = useMemo(() => monthDailyExpenseSeries(txs), [txs])
  const ranking = useMemo(() => rankCategoriesBySpend(txs), [txs])
  const max = ranking[0]?.total ?? 1
  const donutSegments = ranking.map((r) => ({
    color: r.color,
    value: r.total,
    label: r.label,
  }))
  const pctReceita = receitas > 0 ? Math.round((despesas / receitas) * 100) : 0

  return (
    <View style={{ gap: space.lg }}>
      <SubNavTabs
        tabs={ANALISE_SUB_TABS}
        value={subTab}
        onChange={onSubTabChange}
        accent="finance"
      />

      {subTab === 'visao-geral' && (
        <View style={{ gap: space.lg }}>
          <Card tone="elevated" style={{ gap: space.md }}>
            <SectionHeader title="Visão do mês" subtitle="Receitas, gastos e saldo" />
            <View style={{ flexDirection: 'row', gap: space.md }}>
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
                  Gastos
                </Text>
                <Text variant="bodyStrong" color={colors.finance}>
                  {formatBRL(despesas)}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 4, alignItems: 'flex-end' }}>
                <Text variant="caption" muted>
                  Saldo
                </Text>
                <Text variant="bodyStrong" color={saldo >= 0 ? colors.health : colors.finance}>
                  {formatBRL(saldo)}
                </Text>
              </View>
            </View>
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
                ? `${pctReceita}% da receita usada em gastos`
                : 'Sem receitas no mês'}
            </Text>
          </Card>

          <Card tone="elevated" style={{ gap: space.sm }}>
            <SectionHeader title="Evolução de gastos" subtitle="Dia a dia no mês" />
            <ExpenseSparkline series={series} height={88} color={colors.finance} />
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
                  centerValue={formatBRL(despesas)}
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
      )}

      {subTab === 'metas' && (
        <Card tone="elevated" style={{ gap: space.md }}>
          <SectionHeader title="Metas financeiras" />
          {goals.length === 0 ? (
            <EmptyState title="Sem metas" body="Crie uma meta no wizard abaixo." />
          ) : (
            goals.map((goal) =>
            {
              const pct = goal.meta > 0 ? Math.min(100, Math.round((goal.atual / goal.meta) * 100)) : 0
              return (
                <View key={goal.id} style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text variant="bodyStrong">{goal.titulo}</Text>
                    <Text variant="caption" muted>
                      {formatBRL(goal.atual)} / {formatBRL(goal.meta)}
                    </Text>
                  </View>
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
                        width: `${pct}%`,
                        height: '100%',
                        backgroundColor: colors.finance,
                      }}
                    />
                  </View>
                </View>
              )
            })
          )}
        </Card>
      )}

      {subTab === 'metas' ? <FinanceGoalWizard /> : null}

      {subTab === 'coach' && <FinanceCoachCards />}
    </View>
  )
}
