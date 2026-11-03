import { useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Screen } from '../../src/ui'
import { StackHeader } from '../../src/components/layout/StackHeader'
import { FinanceContasTab } from '../../src/components/finance/FinanceContasTab'
import { FinanceAnaliseTab } from '../../src/components/finance/FinanceAnaliseTab'
import { FinanceFoldersPane } from '../../src/components/finance/FinanceFoldersPane'
import { FinanceSpreadsheetPane } from '../../src/components/finance/FinanceSpreadsheetPane'
import { FinanceCsvPanel } from '../../src/components/finance/FinanceCsvPanel'
import {
  ANALISE_SUB_TABS,
  CONTAS_SUB_TABS,
  type AnaliseSubTab,
  type ContasSubTab,
} from '../../src/components/finance/financeNav'
import { useSectionNavStore } from '../../src/store/sectionNavStore'

const TITLES: Record<string, string> = {
  planilha: 'Planilha',
  pastas: 'Pastas de gastos',
  'visao-geral': 'Visão do mês',
}

/** Um item de Contas, Análise ou do Extrato em tela própria (o celular não tem abas dentro de abas). */
export default function FinancaSecaoScreen()
{
  const { secao: raw } = useLocalSearchParams<{ secao: string }>()
  const router = useRouter()
  const [secao, setSecao] = useState(raw ?? 'conta')
  const contas = CONTAS_SUB_TABS.find((t) => t.id === secao)
  const analise = ANALISE_SUB_TABS.find((t) => t.id === secao)
  const title = TITLES[secao] ?? contas?.label ?? analise?.label ?? 'Finanças'

  return (
    <Screen scroll tabBarInset={false}>
      <StackHeader title={title} />
      {contas ? (
        <FinanceContasTab
          hideTabs
          subTab={secao as ContasSubTab}
          onSubTabChange={setSecao}
          onGoMovimentos={() =>
          {
            useSectionNavStore.getState().setActive('financeiro', 'movimentos')
            router.back()
          }}
        />
      ) : analise ? (
        <FinanceAnaliseTab hideTabs subTab={secao as AnaliseSubTab} onSubTabChange={setSecao} />
      ) : secao === 'pastas' ? (
        <FinanceFoldersPane />
      ) : (
        <>
          <FinanceSpreadsheetPane />
          <FinanceCsvPanel />
        </>
      )}
    </Screen>
  )
}
