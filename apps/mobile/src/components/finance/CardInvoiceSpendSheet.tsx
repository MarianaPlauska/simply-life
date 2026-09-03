import { useState } from 'react'
import { Modal, Pressable, View } from 'react-native'
import { formatBRL, type FinanceCard } from '@simply-life/shared'
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
  const { space } = useTheme()
  const addCardSpend = useDataStore((s) => s.addCardSpend)
  const isGuest = useAuthStore((s) => s.isGuest)
  const [valor, setValor] = useState('')
  const [titulo, setTitulo] = useState('Compra no cartão')
  const [msg, setMsg] = useState('')

  if (!card || !mode) return null

  const submit = async () =>
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
              <View style={{ gap: 6 }}>
                <Text variant="hero">{formatBRL(card.faturaAberta ?? 0)}</Text>
                <Text variant="caption" muted>
                  Vence dia {card.diaVencimento}. Limite {formatBRL(card.limite)}.
                </Text>
              </View>
            ) : null}
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
              label={mode === 'invoice' ? 'Lançar na fatura' : 'Registrar gasto'}
              onPress={() => void submit()}
            />
            <PrimaryButton label="Fechar" variant="ghost" onPress={onClose} />
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
