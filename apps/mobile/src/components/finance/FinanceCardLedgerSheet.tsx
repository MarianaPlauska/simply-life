import { useMemo } from 'react'
import { Modal, Pressable, ScrollView } from 'react-native'
import { formatBRL, cardFaturaAbertaDisplay, parseParcela, type FinanceCard } from '@simply-life/shared'
import { Card, Text, PrimaryButton, ListRow, EmptyState } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'

type Props = {
  card: FinanceCard | null
  visible: boolean
  onClose: () => void
  onSpend: () => void
}

/** Lançamentos vinculados ao cartão (cardId ou título com nome). */
export function FinanceCardLedgerSheet({ card, visible, onClose, onSpend }: Props)
{
  const { space } = useTheme()
  const txs = useDataStore((s) => s.finance) ?? []

  const rows = useMemo(() =>
  {
    if (!card) return []
    const nome = card.nome.toLowerCase()
    return [...txs]
      .filter((t) =>
        t.tipo === 'despesa'
        && (t.cardId === card.id
          || t.titulo.toLowerCase().includes(nome)
          || t.titulo.toLowerCase().includes('[cartão]')))
      .sort((a, b) => b.data.localeCompare(a.data))
      .slice(0, 40)
  }, [txs, card])

  if (!card || !visible) return null

  const total = rows.reduce((acc, t) => acc + t.valor, 0)
  const fatura = cardFaturaAbertaDisplay(card, txs)

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(26, 24, 22, 0.72)',
          justifyContent: 'flex-end',
        }}
      >
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '85%' }}>
          <Card
            tone="elevated"
            style={{
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              gap: space.md,
              maxHeight: '100%',
            }}
          >
            <Text variant="section">Lançamentos · {card.nome}</Text>
            <Text variant="caption" muted>
              Fatura aberta {formatBRL(fatura)} · listados {formatBRL(total)}
            </Text>
            <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ gap: 0 }}>
              {rows.length === 0 ? (
                <EmptyState
                  title="Sem lançamentos neste cartão"
                  body="Use Gasto para registrar uma compra na fatura."
                />
              ) : (
                rows.map((t, i) =>
                {
                  const parcela = parseParcela(t.titulo)
                  return (
                  <ListRow
                    key={t.id}
                    title={t.titulo}
                    subtitle={
                      parcela
                        ? `${t.data} · ${parcela.atual} de ${parcela.total}`
                        : t.data
                    }
                    right={`−${formatBRL(t.valor)}`}
                    showSeparator={i < rows.length - 1}
                  />
                  )
                })
              )}
            </ScrollView>
            <PrimaryButton
              label="Lançar gasto neste cartão"
              onPress={() =>
              {
                onClose()
                onSpend()
              }}
            />
            <PrimaryButton label="Fechar" variant="dismiss" onPress={onClose} />
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
