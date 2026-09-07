import { Modal, Pressable, ScrollView, View, useWindowDimensions } from 'react-native'
import { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import {
  cardFaturaAbertaDisplay,
  cardInstallments,
  formatBRL,
  type FinanceCard,
} from '@simply-life/shared'
import { Text, PressableScale, PrimaryButton, ListRow } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { CreditCardVisual } from './CreditCardVisual'
import { tabBarScreenPadding } from '../../ui/chrome'
import { useDataStore } from '../../store/dataStore'
import { useAuthStore } from '../../store/authStore'

type Props = {
  card: FinanceCard | null
  visible: boolean
  onClose: () => void
  onEdit?: () => void
  onSpend?: () => void
  onLedger?: () => void
}

type DetailRow = { label: string; value: string; copy?: boolean }

/**
 * Detalhe do cartão — layout tipo referência “Card details”
 * (preview + lista Nome / Banco / Número / Validade / CVV / Endereço).
 */
export function FinanceCardDetailSheet({
  card,
  visible,
  onClose,
  onEdit,
  onSpend,
  onLedger,
}: Props)
{
  const { colors, space, elevation } = useTheme()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const txs = useDataStore((s) => s.finance)
  const payCardInvoice = useDataStore((s) => s.payCardInvoice)
  const isGuest = useAuthStore((s) => s.isGuest)
  const [paying, setPaying] = useState(false)
  const [payMsg, setPayMsg] = useState<string | null>(null)

  if (!card) return null

  const cardW = Math.min(width - 48, 320)
  const bottomPad = tabBarScreenPadding(insets.bottom)
  const digits = (card.numeroMascarado || '').replace(/\D/g, '').slice(-4)
  const account = digits
    ? `**** **** **** ${digits}`
    : '**** **** **** ****'
  const validade =
    card.validadeMesAno
    || `${String(card.diaVencimento).padStart(2, '0')}/${String(new Date().getFullYear() + 3).slice(-2)}`

  const rows: DetailRow[] = [
    { label: 'Nome do cartão', value: card.nome, copy: true },
    { label: 'Banco', value: card.banco || card.nome, copy: true },
    { label: 'Número', value: account, copy: true },
    { label: 'Validade', value: validade },
    { label: 'CVV', value: '•••' },
    {
      label: 'Endereço de cobrança',
      value: card.enderecoCobranca || 'Não informado',
      copy: Boolean(card.enderecoCobranca),
    },
    { label: 'CEP', value: card.cep || '—' },
  ]

  const fatura = cardFaturaAbertaDisplay(card, txs)
  const disponivel = Math.max(0, card.limite - fatura)
  const usadoPct = card.limite > 0 ? Math.min(100, Math.round((fatura / card.limite) * 100)) : 0
  const parcelas = cardInstallments(txs, card).filter((p) => p.total > 1).slice(0, 8)

  const pagarFatura = async () =>
  {
    setPayMsg(null)
    setPaying(true)
    const res = await payCardInvoice(card.id, isGuest)
    setPaying(false)
    setPayMsg(res.ok ? 'Fatura paga — o valor saiu do saldo.' : (res.error || 'Não foi possível pagar'))
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay }}>
        <Pressable
          accessibilityLabel="Fechar"
          onPress={onClose}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />
        <View
          style={{
            backgroundColor: colors.canvas,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingTop: space.md,
            paddingHorizontal: space.md,
            paddingBottom: bottomPad,
            maxHeight: '94%',
            gap: space.md,
            ...elevation.hero,
          }}
        >
          <View style={{ alignItems: 'center', gap: space.sm }}>
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 999,
                backgroundColor: colors.hairline,
              }}
            />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
                justifyContent: 'space-between',
              }}
            >
              <PressableScale
                onPress={onClose}
                accessibilityLabel="Voltar"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.elevated,
                }}
              >
                <Ionicons name="chevron-back" size={20} color={colors.ink} />
              </PressableScale>
              <Text variant="section">Cartões</Text>
              <PressableScale
                onPress={onEdit}
                accessibilityLabel="Personalizar cartão"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.elevated,
                }}
              >
                <Ionicons name="settings-outline" size={20} color={colors.ink} />
              </PressableScale>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: space.md, paddingBottom: space.md }}
          >
            <View style={{ alignItems: 'center', gap: space.sm }}>
              <CreditCardVisual card={card} width={cardW} selected />
              <Text variant="caption" muted>
                Saldo atual
              </Text>
              <Text variant="hero" style={{ fontSize: 26, letterSpacing: -0.6 }}>
                {formatBRL(disponivel)}
              </Text>
            </View>

            {/* Destaques circulares (ref. 2) */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 4 }}>
              {[
                { label: 'Gasto', icon: 'add' as const, onPress: onSpend },
                { label: 'Extrato', icon: 'swap-horizontal' as const, onPress: onLedger },
                { label: 'Editar', icon: 'create-outline' as const, onPress: onEdit },
                { label: 'Mais', icon: 'ellipsis-horizontal' as const, onPress: onLedger },
              ].map((a) => (
                <PressableScale
                  key={a.label}
                  accessibilityLabel={a.label}
                  onPress={a.onPress}
                  disabled={!a.onPress}
                  style={{ alignItems: 'center', gap: 6, minWidth: 64 }}
                >
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 999,
                      borderWidth: 1.5,
                      borderColor: colors.axel,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.elevated,
                    }}
                  >
                    <Ionicons name={a.icon} size={20} color={colors.axel} />
                  </View>
                  <Text variant="micro" muted style={{ fontWeight: '600' }}>
                    {a.label}
                  </Text>
                </PressableScale>
              ))}
            </View>

            <View
              style={{
                backgroundColor: colors.elevated,
                borderRadius: 20,
                padding: space.md,
                gap: space.sm,
              }}
            >
              <Text variant="caption" muted style={{ fontWeight: '700' }}>
                Limite da fatura
              </Text>
              <Text variant="bodyStrong">
                {formatBRL(fatura)} / {formatBRL(card.limite)}
              </Text>
              <View
                style={{
                  height: 10,
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
                    borderRadius: 999,
                  }}
                />
              </View>
              <Text variant="caption" muted>
                Disponível {formatBRL(disponivel)} · vence dia {card.diaVencimento}
              </Text>
              {fatura > 0 ? (
                <PrimaryButton
                  label="Pagar fatura agora"
                  loading={paying}
                  onPress={() => void pagarFatura()}
                />
              ) : (
                <Text variant="caption" muted>
                  Nada em aberto neste ciclo.
                </Text>
              )}
              {payMsg ? (
                <Text variant="caption" color={payMsg.startsWith('Fatura paga') ? colors.health : colors.danger}>
                  {payMsg}
                </Text>
              ) : null}
            </View>

            {parcelas.length > 0 ? (
              <View
                style={{
                  backgroundColor: colors.elevated,
                  borderRadius: 20,
                  padding: space.md,
                  gap: 4,
                }}
              >
                <Text variant="caption" muted style={{ marginBottom: 4, fontWeight: '700' }}>
                  Parcelas
                </Text>
                {parcelas.map((p, i) => (
                  <ListRow
                    key={p.id}
                    title={p.titulo}
                    subtitle={`${p.atual} de ${p.total} · ${p.data}`}
                    right={`−${formatBRL(p.valor)}`}
                    showSeparator={i < parcelas.length - 1}
                  />
                ))}
              </View>
            ) : null}

            <View
              style={{
                backgroundColor: colors.elevated,
                borderRadius: 20,
                padding: space.md,
                gap: 4,
              }}
            >
              <Text variant="caption" muted style={{ marginBottom: 4, fontWeight: '700' }}>
                Detalhes do cartão
              </Text>
              {rows.map((row, i) => (
                <ListRow
                  key={row.label}
                  title={row.label}
                  subtitle={row.value}
                  right={row.copy ? '⎘' : undefined}
                  showSeparator={i < rows.length - 1}
                />
              ))}
            </View>

            {onEdit ? (
              <PrimaryButton label="Personalizar cartão" icon="settings-outline" onPress={onEdit} />
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
