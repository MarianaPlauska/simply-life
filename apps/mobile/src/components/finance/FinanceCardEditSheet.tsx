import { useEffect, useState } from 'react'
import { Modal, Pressable, ScrollView, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { FinanceCard, FinanceCardGradient } from '@simply-life/shared'
import { Card, Text, PrimaryButton, Field } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { CreditCardVisual } from './CreditCardVisual'

type Props = {
  card: FinanceCard | null
  visible: boolean
  mode?: 'edit' | 'create'
  onClose: () => void
  onCreated?: (id: string) => void
}

const GRADIENTS: { id: FinanceCardGradient; color: string; label: string }[] = [
  { id: 'copper', color: '#E8734A', label: 'Cobre' },
  { id: 'sunset', color: '#C45A32', label: 'Sunset' },
  { id: 'obsidian', color: '#27272A', label: 'Obsidian' },
  { id: 'purple', color: '#2A2640', label: 'Roxo' },
  { id: 'ocean', color: '#1E3644', label: 'Oceano' },
  { id: 'mint', color: '#243832', label: 'Menta' },
]

/** Criar / editar cartão como cartão real (visual, titular, finais). */
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
  const [titular, setTitular] = useState('')
  const [banco, setBanco] = useState('')
  const [finais, setFinais] = useState('')
  const [validade, setValidade] = useState('')
  const [endereco, setEndereco] = useState('')
  const [cep, setCep] = useState('')
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
      setTitular('')
      setBanco('')
      setFinais('')
      setValidade('')
      setEndereco('')
      setCep('')
      setLimite('')
      setDia('10')
      setGrad('copper')
      setBandeira('mastercard')
      return
    }
    setNome(card.nome)
    setTitular(card.titular ?? '')
    setBanco(card.banco ?? '')
    const digits = (card.numeroMascarado || '').replace(/\D/g, '').slice(-4)
    setFinais(digits)
    setValidade(card.validadeMesAno ?? '')
    setEndereco(card.enderecoCobranca ?? '')
    setCep(card.cep ?? '')
    setLimite(String(card.limite))
    setDia(String(card.diaVencimento))
    setGrad(card.tipoGradiente ?? 'copper')
    setBandeira(card.bandeira)
  }, [card?.id, visible, isCreate])

  if (!visible) return null
  if (!isCreate && !card) return null

  const preview: FinanceCard = {
    id: card?.id ?? 'preview',
    nome: nome.trim() || 'Seu cartão',
    limite: Number(limite.replace(',', '.')) || 0,
    diaVencimento: Number(dia) || 10,
    status: 'ativo',
    bandeira,
    tipoGradiente: grad,
    numeroMascarado: finais.replace(/\D/g, '').slice(-4)
      ? `•••• ${finais.replace(/\D/g, '').slice(-4)}`
      : '•••• 0000',
    titular: titular.trim() || nome.trim() || 'Titular',
    faturaAberta: card?.faturaAberta ?? 0,
  }

  const save = () =>
  {
    const lim = Number(limite.replace(',', '.'))
    const d = Number(dia)
    const last4 = finais.replace(/\D/g, '').slice(-4)
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
    if (last4 && last4.length !== 4)
    {
      setMsg('Informe 4 dígitos finais do cartão')
      return
    }
    const masked = last4 ? `•••• ${last4}` : undefined
    const titularVal = titular.trim() || nome.trim()
    const meta = {
      banco: banco.trim() || undefined,
      validadeMesAno: validade.trim() || undefined,
      enderecoCobranca: endereco.trim() || undefined,
      cep: cep.trim() || undefined,
    }

    if (isCreate)
    {
      const created = addCard({
        nome: nome.trim(),
        limite: lim,
        diaVencimento: Math.round(d),
        bandeira,
        tipoGradiente: grad,
        titular: titularVal,
        numeroMascarado: masked,
      })
      updateCard(created.id, meta)
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
      titular: titularVal,
      numeroMascarado: masked ?? card.numeroMascarado,
      ...meta,
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
              maxHeight: '92%',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="settings-outline" size={20} color={colors.axel} />
              <Text variant="section" style={{ flex: 1 }}>
                {isCreate ? 'Novo cartão' : 'Personalizar cartão'}
              </Text>
            </View>
            <Text variant="caption" muted>
              Nome, titular, finais e visual — como um cartão real.
            </Text>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 480 }}
              contentContainerStyle={{ gap: space.md, paddingBottom: space.sm }}
            >
              <View style={{ alignItems: 'center' }}>
                <CreditCardVisual card={preview} width={280} />
              </View>

              <Field label="Nome do cartão" value={nome} onChangeText={setNome} placeholder="Nubank" />
              <Field
                label="Titular"
                value={titular}
                onChangeText={setTitular}
                placeholder="Como no cartão"
                autoCapitalize="characters"
              />
              <Field label="Banco" value={banco} onChangeText={setBanco} placeholder="Nu Pagamentos" />
              <Field
                label="4 dígitos finais"
                keyboardType="number-pad"
                value={finais}
                onChangeText={(t) => setFinais(t.replace(/\D/g, '').slice(0, 4))}
                placeholder="4821"
              />
              <Field
                label="Validade (MM/AA)"
                value={validade}
                onChangeText={setValidade}
                placeholder="12/29"
              />
              <Field
                label="Endereço de cobrança"
                value={endereco}
                onChangeText={setEndereco}
                placeholder="Rua, número, cidade"
              />
              <Field
                label="CEP"
                keyboardType="number-pad"
                value={cep}
                onChangeText={(t) => setCep(t.replace(/\D/g, '').slice(0, 8))}
                placeholder="01310100"
              />
              <Field
                label="Limite"
                keyboardType="decimal-pad"
                value={limite}
                onChangeText={setLimite}
                placeholder="5000"
              />
              <Field
                label="Fecha fatura dia"
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
                  Visual do cartão
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {GRADIENTS.map((g) =>
                  {
                    const active = grad === g.id
                    return (
                      <Pressable
                        key={g.id}
                        accessibilityLabel={`Cor ${g.label}`}
                        onPress={() => setGrad(g.id)}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 14,
                          backgroundColor: g.color,
                          borderWidth: 2,
                          borderColor: active ? colors.axel : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {active ? (
                          <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                        ) : null}
                      </Pressable>
                    )
                  })}
                </View>
              </View>

              {msg ? (
                <Text variant="caption" color={confirmDelete ? colors.danger : colors.inkMuted}>
                  {msg}
                </Text>
              ) : null}
            </ScrollView>

            <PrimaryButton label={isCreate ? 'Criar cartão' : 'Salvar cartão'} onPress={save} />
            {!isCreate ? (
              <PrimaryButton
                label={confirmDelete ? 'Confirmar exclusão' : 'Apagar cartão'}
                variant="danger"
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
