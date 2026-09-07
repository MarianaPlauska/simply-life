import { useCallback, useState } from 'react'
import { View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { formatBRL, cashExpenseTotal, monthIncomeTotal } from '@simply-life/shared'
import { Screen, SubNavTabs } from '../../src/ui'
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
import { useFinanceFocusStore } from '../../src/store/financeFocusStore'

export default function FinanceiroScreen()
{
  const { colors } = useTheme()
  const [tab, setTab] = useState<FinanceMainTab>('inicio')
  const [cardsFocus, setCardsFocus] = useState(false)
  const [movSub, setMovSub] = useState<MovimentosSubTab>('diario')
  const [contasSub, setContasSub] = useState<ContasSubTab>('conta')
  const [analiseSub, setAnaliseSub] = useState<AnaliseSubTab>('visao-geral')
  const txs = useDataStore((s) => s.finance)
  const loading = useDataStore((s) => s.loading)
  const refreshAll = useDataStore((s) => s.refreshAll)
  const isGuest = useAuthStore((s) => s.isGuest)

  useFocusEffect(
    useCallback(() =>
    {
      const hit = useFinanceFocusStore.getState().consume()
      if (!hit) return
      setCardsFocus(false)
      setTab(hit.tab)
      setContasSub(hit.contasSub)
    }, []),
  )

  const despesas = cashExpenseTotal(txs)
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
        {!(tab === 'inicio' && cardsFocus) && (
          <ScreenIntro title="Carteira" subtitle="Saldo, cartões, extrato e relatórios." />
        )}

        {/* Na Início o saldo tipográfico vive no FinanceHomeTab — KPIs só nas outras abas. */}
        {tab !== 'inicio' && (
          <MetricCards
            items={[
              {
                label: 'Saiu da conta',
                value: formatBRL(despesas),
                color: colors.finance,
              },
              {
                label: 'Saldo do mês',
                value: formatBRL(saldo),
                color: saldo >= 0 ? colors.health : colors.finance,
                hint: `Entradas ${formatBRL(receitas)}`,
              },
            ]}
          />
        )}

        {!(tab === 'inicio' && cardsFocus) && (
          <SubNavTabs
            accent="finance"
            tabs={FINANCE_MAIN_TABS.map((t) => ({
              ...t,
              count: t.id === 'movimentos' ? movCount : undefined,
            }))}
            value={tab}
            onChange={(next) =>
            {
              setCardsFocus(false)
              setTab(next)
            }}
          />
        )}

        <View>
          {tab === 'inicio' && (
            <FinanceHomeTab
              cardsFocus={cardsFocus}
              onCardsFocusChange={setCardsFocus}
              onGoMovimentos={() =>
              {
                setCardsFocus(false)
                setTab('movimentos')
              }}
              onGoCartoes={() =>
              {
                setCardsFocus(false)
                setTab('contas')
                setContasSub('cartoes')
              }}
              onGoAnalise={() =>
              {
                setCardsFocus(false)
                setTab('analise')
              }}
            />
          )}
          {tab === 'movimentos' && (
            <FinanceMovimentosTab subTab={movSub} onSubTabChange={setMovSub} />
          )}
          {tab === 'contas' && (
            <FinanceContasTab
              subTab={contasSub}
              onSubTabChange={setContasSub}
              onGoMovimentos={() => setTab('movimentos')}
            />
          )}
          {tab === 'analise' && (
            <FinanceAnaliseTab subTab={analiseSub} onSubTabChange={setAnaliseSub} />
          )}
        </View>
      </TabShell>
    </Screen>
  )
}
