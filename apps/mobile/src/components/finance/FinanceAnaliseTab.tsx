import { useEffect } from 'react'
import { View } from 'react-native'
import { formatBRL } from '@simply-life/shared'
import {
  Card,
  Text,
  SectionHeader,
  EmptyState,
  SubNavTabs,
} from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { useCategoryMetaStore } from '../../store/categoryMetaStore'
import { FinanceGoalWizard } from './FinanceGoalWizard'
import { FinanceCoachCards } from './FinanceCoachCards'
import { FinancePlanningPanel } from './FinancePlanningPanel'
import { FinanceMonthReport } from './FinanceMonthReport'
import { ANALISE_SUB_TABS, type AnaliseSubTab } from './financeNav'

type Props = {
  subTab: AnaliseSubTab
  onSubTabChange: (tab: AnaliseSubTab) => void
}

export function FinanceAnaliseTab({ subTab, onSubTabChange }: Props)
{
  const { colors, space, radius } = useTheme()
  const goals = useDataStore((s) => s.financeGoals)
  const hydrateCats = useCategoryMetaStore((s) => s.hydrate)

  useEffect(() =>
  {
    void hydrateCats()
  }, [hydrateCats])

  return (
    <View style={{ gap: space.md }}>
      <SubNavTabs
        tabs={ANALISE_SUB_TABS}
        value={subTab}
        onChange={onSubTabChange}
        accent="finance"
      />

      {subTab === 'visao-geral' && <FinanceMonthReport />}

      {subTab === 'orcamentos' && <FinancePlanningPanel />}

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
