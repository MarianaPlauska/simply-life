import { useEffect, useState } from 'react'
import { Modal, Pressable, View } from 'react-native'
import type { FinanceCard, FinanceCardGradient } from '@simply-life/shared'
import { Card, Text, PrimaryButton, Field } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'

type Props = {
  card: FinanceCard | null
  visible: boolean
  mode?: 'edit' | 'create'
  onClose: () => void
  onCreated?: (id: string) => void
}

const GRADIENTS: FinanceCardGradient[] = ['purple', 'obsidian', 'sunset', 'ocean', 'mint', 'copper']

/** Criar / editar / apagar cartão (local + demo). */
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
  const [nome, setNome] = useState('')
  const [limite, setLimite] = useState('')
  const [dia, setDia] = useState('10')
  const [grad, setGrad] = useState<FinanceCardGradient>('copper')
  const [bandeira, setBandeira] = useState<FinanceCard['bandeira']>('mastercard')
  const [msg, setMsg] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isCreate = mode === 'create'

  useEffect(() =>
  {
    if (!visible) return
    setConfirmDelete(false)
    setMsg('')
    if (isCreate || !card)
    {
      setNome('')
      setLimite('')
      setDia('10')
      setGrad('copper')
      setBandeira('mastercard')
      return
    }
    setNome(card.nome)
    setLimite(String(card.limite))
    setDia(String(card.diaVencimento))
    setGrad(card.tipoGradiente ?? 'copper')
    setBandeira(card.bandeira)
  }, [card?.id, visible, isCreate])

  if (!visible) return null
  if (!isCreate && !card) return null

  const save = () =>
  {
    const lim = Number(limite.replace(',', '.'))
    const d = Number(dia)
    if (!nome.trim() || !Number.isFinite(lim) || lim <= 0)
    {
      setMsg('Informe nome e limite válidos')
      return
    }
    if (!Number.isFinite(d) || d < 1 || d > 28)
    {
      setMsg('Dia de vencimento entre 1 e 28')
      return
    }
    if (isCreate)
    {
      const created = addCard({
        nome: nome.trim(),
        limite: lim,
        diaVencimento: Math.round(d),
        bandeira,
        tipoGradiente: grad,
      })
      onCreated?.(created.id)
      onClose()
      return
    }
    if (!card) return
    updateCard(card.id, {
      nome: nome.trim(),
      limite: lim,
      diaVencimento: Math.round(d),
      tipoGradiente: grad,
      bandeira,
    })
    onClose()
  }

  const onDelete = () =>
  {
    if (!card) return
    if (!confirmDelete)
    {
      setConfirmDelete(true)
      setMsg('Toque de novo em Apagar para confirmar')
      return
    }
    removeCard(card.id)
    onClose()
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: colors.overlay,
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
              {isCreate ? 'Novo cartão' : `Editar · ${card?.nome}`}
            </Text>
            <Field label="Nome" value={nome} onChangeText={setNome} placeholder="Nubank" />
            <Field
              label="Limite"
              keyboardType="decimal-pad"
              value={limite}
              onChangeText={setLimite}
              placeholder="5000"
            />
            <Field
              label="Vence dia"
              keyboardType="number-pad"
              value={dia}
              onChangeText={setDia}
            />
            <View style={{ gap: 8 }}>
              <Text variant="caption" muted>
                Bandeira
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['mastercard', 'visa'] as const).map((b) => (
                  <PrimaryButton
                    key={b}
                    label={b === 'visa' ? 'Visa' : 'Mastercard'}
                    size="sm"
                    variant={bandeira === b ? 'primary' : 'secondary'}
                    onPress={() => setBandeira(b)}
                  />
                ))}
              </View>
            </View>
            <View style={{ gap: 8 }}>
              <Text variant="caption" muted>
                Visual
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {GRADIENTS.map((g) => (
                  <Pressable
                    key={g}
                    accessibilityLabel={`Cor ${g}`}
                    onPress={() => setGrad(g)}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 999,
                      backgroundColor: colors.surface,
                      borderWidth: 2,
                      borderColor: grad === g ? colors.axel : colors.hairline,
                    }}
                  />
                ))}
              </View>
            </View>
            {msg ? (
              <Text variant="caption" color={confirmDelete ? colors.danger : colors.inkMuted}>
                {msg}
              </Text>
            ) : null}
            <PrimaryButton label={isCreate ? 'Criar cartão' : 'Salvar'} onPress={save} />
            {!isCreate ? (
              <PrimaryButton
                label={confirmDelete ? 'Confirmar exclusão' : 'Apagar cartão'}
                variant="ghost"
                onPress={onDelete}
              />
            ) : null}
            <PrimaryButton label="Cancelar" variant="ghost" onPress={onClose} />
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
