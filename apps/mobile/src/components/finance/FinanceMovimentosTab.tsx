import { useMemo } from 'react'
import { View } from 'react-native'
import { formatBRL } from '@simply-life/shared'
import {
  Card,
  SectionHeader,
  ListRow,
  PrimaryButton,
  EmptyState,
  SubNavTabs,
} from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useCaptureStore } from '../../store/captureStore'
import { useDataStore } from '../../store/dataStore'
import { FinanceSpreadsheetPane } from './FinanceSpreadsheetPane'
import { FinanceCsvPanel } from './FinanceCsvPanel'
import { FinanceFoldersPane } from './FinanceFoldersPane'
import { MOVIMENTOS_SUB_TABS, type MovimentosSubTab } from './financeNav'
import { financeTxSubtitle } from '../../lib/financeTxLabel'

type Props = {
  subTab: MovimentosSubTab
  onSubTabChange: (tab: MovimentosSubTab) => void
}

export function FinanceMovimentosTab({ subTab, onSubTabChange }: Props)
{
  const { space } = useTheme()
  const openCapture = useCaptureStore((s) => s.openCapture)
  const txs = useDataStore((s) => s.finance)
  const rows = useMemo(() => txs.filter((t) => t.tipo === 'despesa' || t.tipo === 'receita'), [txs])

  return (
    <View style={{ gap: space.md }}>
      <SubNavTabs
        tabs={MOVIMENTOS_SUB_TABS.map((t) => ({ ...t, count: t.id === 'diario' ? rows.length : undefined }))}
        value={subTab}
        onChange={onSubTabChange}
        accent="finance"
      />

      <SectionHeader
        title={
          subTab === 'diario'
            ? 'Diário'
            : subTab === 'planilha'
              ? 'Planilha'
              : subTab === 'pastas'
                ? 'Pastas de gastos'
                : 'Lista'
        }
        action={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <PrimaryButton
              label="Receita"
              variant="link"
              size="sm"
              onPress={() => openCapture('expense', null, { studio: true, lancamento: 'receita' })}
            />
            <PrimaryButton
              label="Gasto"
              variant="link"
              size="sm"
              onPress={() => openCapture('expense', null, { studio: true })}
            />
          </View>
        }
      />

      {subTab === 'pastas' ? (
        <FinanceFoldersPane />
      ) : subTab === 'planilha' ? (
        <>
          <FinanceSpreadsheetPane />
          <FinanceCsvPanel />
        </>
      ) : (
      <Card tone="elevated" style={{ paddingVertical: space.sm }}>
        {rows.length === 0 ? (
          <EmptyState
            title="Nenhum lançamento"
            body="Ex.: café 12,50 na conta, compra no crédito ou salário 4500."
          />
        ) : subTab === 'diario' ? (
          rows.map((t, i, arr) => (
            <ListRow
              key={t.id}
              title={t.titulo}
              subtitle={financeTxSubtitle(t)}
              right={formatBRL(t.valor)}
              showSeparator={i < arr.length - 1}
            />
          ))
        ) : (
          rows.map((t, i, arr) => (
            <ListRow
              key={t.id}
              title={t.titulo}
              subtitle={financeTxSubtitle(t)}
              right={`${t.tipo === 'receita' ? '+' : '−'}${formatBRL(t.valor)}`}
              showSeparator={i < arr.length - 1}
            />
          ))
        )}
      </Card>
      )}
    </View>
  )
}
