import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import type { FinanceCard, FinanceCardGradient } from '@simply-life/shared'
import { Field, Icon, Text, Chip } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { CARD_SKINS, CARD_SKIN_ORDER, CreditCardVisual } from './CreditCardVisual'

/** Rascunho do cartão enquanto a pessoa preenche (tudo texto, validado só ao salvar). */
export type CardDraft = {
  nome: string
  limite: string
  dia: string
  validade: string
  finais: string
  titular: string
  bandeira: FinanceCard['bandeira']
  grad: FinanceCardGradient
  banco: string
  endereco: string
  cep: string
}

export function emptyCardDraft(): CardDraft
{
  return {
    nome: '',
    limite: '',
    dia: '10',
    validade: '',
    finais: '',
    titular: '',
    bandeira: 'mastercard',
    grad: 'copper',
    banco: '',
    endereco: '',
    cep: '',
  }
}

export function cardDraftFrom(card: FinanceCard): CardDraft
{
  return {
    nome: card.nome,
    limite: String(card.limite),
    dia: String(card.diaVencimento),
    validade: card.validadeMesAno ?? '',
    finais: (card.numeroMascarado || '').replace(/\D/g, '').slice(-4),
    titular: card.titular ?? '',
    bandeira: card.bandeira,
    grad: card.tipoGradiente ?? 'copper',
    banco: card.banco ?? '',
    endereco: card.enderecoCobranca ?? '',
    cep: card.cep ?? '',
  }
}

function parseMoney(v: string): number
{
  return Number(v.replace(/\./g, '').replace(',', '.'))
}

/** Mensagem do primeiro problema, ou null quando dá para salvar. */
export function validateCardDraft(d: CardDraft): string | null
{
  const lim = parseMoney(d.limite)
  const dia = Number(d.dia)
  if (!d.nome.trim()) return 'Dê um nome ao cartão, por exemplo Nubank.'
  if (!Number.isFinite(lim) || lim <= 0) return 'Informe o limite do cartão.'
  if (!Number.isInteger(dia) || dia < 1 || dia > 28) return 'O vencimento precisa ser um dia entre 1 e 28.'
  if (d.validade && !/^(0[1-9]|1[0-2])\/\d{2}$/.test(d.validade)) return 'Validade no formato MM/AA, por exemplo 08/29.'
  if (d.finais && d.finais.length !== 4) return 'Use os 4 últimos dígitos do cartão.'
  return null
}

/** Campos prontos para addFinanceCard / updateFinanceCard. */
export function cardDraftToPatch(d: CardDraft): Omit<FinanceCard, 'id' | 'status' | 'faturaAberta'>
{
  const last4 = d.finais.replace(/\D/g, '').slice(-4)
  return {
    nome: d.nome.trim(),
    limite: parseMoney(d.limite),
    diaVencimento: Math.round(Number(d.dia)),
    bandeira: d.bandeira,
    tipoGradiente: d.grad,
    titular: d.titular.trim() || d.nome.trim(),
    numeroMascarado: last4 ? `•••• ${last4}` : undefined,
    validadeMesAno: d.validade.trim() || undefined,
    banco: d.banco.trim() || undefined,
    enderecoCobranca: d.endereco.trim() || undefined,
    cep: d.cep.trim() || undefined,
  }
}

/** Cartão de exemplo desenhado a partir do rascunho (para a prévia ao vivo). */
export function cardPreviewFrom(d: CardDraft, base?: FinanceCard | null): FinanceCard
{
  const patch = cardDraftToPatch(d)
  return {
    id: base?.id ?? 'preview',
    status: base?.status ?? 'ativo',
    faturaAberta: base?.faturaAberta ?? 0,
    ...patch,
    nome: patch.nome || 'Seu cartão',
    limite: Number.isFinite(patch.limite) ? patch.limite : 0,
    diaVencimento: Number.isFinite(patch.diaVencimento) ? patch.diaVencimento : 10,
    titular: patch.titular || 'Titular',
  }
}

function maskValidade(raw: string): string
{
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

type Props = {
  value: CardDraft
  onChange: (next: CardDraft) => void
  /** Cartão já salvo (mantém a fatura atual na prévia) */
  base?: FinanceCard | null
  previewWidth?: number
}

/** Formulário do cartão com prévia ao vivo: cor, nome, limite, vencimento, validade e finais. */
export function FinanceCardForm({ value: d, onChange, base, previewWidth = 300 }: Props)
{
  const { colors, space } = useTheme()
  const [more, setMore] = useState(Boolean(d.banco || d.endereco || d.cep))
  const set = <K extends keyof CardDraft>(k: K, v: CardDraft[K]) => onChange({ ...d, [k]: v })

  return (
    <View style={{ gap: space.md }}>
      <View style={{ alignItems: 'center' }}>
        <CreditCardVisual card={cardPreviewFrom(d, base)} width={previewWidth} />
      </View>

      <View style={{ gap: 12 }}>
        <Text variant="label">Cor</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {CARD_SKIN_ORDER.map((id) =>
          {
            const skin = CARD_SKINS[id]
            const active = d.grad === id
            return (
              <Pressable
                key={id}
                accessibilityRole="button"
                accessibilityLabel={`Cor ${skin.label}`}
                accessibilityState={{ selected: active }}
                onPress={() => set('grad', id)}
                style={{ alignItems: 'center', gap: 6 }}
              >
                <LinearGradient
                  colors={[skin.from, skin.to]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 48,
                    height: 32,
                    borderRadius: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: active ? colors.axelFill : 'transparent',
                  }}
                >
                  {active ? <Icon name="checkmark" size={16} color="#FFFFFF" /> : null}
                </LinearGradient>
                <Text variant="micro" muted={!active}>{skin.label}</Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      <Field label="Nome do cartão" value={d.nome} onChangeText={(t) => set('nome', t)} placeholder="Nubank" />
      <Field
        label="Limite"
        keyboardType="decimal-pad"
        value={d.limite}
        onChangeText={(t) => set('limite', t)}
        placeholder="5000"
      />
      <Text variant="caption" muted style={{ marginTop: -space.sm }}>
        O disponível no cartão é o limite menos a fatura, e se atualiza sozinho conforme você registra as compras.
      </Text>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <View style={{ flex: 1 }}>
          <Field
            label="Vence todo dia"
            keyboardType="number-pad"
            value={d.dia}
            onChangeText={(t) => set('dia', t.replace(/\D/g, '').slice(0, 2))}
            placeholder="10"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Field
            label="Validade"
            keyboardType="number-pad"
            value={d.validade}
            onChangeText={(t) => set('validade', maskValidade(t))}
            placeholder="MM/AA"
          />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <View style={{ flex: 1 }}>
          <Field
            label="4 últimos dígitos"
            keyboardType="number-pad"
            value={d.finais}
            onChangeText={(t) => set('finais', t.replace(/\D/g, '').slice(0, 4))}
            placeholder="4821"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Field
            label="Nome no cartão"
            value={d.titular}
            onChangeText={(t) => set('titular', t)}
            placeholder="Opcional"
            autoCapitalize="characters"
          />
        </View>
      </View>

      <View style={{ gap: 12 }}>
        <Text variant="label">Bandeira</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {(['mastercard', 'visa'] as const).map((b) => (
            <Chip key={b} label={b === 'visa' ? 'Visa' : 'Mastercard'} active={d.bandeira === b} onPress={() => set('bandeira', b)} />
          ))}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => setMore((v) => !v)}
        style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 }}
      >
        <Icon name={more ? 'chevron-up' : 'chevron-down'} size={16} color={colors.axel} />
        <Text variant="label" color={colors.axel}>
          {more ? 'Menos detalhes' : 'Banco, endereço e CEP (opcional)'}
        </Text>
      </Pressable>
      {more ? (
        <View style={{ gap: space.md }}>
          <Field label="Banco" value={d.banco} onChangeText={(t) => set('banco', t)} placeholder="Nu Pagamentos" />
          <Field label="Endereço de cobrança" value={d.endereco} onChangeText={(t) => set('endereco', t)} placeholder="Rua, número, cidade" />
          <Field
            label="CEP"
            keyboardType="number-pad"
            value={d.cep}
            onChangeText={(t) => set('cep', t.replace(/\D/g, '').slice(0, 8))}
            placeholder="01310100"
          />
        </View>
      ) : null}
    </View>
  )
}
