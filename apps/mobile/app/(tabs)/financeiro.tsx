import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { formatBRL, cashExpenseTotal, creditExpenseTotal, monthIncomeTotal } from '@simply-life/shared'
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
import { useWebDesk } from '../../src/components/dashboard/web/webBox'
import { WebStatRow } from '../../src/components/dashboard/web/WebStatRow'
import { useSectionState, usePublishSectionTabs } from '../../src/store/sectionNavStore'

export default function FinanceiroScreen()
{
  const { colors } = useTheme()
  const desk = useWebDesk()
  const [tab, setTab] = useSectionState<FinanceMainTab>('financeiro', 'inicio')
  const [cardsFocus, setCardsFocus] = useState(false)
  const [movSub, setMovSub] = useState<MovimentosSubTab>('diario')
  const [contasSub, setContasSub] = useSectionState<ContasSubTab>('financeiroContas', 'conta')
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
  const tabsWithCount = mainTabs.map((t) => ({
    ...t,
    count: t.id === 'movimentos' ? movCount : undefined,
  }))
  // computador: as abas principais ficam na barra lateral, como subitens de Finanças
  usePublishSectionTabs('financeiro', tabsWithCount)

  // trocar de aba pela barra lateral sai do foco nos cartões
  useEffect(() =>
  {
    setCardsFocus(false)
  }, [tab])

  return (
    <Screen
      wide
      scroll
      refreshing={loading}
      onRefresh={() => void refreshAll({ isGuest })}
    >
      <TabShell>
        {!(tab === 'inicio' && cardsFocus) && (
          // computador: o título repete o nome da barra lateral; "Carteira" fica só na sub aba
          <ScreenIntro title={desk ? 'Finanças' : 'Carteira'} subtitle="Saldo, cartões, extrato e relatórios." />
        )}

        {!desk && !(tab === 'inicio' && cardsFocus) && (
          <SubNavTabs
            accent="finance"
            tabs={tabsWithCount}
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
              summary={desk ? (
                // computador: números soltos numa linha, como no Início
                <WebStatRow
                  items={[
                    { id: 'out', label: 'Saiu da conta', value: formatBRL(despesas), icon: 'arrow-up', color: colors.ink },
                    { id: 'in', label: 'Entradas', value: formatBRL(receitas), icon: 'download-outline', color: colors.health },
                    {
                      id: 'net',
                      label: 'Saldo do mês',
                      value: formatBRL(saldo),
                      icon: 'wallet-outline',
                      color: saldo >= 0 ? colors.health : colors.danger,
                    },
                    { id: 'card', label: 'No cartão', value: formatBRL(creditExpenseTotal(txs)), icon: 'card-outline', color: colors.ink },
                    { id: 'count', label: 'Lançamentos', value: String(movCount), icon: 'list', color: colors.ink },
                  ]}
                />
              ) : (
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
