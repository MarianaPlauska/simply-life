import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { formatBRL, cardFaturaAbertaDisplay, type FinanceCard } from '@simply-life/shared'
import {
  Card,
  Text,
  ListRow,
  EmptyState,
  PressableScale,
  SectionHeader,
  PrimaryButton,
} from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { useAuthStore } from '../../store/authStore'
import { CardCarousel } from './CardCarousel'
import { FinanceCardDetailSheet } from './FinanceCardDetailSheet'
import { CardInvoiceSpendSheet } from './CardInvoiceSpendSheet'
import { FinanceCardEditSheet } from './FinanceCardEditSheet'
import { FinanceCardLedgerSheet } from './FinanceCardLedgerSheet'

type Props = {
  cards: FinanceCard[]
  onExtrato: () => void
  onFaturas: () => void
  onMais?: () => void
}

const ACTIONS = [
  { id: 'gasto', label: 'Gasto', icon: 'arrow-up-outline' as const },
  { id: 'lancamentos', label: 'Lançam.', icon: 'list-outline' as const },
  { id: 'editar', label: 'Editar', icon: 'create-outline' as const },
  { id: 'fatura', label: 'Fatura', icon: 'receipt-outline' as const },
]

/**
 * Aba Cartões - carousel, CRUD local, lançamentos e gasto.
 */
export function FinanceCardsHub({
  cards,
}: Props)
{
  const { colors, space, radius } = useTheme()
  const txs = useDataStore((s) => s.finance)
  const payCardInvoice = useDataStore((s) => s.payCardInvoice)
  const isGuest = useAuthStore((s) => s.isGuest)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [visibleId, setVisibleId] = useState<string | null>(cards[0]?.id ?? null)
  const [sheetMode, setSheetMode] = useState<'invoice' | 'spend' | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [ledgerOpen, setLedgerOpen] = useState(false)
  const primary = cards.find((c) => c.id === visibleId) ?? cards[0]
  const detailCard = cards.find((c) => c.id === detailId) ?? null
  const sheetCard = primary
  const faturaPrimary = primary ? cardFaturaAbertaDisplay(primary, txs) : 0
  const usadoPct =
    primary && primary.limite > 0
      ? Math.min(100, Math.round((faturaPrimary / primary.limite) * 100))
      : 0

  useEffect(() =>
  {
    if (visibleId && cards.some((c) => c.id === visibleId)) return
    setVisibleId(cards[0]?.id ?? null)
  }, [cards, visibleId])

  const onAction = (id: string) =>
  {
    if (id === 'gasto') setSheetMode('spend')
    else if (id === 'lancamentos') setLedgerOpen(true)
    else if (id === 'editar') setEditOpen(true)
    else if (id === 'fatura') setSheetMode('invoice')
  }

  if (cards.length === 0)
  {
    return (
      <View style={{ gap: space.md }}>
        <Card tone="elevated" style={{ gap: space.md }}>
          <EmptyState
            title="Nenhum cartão"
            body="Crie o primeiro cartão aqui. Não precisa da web."
          />
          <PrimaryButton label="Novo cartão" onPress={() => setCreateOpen(true)} />
        </Card>
        <FinanceCardEditSheet
          card={null}
          mode="create"
          visible={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={(id) => setVisibleId(id)}
        />
      </View>
    )
  }

  return (
    <View style={{ gap: space.lg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <PrimaryButton
          label="+ Novo cartão"
          size="sm"
          variant="secondary"
          onPress={() => setCreateOpen(true)}
        />
      </View>

      <CardCarousel
        cards={cards}
        selectedId={visibleId}
        onSelect={(id) =>
        {
          setVisibleId(id)
          setDetailId(id)
        }}
        onVisibleChange={setVisibleId}
      />

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: space.sm,
        }}
      >
        {ACTIONS.map((a) => (
          <PressableScale
            key={a.id}
            onPress={() => onAction(a.id)}
            accessibilityRole="button"
            accessibilityLabel={a.label}
            style={{
              flex: 1,
              alignItems: 'center',
              gap: 8,
              minHeight: 72,
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                backgroundColor: colors.elevated,
                borderWidth: 1,
                borderColor: colors.hairline,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={a.icon} size={20} color={colors.ink} />
            </View>
            <Text variant="micro" muted style={{ fontSize: 11 }}>
              {a.label}
            </Text>
          </PressableScale>
        ))}
      </View>

      {primary ? (
        <Card tone="elevated" style={{ gap: space.md, borderRadius: radius.sheet }}>
          <SectionHeader
            title="Limite & fatura"
            subtitle={primary.nome}
          />
          <View style={{ flexDirection: 'row', gap: space.md }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text variant="caption" muted>
                Disponível
              </Text>
              <Text variant="title" color={colors.health} style={{ fontSize: 20 }}>
                {formatBRL(Math.max(0, primary.limite - faturaPrimary))}
              </Text>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text variant="caption" muted>
                Fatura aberta
              </Text>
              <Text variant="title" color={colors.finance} style={{ fontSize: 20 }}>
                {formatBRL(faturaPrimary)}
              </Text>
            </View>
          </View>
          <View
            style={{
              height: 8,
              borderRadius: 999,
              backgroundColor: colors.axelMuted,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: `${usadoPct}%`,
                height: '100%',
                backgroundColor: colors.axel,
              }}
            />
          </View>
          <Text variant="caption" muted>
            {formatBRL(faturaPrimary)} / {formatBRL(primary.limite)} · crédito não sai do saldo até pagar
          </Text>
          {faturaPrimary > 0 ? (
            <PrimaryButton
              label="Pagar fatura"
              size="sm"
              onPress={() => void payCardInvoice(primary.id, isGuest)}
            />
          ) : null}
        </Card>
      ) : null}

      <View style={{ gap: space.sm }}>
        <SectionHeader title="Seus cartões" />
        <Card tone="inset" style={{ paddingVertical: space.sm }}>
          {cards.map((card, i) => (
            <ListRow
              key={`row-${card.id}`}
              title={card.nome}
              subtitle={`${card.bandeira === 'visa' ? 'Visa' : 'Mastercard'} · vence dia ${String(card.diaVencimento).padStart(2, '0')}`}
              right={card.status === 'ativo' ? formatBRL(card.limite) : 'Bloq.'}
              showSeparator={i < cards.length - 1}
              onPress={() =>
              {
                setVisibleId(card.id)
                setDetailId(card.id)
              }}
            />
          ))}
        </Card>
      </View>

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
        card={sheetCard ?? null}
        mode={sheetMode}
        onClose={() => setSheetMode(null)}
      />
      <FinanceCardEditSheet
        card={primary ?? null}
        mode="edit"
        visible={editOpen}
        onClose={() => setEditOpen(false)}
      />
      <FinanceCardEditSheet
        card={null}
        mode="create"
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => setVisibleId(id)}
      />
      <FinanceCardLedgerSheet
        card={primary ?? null}
        visible={ledgerOpen}
        onClose={() => setLedgerOpen(false)}
        onSpend={() => setSheetMode('spend')}
      />
    </View>
  )
}
