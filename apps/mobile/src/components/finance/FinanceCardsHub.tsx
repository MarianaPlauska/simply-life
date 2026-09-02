import { useState } from 'react'
import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { formatBRL, type FinanceCard } from '@simply-life/shared'
import { Card, Text, ListRow, EmptyState, PressableScale, SectionHeader } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useCaptureStore } from '../../store/captureStore'
import { CardCarousel } from './CardCarousel'
import { FinanceCardDetailSheet } from './FinanceCardDetailSheet'

type Props = {
  cards: FinanceCard[]
  onExtrato: () => void
  onFaturas: () => void
  onMais?: () => void
}

const ACTIONS = [
  { id: 'gasto', label: 'Gasto', icon: 'arrow-up-outline' as const },
  { id: 'extrato', label: 'Extrato', icon: 'list-outline' as const },
  { id: 'fatura', label: 'Fatura', icon: 'receipt-outline' as const },
  { id: 'mais', label: 'Mais', icon: 'grid-outline' as const },
]

/**
 * Aba Cartões — layout ref 3: cartão em destaque + grade de ações + lista.
 */
export function FinanceCardsHub({
  cards,
  onExtrato,
  onFaturas,
  onMais,
}: Props)
{
  const { colors, space, radius } = useTheme()
  const openCapture = useCaptureStore((s) => s.openCapture)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [visibleId, setVisibleId] = useState<string | null>(cards[0]?.id ?? null)
  const primary = cards.find((c) => c.id === visibleId) ?? cards[0]
  const detailCard = cards.find((c) => c.id === detailId) ?? null

  const onAction = (id: string) =>
  {
    if (id === 'gasto') openCapture('expense')
    else if (id === 'extrato') onExtrato()
    else if (id === 'fatura') onFaturas()
    else if (onMais) onMais()
    else openCapture('dump')
  }

  if (cards.length === 0)
  {
    return (
      <Card tone="elevated">
        <EmptyState title="Nenhum cartão" body="Cadastre cartões na web para ver faturas aqui." />
      </Card>
    )
  }

  return (
    <View style={{ gap: space.lg }}>
      {/* Nível 1 — um cartão por vez, deslize para o próximo */}
      <CardCarousel
        cards={cards}
        selectedId={detailId ?? visibleId}
        onSelect={(id) => setDetailId(id)}
        onVisibleChange={setVisibleId}
      />

      {/* Ações — 4 colunas (ref Send Money strip) */}
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

      {/* Resumo do cartão ativo */}
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
                {formatBRL(Math.max(0, primary.limite - (primary.faturaAberta ?? 0)))}
              </Text>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text variant="caption" muted>
                Fatura aberta
              </Text>
              <Text variant="title" color={colors.finance} style={{ fontSize: 20 }}>
                {formatBRL(primary.faturaAberta ?? 0)}
              </Text>
            </View>
          </View>
        </Card>
      ) : null}

      {/* Nível 3 — lista compacta dos cartões */}
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
              onPress={() => setDetailId(card.id)}
            />
          ))}
        </Card>
      </View>

      <FinanceCardDetailSheet
        card={detailCard}
        visible={detailId != null}
        onClose={() => setDetailId(null)}
      />
    </View>
  )
}
