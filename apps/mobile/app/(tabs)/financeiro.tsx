import { useState } from 'react'
import { View } from 'react-native'
import { formatBRL, monthExpenseTotal, monthIncomeTotal } from '@simply-life/shared'
import { Screen, PillTabs } from '../../src/ui'
import { useDataStore } from '../../src/store/dataStore'
import { useAuthStore } from '../../src/store/authStore'
import { ScreenIntro } from '../../src/components/dashboard/ScreenIntro'
import { MetricCards } from '../../src/components/dashboard/MetricCards'
import { TabShell } from '../../src/components/dashboard/TabShell'
import { useTheme } from '../../src/theme/ThemeProvider'
import { FinanceHomeTab } from '../../src/components/finance/FinanceHomeTab'
import { FinanceMovimentosTab } from '../../src/components/finance/FinanceMovimentosTab'
import { FinanceContasTab } from '../../src/components/finance/FinanceContasTab'
import { FinanceAnaliseTab } from '../../src/components/finance/FinanceAnaliseTab'
import {
  FINANCE_MAIN_TABS,
  type FinanceMainTab,
  type MovimentosSubTab,
  type ContasSubTab,
  type AnaliseSubTab,
} from '../../src/components/finance/financeNav'

export default function FinanceiroScreen()
{
  const { colors } = useTheme()
  const [tab, setTab] = useState<FinanceMainTab>('inicio')
  const [movSub, setMovSub] = useState<MovimentosSubTab>('diario')
  const [contasSub, setContasSub] = useState<ContasSubTab>('conta')
  const [analiseSub, setAnaliseSub] = useState<AnaliseSubTab>('visao-geral')
  const txs = useDataStore((s) => s.finance)
  const loading = useDataStore((s) => s.loading)
  const refreshAll = useDataStore((s) => s.refreshAll)
  const isGuest = useAuthStore((s) => s.isGuest)

  const despesas = monthExpenseTotal(txs)
  const receitas = monthIncomeTotal(txs)
  const saldo = receitas - despesas
  const movCount = txs.filter((t) => t.tipo === 'despesa' || t.tipo === 'receita').length

  return (
    <Screen
      scroll
      refreshing={loading}
      onRefresh={() => void refreshAll({ isGuest })}
    >
      <TabShell>
        <ScreenIntro title="Finanças" subtitle="Início, movimentos, contas e análise." />

        <MetricCards
          items={[
            {
              label: 'Gastos do mês',
              value: formatBRL(despesas),
              color: colors.finance,
            },
            {
              label: 'Saldo',
              value: formatBRL(saldo),
              color: saldo >= 0 ? colors.health : colors.finance,
              hint: `Receitas ${formatBRL(receitas)}`,
            },
          ]}
        />

        <PillTabs
          tabs={FINANCE_MAIN_TABS.map((t) => ({
            ...t,
            count: t.id === 'movimentos' ? movCount : undefined,
          }))}
          value={tab}
          onChange={setTab}
        />

        <View>
          {tab === 'inicio' && (
            <FinanceHomeTab
              onGoMovimentos={() => setTab('movimentos')}
              onGoCartoes={() =>
              {
                setTab('contas')
                setContasSub('cartoes')
              }}
            />
          )}
          {tab === 'movimentos' && (
            <FinanceMovimentosTab subTab={movSub} onSubTabChange={setMovSub} />
          )}
          {tab === 'contas' && (
            <FinanceContasTab subTab={contasSub} onSubTabChange={setContasSub} />
          )}
          {tab === 'analise' && (
            <FinanceAnaliseTab subTab={analiseSub} onSubTabChange={setAnaliseSub} />
          )}
        </View>
      </TabShell>
    </Screen>
  )
}
