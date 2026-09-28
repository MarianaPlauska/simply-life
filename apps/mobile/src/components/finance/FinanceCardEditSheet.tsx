import { useEffect, useState } from 'react'
import { Modal, Pressable, ScrollView, View } from 'react-native'
import type { FinanceCard } from '@simply-life/shared'
import { Card, Text, PrimaryButton, Icon } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { confirmDestructive } from '../../lib/confirmDestructive'
import {
  FinanceCardForm,
  cardDraftFrom,
  cardDraftToPatch,
  emptyCardDraft,
  validateCardDraft,
  type CardDraft,
} from './FinanceCardForm'

type Props = {
  card: FinanceCard | null
  visible: boolean
  mode?: 'edit' | 'create'
  onClose: () => void
  onCreated?: (id: string) => void
}

/** Criar ou editar cartão: cor, nome, limite, vencimento, validade e finais, com prévia ao vivo. */
export function FinanceCardEditSheet({
  card,
  visible,
  mode = 'edit',
  onClose,
  onCreated,
}: Props)
{
  const { colors, space } = useTheme()
  const updateCard = useDataStore((s) => s.updateFinanceCard)
  const addCard = useDataStore((s) => s.addFinanceCard)
  const removeCard = useDataStore((s) => s.removeFinanceCard)
  const [draft, setDraft] = useState<CardDraft>(emptyCardDraft)
  const [msg, setMsg] = useState('')

  const isCreate = mode === 'create'

  useEffect(() =>
  {
    if (!visible) return
    setMsg('')
    setDraft(isCreate || !card ? emptyCardDraft() : cardDraftFrom(card))
  }, [card?.id, visible, isCreate])

  if (!visible) return null
  if (!isCreate && !card) return null

  const save = () =>
  {
    const problem = validateCardDraft(draft)
    if (problem)
    {
      setMsg(problem)
      return
    }
    const patch = cardDraftToPatch(draft)
    if (isCreate)
    {
      const { validadeMesAno, banco, enderecoCobranca, cep, ...base } = patch
      const created = addCard(base)
      updateCard(created.id, { validadeMesAno, banco, enderecoCobranca, cep })
      onCreated?.(created.id)
      onClose()
      return
    }
    if (!card) return
    updateCard(card.id, { ...patch, numeroMascarado: patch.numeroMascarado ?? card.numeroMascarado })
    onClose()
  }

  const onDelete = () =>
  {
    if (!card) return
    confirmDestructive(
      'Apagar cartão',
      `"${card.nome}" sai da carteira. As compras já lançadas continuam no extrato.`,
      () =>
      {
        removeCard(card.id)
        onClose()
      },
      'Apagar',
    )
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Card
            tone="elevated"
            style={{
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              gap: space.md,
              maxHeight: '92%',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Icon name="card-outline" size={20} color={colors.axel} />
              <Text variant="section" style={{ flex: 1 }}>
                {isCreate ? 'Novo cartão' : 'Personalizar cartão'}
              </Text>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 520 }}
              contentContainerStyle={{ gap: space.md, paddingBottom: space.sm }}
            >
              <FinanceCardForm value={draft} onChange={setDraft} base={card} previewWidth={280} />
              {msg ? <Text variant="caption" color={colors.danger}>{msg}</Text> : null}
            </ScrollView>

            <PrimaryButton label={isCreate ? 'Criar cartão' : 'Salvar cartão'} onPress={save} />
            {!isCreate ? <PrimaryButton label="Apagar cartão" variant="danger" onPress={onDelete} /> : null}
            <PrimaryButton label="Cancelar" variant="ghost" onPress={onClose} />
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
