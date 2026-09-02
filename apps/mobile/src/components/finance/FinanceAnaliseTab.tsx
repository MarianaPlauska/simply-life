import { View } from 'react-native'
import { formatBRL, monthExpenseTotal, monthIncomeTotal } from '@simply-life/shared'
import { Card, Text, SectionHeader, EmptyState, SubNavTabs } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { ANALISE_SUB_TABS, type AnaliseSubTab } from './financeNav'

type Props = {
  subTab: AnaliseSubTab
  onSubTabChange: (tab: AnaliseSubTab) => void
}

export function FinanceAnaliseTab({ subTab, onSubTabChange }: Props)
{
  const { colors, space, radius } = useTheme()
  const txs = useDataStore((s) => s.finance)
  const goals = useDataStore((s) => s.financeGoals)
  const receitas = monthIncomeTotal(txs)
  const despesas = monthExpenseTotal(txs)
  const saldo = receitas - despesas

  return (
    <View style={{ gap: space.lg }}>
      <SubNavTabs
        tabs={ANALISE_SUB_TABS}
        value={subTab}
        onChange={onSubTabChange}
        accent="finance"
      />

      {subTab === 'visao-geral' && (
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
                width: receitas > 0 ? `${Math.min(100, Math.round((despesas / receitas) * 100))}%` : '0%',
                height: '100%',
                backgroundColor: colors.finance,
              }}
            />
          </View>
          <Text variant="caption" muted>
            {receitas > 0
              ? `${Math.round((despesas / receitas) * 100)}% da receita usada em gastos`
              : 'Sem receitas no mês'}
          </Text>
        </Card>
      )}

      {subTab === 'metas' && (
        <Card tone="elevated" style={{ gap: space.md }}>
          <SectionHeader title="Metas financeiras" />
          {goals.length === 0 ? (
            <EmptyState title="Sem metas" body="Defina metas na web para acompanhar aqui." />
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
    </View>
  )
}
