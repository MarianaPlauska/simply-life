import { useState } from 'react'
import { Modal, Pressable, View } from 'react-native'
import { cardFaturaAbertaDisplay, formatBRL, type FinanceCard } from '@simply-life/shared'
import { Card, Text, PrimaryButton, Field } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { useAuthStore } from '../../store/authStore'

type Props = {
  card: FinanceCard | null
  mode: 'invoice' | 'spend' | null
  onClose: () => void
}

export function CardInvoiceSpendSheet({ card, mode, onClose }: Props)
{
  const { space, colors } = useTheme()
  const addCardSpend = useDataStore((s) => s.addCardSpend)
  const payCardInvoice = useDataStore((s) => s.payCardInvoice)
  const txs = useDataStore((s) => s.finance)
  const isGuest = useAuthStore((s) => s.isGuest)
  const [valor, setValor] = useState('')
  const [titulo, setTitulo] = useState('Compra no cartão')
  const [msg, setMsg] = useState('')
  const [paying, setPaying] = useState(false)

  if (!card || !mode) return null

  const fatura = cardFaturaAbertaDisplay(card, txs)

  const submitSpend = async () =>
  {
    const v = Number(valor.replace(',', '.'))
    if (!Number.isFinite(v) || v <= 0)
    {
      setMsg('Informe um valor')
      return
    }
    const res = await addCardSpend(card.id, v, titulo.trim() || 'Compra', isGuest)
    if (!res.ok)
    {
      setMsg(res.error || 'Falha ao lançar')
      return
    }
    setValor('')
    onClose()
  }

  const pagar = async () =>
  {
    setPaying(true)
    const res = await payCardInvoice(card.id, isGuest)
    setPaying(false)
    if (!res.ok)
    {
      setMsg(res.error || 'Não foi possível pagar')
      return
    }
    onClose()
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(26, 24, 22, 0.72)',
          justifyContent: 'flex-end',
        }}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Card
            tone="elevated"
            style={{
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              gap: space.md,
            }}
          >
            <Text variant="section">
              {mode === 'invoice' ? `Fatura · ${card.nome}` : `Quick spend · ${card.nome}`}
            </Text>
            {mode === 'invoice' ? (
              <View style={{ gap: space.sm }}>
                <Text variant="hero">{formatBRL(fatura)}</Text>
                <Text variant="caption" muted>
                  Vence dia {card.diaVencimento}. Limite {formatBRL(card.limite)}.
                  Pagar agora tira o valor do saldo da conta.
                </Text>
                {msg ? (
                  <Text variant="caption" color={colors.danger}>
                    {msg}
                  </Text>
                ) : null}
                {fatura > 0 ? (
                  <PrimaryButton
                    label="Pagar fatura agora"
                    loading={paying}
                    onPress={() => void pagar()}
                  />
                ) : (
                  <Text variant="caption" muted>
                    Nada em aberto neste ciclo.
                  </Text>
                )}
              </View>
            ) : (
              <>
                <Field
                  label="Descrição"
                  value={titulo}
                  onChangeText={setTitulo}
                />
                <Field
                  label="Valor"
                  keyboardType="decimal-pad"
                  value={valor}
                  onChangeText={setValor}
                  placeholder="89,90"
                />
                {msg ? <Text variant="caption">{msg}</Text> : null}
                <PrimaryButton
                  label="Registrar gasto"
                  onPress={() => void submitSpend()}
                />
              </>
            )}
            <PrimaryButton label="Fechar" variant="dismiss" onPress={onClose} />
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
