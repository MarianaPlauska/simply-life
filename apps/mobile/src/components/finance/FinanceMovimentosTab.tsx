import { type ReactNode, useMemo, useState } from 'react'
import { TextInput, View, type TextStyle } from 'react-native'
import { formatBRL } from '@simply-life/shared'
import {
  Card,
  SectionHeader,
  ListRow,
  PrimaryButton,
  EmptyState,
  SubNavTabs,
  Text,
  Icon,
} from '../../ui'
import { Panel } from '../../ui/Panel'
import { useWebDesk } from '../dashboard/web/webBox'
import { WebHoverable } from '../dashboard/web/WebHoverable'
import { webStyle } from '../dashboard/web/webStyle'
import { FinanceTxTable } from './desk/FinanceTxTable'
import { useTheme } from '../../theme/ThemeProvider'
import { useCaptureStore } from '../../store/captureStore'
import { useDataStore } from '../../store/dataStore'
import { FinanceSpreadsheetPane } from './FinanceSpreadsheetPane'
import { FinanceCsvPanel } from './FinanceCsvPanel'
import { FinanceFoldersPane } from './FinanceFoldersPane'
import { MOVIMENTOS_SUB_TABS, type MovimentosSubTab } from './financeNav'
import { financeTxSubtitle } from '../../lib/financeTxLabel'
import { FinanceTxEditSheet } from './FinanceTxEditSheet'

type Props = {
  subTab: MovimentosSubTab
  onSubTabChange: (tab: MovimentosSubTab) => void
  /** Resumo do mês (KPIs), logo abaixo das sub-abas */
  summary?: ReactNode
}

export function FinanceMovimentosTab({ subTab, onSubTabChange, summary }: Props)
{
  const { space } = useTheme()
  const openCapture = useCaptureStore((s) => s.openCapture)
  const txs = useDataStore((s) => s.finance)
  const [editingTx, setEditingTx] = useState<string | null>(null)
  const rows = useMemo(() => txs.filter((t) => t.tipo === 'despesa' || t.tipo === 'receita'), [txs])
  const desk = useWebDesk()

  if (desk)
  {
    return (
      <FinanceMovimentosDesk
        subTab={subTab}
        onSubTabChange={onSubTabChange}
        summary={summary}
        rows={rows}
        onNewIncome={() => openCapture('expense', null, { studio: true, lancamento: 'receita' })}
        onNewExpense={() => openCapture('expense', null, { studio: true })}
      />
    )
  }

  return (
    <View style={{ gap: space.md }}>
      <SubNavTabs
        tabs={MOVIMENTOS_SUB_TABS}
        value={subTab}
        onChange={onSubTabChange}
        accent="finance"
      />

      {summary}

      <SectionHeader
        title={
          subTab === 'diario' || subTab === 'lista'
            ? 'Lançamentos'
            : subTab === 'planilha'
              ? 'Planilha'
              : subTab === 'pastas'
                ? 'Pastas de gastos'
                : 'Lista'
        }
        action={
          <View style={{ flexDirection: 'row', gap: 12 }}>
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
              right={`${t.tipo === 'receita' ? '+' : '-'}${formatBRL(t.valor)}`}
              onPress={() => setEditingTx(t.id)}
              showSeparator={i < arr.length - 1}
            />
          ))
        ) : (
          rows.map((t, i, arr) => (
            <ListRow
              key={t.id}
              title={t.titulo}
              subtitle={financeTxSubtitle(t)}
              right={`${t.tipo === 'receita' ? '+' : '-'}${formatBRL(t.valor)}`}
              onPress={() => setEditingTx(t.id)}
              showSeparator={i < arr.length - 1}
            />
          ))
        )}
      </Card>
      )}
      <FinanceTxEditSheet txId={editingTx} onClose={() => setEditingTx(null)} />
    </View>
  )
}

type Filtro = 'tudo' | 'despesa' | 'receita'

/** Extrato no computador: números do mês, barra de busca e filtro, e a tabela. */
function FinanceMovimentosDesk({
  subTab,
  onSubTabChange,
  summary,
  rows,
  onNewIncome,
  onNewExpense,
}: Props & {
  rows: ReturnType<typeof useDataStore.getState>['finance']
  onNewIncome: () => void
  onNewExpense: () => void
})
{
  const { colors } = useTheme()
  const [editingTx, setEditingTx] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('tudo')
  const [busca, setBusca] = useState('')
  const isTable = subTab === 'diario' || subTab === 'lista'

  const shown = useMemo(() =>
  {
    const q = busca.trim().toLowerCase()
    return rows.filter((t) =>
      (filtro === 'tudo' || t.tipo === filtro)
      && (!q || t.titulo.toLowerCase().includes(q)))
  }, [rows, filtro, busca])

  const filtros: { id: Filtro; label: string }[] = [
    { id: 'tudo', label: 'Tudo' },
    { id: 'despesa', label: 'Gastos' },
    { id: 'receita', label: 'Entradas' },
  ]

  return (
    <View style={{ gap: 16 }}>
      <SubNavTabs
        // "Hoje" no computador vira "Por dia": a tabela agrupa todos os dias
        tabs={MOVIMENTOS_SUB_TABS.map((t) => (t.id === 'diario' ? { ...t, label: 'Por dia' } : t))}
        value={subTab}
        onChange={onSubTabChange}
        accent="finance"
      />

      {summary}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {isTable ? (
          <>
            <View
              style={{
                flexDirection: 'row',
                padding: 3,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.hairline,
                backgroundColor: colors.elevated,
              }}
            >
              {filtros.map((f) =>
              {
                const on = f.id === filtro
                return (
                  <WebHoverable
                    key={f.id}
                    onPress={() => setFiltro(f.id)}
                    accessibilityLabel={`Mostrar ${f.label.toLowerCase()}`}
                    style={(hovered) => webStyle({
                      paddingHorizontal: 14,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: on ? colors.surface : hovered ? colors.canvas : 'transparent',
                      cursor: 'pointer',
                    })}
                  >
                    <Text variant="caption" color={on ? colors.ink : colors.inkMuted}>{f.label}</Text>
                  </WebHoverable>
                )
              })}
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                height: 40,
                width: 280,
                maxWidth: '100%',
                paddingHorizontal: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.hairline,
                backgroundColor: colors.elevated,
              }}
            >
              <Icon name="search" size={16} color={colors.inkMuted} />
              <TextInput
                value={busca}
                onChangeText={setBusca}
                placeholder="Buscar lançamento"
                placeholderTextColor={colors.inkFaint}
                accessibilityLabel="Buscar lançamento"
                style={webStyle({
                  flex: 1,
                  minWidth: 0,
                  fontSize: 15,
                  fontFamily: 'Lexend_400Regular',
                  color: colors.ink,
                  outlineStyle: 'none',
                }) as TextStyle}
              />
            </View>
          </>
        ) : null}
        <View style={{ flex: 1 }} />
        <PrimaryButton label="Nova receita" size="sm" variant="ghost" icon="download-outline" onPress={onNewIncome} style={{ minWidth: 0 }} />
        <PrimaryButton label="Novo gasto" size="sm" icon="add" onPress={onNewExpense} style={{ minWidth: 0 }} />
      </View>

      {subTab === 'pastas' ? (
        <FinanceFoldersPane />
      ) : subTab === 'planilha' ? (
        <>
          <FinanceSpreadsheetPane />
          <FinanceCsvPanel />
        </>
      ) : (
        <Panel>
          {rows.length === 0 ? (
            <EmptyState
              title="Nenhum lançamento"
              body="Ex.: café 12,50 na conta, compra no crédito ou salário 4500."
            />
          ) : shown.length === 0 ? (
            <Text variant="caption" muted>Nada encontrado com esse filtro.</Text>
          ) : (
            <FinanceTxTable rows={shown} onPress={setEditingTx} groupByDay={subTab === 'diario'} />
          )}
        </Panel>
      )}
      <FinanceTxEditSheet txId={editingTx} onClose={() => setEditingTx(null)} />
    </View>
  )
}
