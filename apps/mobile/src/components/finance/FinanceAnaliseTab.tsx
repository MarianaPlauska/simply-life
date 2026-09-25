import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { formatBRL, parseBrlNumber } from '@simply-life/shared'
import {
  Card,
  Text,
  SectionHeader,
  EmptyState,
  SubNavTabs,
  Field,
  PrimaryButton,
} from '../../ui'
import { confirmDestructive } from '../../lib/confirmDestructive'
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
  const contributeFinanceGoal = useDataStore((s) => s.contributeFinanceGoal)
  const removeFinanceGoal = useDataStore((s) => s.removeFinanceGoal)
  const [goalInput, setGoalInput] = useState<Record<number, string>>({})
  const [goalMsg, setGoalMsg] = useState<string | null>(null)
  const moveGoal = async (id: number, sign: 1 | -1) =>
  {
    const v = parseBrlNumber(goalInput[id] ?? '')
    if (v == null) return setGoalMsg('Digite um valor, ex.: 150')
    const res = await contributeFinanceGoal(id, sign * v)
    setGoalMsg(res.ok ? null : res.error ?? 'Não consegui salvar')
    if (res.ok) setGoalInput({ ...goalInput, [id]: '' })
  }
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
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
                    <View style={{ flex: 1 }}>
                      <Field
                        label="Valor"
                        placeholder="Ex.: 150"
                        keyboardType="decimal-pad"
                        value={goalInput[goal.id] ?? ''}
                        onChangeText={(v) => setGoalInput({ ...goalInput, [goal.id]: v })}
                      />
                    </View>
                    <PrimaryButton label="Guardar" size="sm" onPress={() => void moveGoal(goal.id, 1)} />
                    <PrimaryButton label="Retirar" size="sm" variant="ghost" onPress={() => void moveGoal(goal.id, -1)} />
                  </View>
                  <PrimaryButton
                    label="Apagar meta"
                    size="sm"
                    variant="link"
                    onPress={() => confirmDestructive('Apagar meta', `"${goal.titulo}" será removida.`, () => void removeFinanceGoal(goal.id))}
                  />
                </View>
              )
            })
          )}
          {goalMsg ? <Text variant="caption" color={colors.danger}>{goalMsg}</Text> : null}
        </Card>
      )}

      {subTab === 'metas' ? <FinanceGoalWizard /> : null}

      {subTab === 'coach' && <FinanceCoachCards />}
    </View>
  )
}
