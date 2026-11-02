import { useMemo, useState } from 'react'
import { View } from 'react-native'
import { Icon } from '../../ui/Icon'
import {
  formatBRL,
  currentMonthLabel,
} from '@simply-life/shared'
import {
  Card,
  Text,
  SectionHeader,
  PrimaryButton,
  EmptyState,
  ListRow,
  PressableScale,
} from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useWorkspace } from '../../layout/useWorkspace'
import { useCaptureStore } from '../../store/captureStore'
import { useDataStore } from '../../store/dataStore'
import { tabBarScreenPadding } from '../../ui/chrome'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { financeTxSubtitle } from '../../lib/financeTxLabel'
import { CardCarousel } from './CardCarousel'
import { FinanceCardDetailSheet } from './FinanceCardDetailSheet'
import { CardInvoiceSpendSheet } from './CardInvoiceSpendSheet'
import { FinanceCardEditSheet } from './FinanceCardEditSheet'
import { FinanceCardLedgerSheet } from './FinanceCardLedgerSheet'
import { FinanceTxEditSheet } from './FinanceTxEditSheet'
import { MonthProjectionCard, SalaryConfirmCard } from './FinanceForecastCards'
import { FinanceBalancePanel } from './FinanceBalancePanel'
import { Panel } from '../../ui/Panel'
import { useWebDesk } from '../dashboard/web/webBox'
import { useFinanceDeskGrid } from './desk/deskLayout'
import { DeskPanelHeader } from './desk/DeskPanelHeader'
import { FinanceTxTable } from './desk/FinanceTxTable'
type Props = {
  onGoMovimentos: () => void
  onGoCartoes?: () => void
  onGoAnalise?: () => void
  cardsFocus: boolean
  onCardsFocusChange: (focus: boolean) => void
}

/**
 * Início = layout valores (ref. 3) + destaques (ref. 2).
 * Cartões = só ao tocar em “Cartões” (ref. 1 no detalhe).
 */
export function FinanceHomeTab({
  onGoMovimentos,
  onGoCartoes,
  onGoAnalise,
  cardsFocus,
  onCardsFocusChange,
}: Props)
{
  const { colors, space, elevation } = useTheme()
  const { showRail, isDesktop } = useWorkspace()
  const desk = useWebDesk()
  const deskGrid = useFinanceDeskGrid()
  const insets = useSafeAreaInsets()
  const [detailId, setDetailId] = useState<string | null>(null)
  const [visibleCardId, setVisibleCardId] = useState<string | null>(null)
  const [sheetMode, setSheetMode] = useState<'invoice' | 'spend' | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [ledgerOpen, setLedgerOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<string | null>(null)
  const openCapture = useCaptureStore((s) => s.openCapture)
  const txs = useDataStore((s) => s.finance)
  const cards = useDataStore((s) => s.financeCards)
  const fabClearance = showRail ? space.md : tabBarScreenPadding(insets.bottom) + space.md
  const primaryCard = cards.find((c) => c.id === visibleCardId) ?? cards[0]
  const detailCard = cards.find((c) => c.id === detailId) ?? null

  const recent = useMemo(
    () => [...txs].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 3),
    [txs],
  )
  const openEditPrimary = () =>
  {
    if (!primaryCard)
    {
      setCreateOpen(true)
      return
    }
    setVisibleCardId(primaryCard.id)
    setEditOpen(true)
  }

  const sheets = (
    <>
      <FinanceCardDetailSheet
        card={detailCard}
        visible={detailId != null}
        onClose={() => setDetailId(null)}
        onEdit={() =>
        {
          setDetailId(null)
          setEditOpen(true)
        }}
        onSpend={() =>
        {
          setDetailId(null)
          setSheetMode('spend')
        }}
        onLedger={() =>
        {
          setDetailId(null)
          setLedgerOpen(true)
        }}
      />
      <CardInvoiceSpendSheet
        card={primaryCard ?? null}
        mode={sheetMode}
        onClose={() => setSheetMode(null)}
      />
      <FinanceCardEditSheet
        card={primaryCard ?? null}
        mode="edit"
        visible={editOpen}
        onClose={() => setEditOpen(false)}
      />
      <FinanceCardEditSheet
        card={null}
        mode="create"
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) =>
        {
          setVisibleCardId(id)
          setDetailId(id)
        }}
      />
      <FinanceCardLedgerSheet
        card={primaryCard ?? null}
        visible={ledgerOpen}
        onClose={() => setLedgerOpen(false)}
        onSpend={() => setSheetMode('spend')}
      />
    </>
  )

  // ── Só aparece ao tocar em “Cartões” ─────────────────────
  if (cardsFocus)
  {
    return (
      <View style={{ gap: space.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <PrimaryButton
            label="Voltar"
            variant="ghost"
            size="sm"
            icon="chevron-back"
            onPress={() => onCardsFocusChange(false)}
          />
          <Text variant="section">Cartões</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <PressableScale
              accessibilityLabel="Personalizar cartão"
              onPress={openEditPrimary}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.elevated,
              }}
            >
              <Icon name="settings-outline" size={20} color={colors.ink} />
            </PressableScale>
            <PressableScale
              accessibilityLabel="Novo cartão"
              onPress={() => setCreateOpen(true)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.elevated,
              }}
            >
              <Icon name="add" size={22} color={colors.ink} />
            </PressableScale>
          </View>
        </View>

        {cards.length === 0 ? (
          <Card tone="elevated" style={{ gap: space.md }}>
            <EmptyState title="Nenhum cartão" body="Crie um cartão e personalize o visual." />
            <PrimaryButton label="Novo cartão" icon="card-outline" onPress={() => setCreateOpen(true)} />
          </Card>
        ) : (
          <>
            <CardCarousel
              cards={cards}
              selectedId={visibleCardId}
              onSelect={(id) =>
              {
                setVisibleCardId(id)
                setDetailId(id)
              }}
              onVisibleChange={setVisibleCardId}
            />
            <Text variant="caption" muted style={{ textAlign: 'center' }}>
              Toque no cartão para ver os detalhes.
            </Text>
            {onGoCartoes ? (
              <PrimaryButton
                label="Gerenciar em Contas"
                variant="link"
                size="sm"
                onPress={() =>
                {
                  onCardsFocusChange(false)
                  onGoCartoes()
                }}
              />
            ) : null}
          </>
        )}
        {sheets}
        <View style={{ marginBottom: fabClearance }} />
      </View>
    )
  }

  // blocos da Carteira: no celular um embaixo do outro; no computador em duas colunas
  const blocoSaldo = (
    <View
      style={{
        borderRadius: 16,
        padding: 16,
        gap: 16,
        backgroundColor: colors.elevated,
        alignSelf: 'stretch',
        width: '100%',
        maxWidth: isDesktop ? 520 : undefined,
        ...elevation.card,
      }}
    >
      <View style={{ gap: 1 }}>
        <Text variant="section" style={{ fontSize: 16 }}>
          Saldo da conta
        </Text>
        <Text variant="caption" muted style={{ fontSize: 12 }}>
          {currentMonthLabel()}
        </Text>
      </View>

      {/* saldo da conta separado: a área de cartões mostra só cartões de crédito */}
      <FinanceBalancePanel />

      <Text variant="caption" muted>
        Este número é o dinheiro da conta. Compra no cartão só entra aqui quando a fatura é paga.
      </Text>
      <View style={{ gap: 8, alignSelf: 'stretch' }}>
        <PrimaryButton
          label="Anotar gasto"
          icon="swap-vertical-outline"
          onPress={() => openCapture('expense', null, { studio: true })}
          style={{ alignSelf: 'stretch', minHeight: 48 }}
        />
        <PrimaryButton
          label="Anotar entrada"
          variant="secondary"
          icon="download-outline"
          onPress={() => openCapture('expense', null, { studio: true, lancamento: 'receita' })}
          style={{ alignSelf: 'stretch', minHeight: 48 }}
        />
      </View>
    </View>
  )
  const blocoTransacoes = (
    <>
      {/* Orçamentos saiu daqui: repetia as 2 primeiras categorias com meta estimada. Os reais ficam em Análise. */}
      {/* Transações compactas */}
      <View style={{ gap: space.sm }}>
        <SectionHeader
          title="Últimos lançamentos"
          action={
            <PrimaryButton label="Ver extrato" variant="link" size="sm" onPress={onGoMovimentos} />
          }
        />
        <Card tone="elevated" style={{ paddingVertical: 4, paddingHorizontal: 4 }}>
          {recent.length === 0 ? (
            <EmptyState icon="wallet" title="Nada por aqui" body="Seu próximo gasto aparece nesta lista." />
          ) : (
            recent.map((t, i) => (
              <ListRow
                key={t.id}
                title={t.titulo}
                subtitle={financeTxSubtitle(t)}
                right={`${t.tipo === 'despesa' ? '-' : '+'}${formatBRL(t.valor)}`}
                onPress={() => setEditingTx(t.id)}
                showSeparator={i < recent.length - 1}
              />
            ))
          )}
        </Card>
      </View>
    </>
  )

  // computador: painel de finanças de verdade (grade alinhada, ações em barra, extrato em tabela)
  if (desk)
  {
    const recentDesk = [...txs].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 8)
    return (
      <View style={{ gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <Text variant="caption" muted>
            Resumo de {currentMonthLabel()}. Cartões e categorias abrem nas abas deles.
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <PrimaryButton
              label="Novo gasto"
              size="sm"
              icon="add"
              onPress={() => openCapture('expense', null, { studio: true })}
              style={{ minWidth: 0 }}
            />
            <PrimaryButton
              label="Nova receita"
              size="sm"
              variant="ghost"
              icon="download-outline"
              onPress={() => openCapture('expense', null, { studio: true, lancamento: 'receita' })}
              style={{ minWidth: 0 }}
            />
            <PrimaryButton
              label="Cartões"
              size="sm"
              variant="ghost"
              icon="card-outline"
              onPress={() => (onGoCartoes ? onGoCartoes() : onCardsFocusChange(true))}
              style={{ minWidth: 0 }}
            />
            <PrimaryButton
              label="Análise"
              size="sm"
              variant="ghost"
              icon="analytics"
              onPress={() => (onGoAnalise ? onGoAnalise() : onGoMovimentos())}
              style={{ minWidth: 0 }}
            />
          </View>
        </View>

        {/* aviso que só aparece no dia do salário: largura toda, acima da grade */}
        <SalaryConfirmCard />

        <View style={deskGrid.grid}>
          <Panel>
            <FinanceBalancePanel />
          </Panel>
          <Panel>
            <MonthProjectionCard />
          </Panel>
          <Panel style={deskGrid.span2}>
            <View>
              <DeskPanelHeader title="Últimos lançamentos" actionLabel="Ver extrato" onAction={onGoMovimentos} />
              {recentDesk.length === 0 ? (
                <EmptyState icon="wallet" title="Nada por aqui" body="Seu próximo gasto aparece nesta lista." />
              ) : (
                <FinanceTxTable rows={recentDesk} onPress={setEditingTx} />
              )}
            </View>
          </Panel>
        </View>
        {sheets}
        <FinanceTxEditSheet txId={editingTx} onClose={() => setEditingTx(null)} />
      </View>
    )
  }

  return (
    <View style={{ gap: space.md, width: '100%', alignSelf: 'stretch' }}>
      <View style={{ gap: space.md, width: '100%', maxWidth: isDesktop ? 560 : undefined }}>
        {blocoSaldo}
        <SalaryConfirmCard />
        {blocoTransacoes}
      </View>
      {sheets}
      <FinanceTxEditSheet txId={editingTx} onClose={() => setEditingTx(null)} />
      {isDesktop ? null : <View style={{ marginBottom: fabClearance }} />}
    </View>
  )
}
