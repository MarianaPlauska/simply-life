import { useCallback, useEffect, useState } from 'react'
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
  type FinanceMainTab,
  type MovimentosSubTab,
  type ContasSubTab,
  type AnaliseSubTab,
} from '../../src/components/finance/financeNav'
import { useFinanceFocusStore } from '../../src/store/financeFocusStore'
import { useModules } from '../../src/hooks/useModules'
import { visibleFinanceTabs } from '../../src/components/finance/financeNav'

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
  const modules = useModules()
  const mainTabs = visibleFinanceTabs(modules.on)
  const tabShown = mainTabs.some((t) => t.id === tab) ? tab : (mainTabs[0]?.id ?? tab)
  useEffect(() =>
  {
    if (tabShown !== tab) setTab(tabShown)
  }, [tabShown, tab])

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

  // pedido de abrir uma aba feito de dentro da própria Carteira (ex.: "Cadastrar salário")
  useEffect(() =>
    useFinanceFocusStore.subscribe((st) =>
    {
      if (!st.pending) return
      const hit = useFinanceFocusStore.getState().consume()
      if (!hit) return
      setCardsFocus(false)
      setTab(hit.tab)
      setContasSub(hit.contasSub)
    }), [])

  const despesas = cashExpenseTotal(txs)
  const receitas = monthIncomeTotal(txs)
  const saldo = receitas - despesas
  const movCount = txs.filter((t) => t.tipo === 'despesa' || t.tipo === 'receita').length

  return (
    <Screen
      wide
      scroll
      refreshing={loading}
      onRefresh={() => void refreshAll({ isGuest })}
    >
      <TabShell>
        {!(tab === 'inicio' && cardsFocus) && (
          <ScreenIntro title="Carteira" subtitle="Saldo, cartões, extrato e relatórios." />
        )}

        {!(tab === 'inicio' && cardsFocus) && (
          <SubNavTabs
            accent="finance"
            tabs={mainTabs.map((t) => ({
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
          {/* KPIs só no Extrato: Carteira, Contas e Análise já mostram entradas e saídas nos próprios cartões. */}
          {tab === 'movimentos' && (
            <FinanceMovimentosTab
              subTab={movSub}
              onSubTabChange={setMovSub}
              summary={
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
              }
            />
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
