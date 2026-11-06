import { useState } from 'react'
import { Pressable } from 'react-native'
import { Modal } from '../../ui/Modal'
import { cardUso, formatBRL, type FinanceCard } from '@simply-life/shared'
import { Card, Text, PrimaryButton, Field } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'

type Props = {
  card: FinanceCard | null
  visible: boolean
  onClose: () => void
}

function ddmm(iso: string): string
{
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
}

/** Valor extra só para o ciclo atual do cartão. O limite não muda. */
export function CardExtraSheet({ card, visible, onClose }: Props)
{
  const { space, colors } = useTheme()
  const txs = useDataStore((s) => s.finance)
  const updateCard = useDataStore((s) => s.updateFinanceCard)
  const [valor, setValor] = useState('')
  const [msg, setMsg] = useState('')

  if (!card || !visible) return null

  const uso = cardUso(card, txs)
  const chave = uso.ciclo.chave

  const salvar = (novo: number) =>
  {
    updateCard(card.id, { adicionais: { ...(card.adicionais ?? {}), [chave]: novo } })
    setValor('')
    setMsg('')
    onClose()
  }

  const adicionar = () =>
  {
    const v = Number(valor.replace(/\./g, '').replace(',', '.'))
    if (!Number.isFinite(v) || v <= 0)
    {
      setMsg('Informe um valor maior que zero.')
      return
    }
    salvar(uso.adicional + v)
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Card tone="elevated" style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, gap: space.md }}>
            <Text variant="section">Adicional · {card.nome}</Text>
            <Text variant="caption" muted>
              Soma um valor só até {ddmm(uso.ciclo.fim)}. O limite de {formatBRL(card.limite)} continua o mesmo.
            </Text>
            {uso.adicional > 0 ? (
              <Text variant="bodyStrong">Já tem {formatBRL(uso.adicional)} de adicional neste ciclo.</Text>
            ) : null}
            <Field
              label="Quanto a mais"
              keyboardType="decimal-pad"
              value={valor}
              onChangeText={setValor}
              placeholder="50,00"
            />
            {msg ? <Text variant="caption" color={colors.danger}>{msg}</Text> : null}
            <PrimaryButton label="Adicionar" onPress={adicionar} />
            {uso.adicional > 0 ? (
              <PrimaryButton label="Tirar o adicional" variant="secondary" onPress={() => salvar(0)} />
            ) : null}
            <PrimaryButton label="Fechar" variant="dismiss" onPress={onClose} />
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
