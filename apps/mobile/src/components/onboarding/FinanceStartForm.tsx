import { useState } from 'react'
import { View } from 'react-native'
import { Text, Chip, Field, PrimaryButton } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { isModuleOn, type AppModuleId } from '../../lib/appModules'
import { OnbBlock } from './OnbStep'
import { FIXA_PRESETS, type FinanceDraft } from './startDrafts'

type Props = {
  value: FinanceDraft
  onChange: (next: FinanceDraft) => void
  enabled: AppModuleId[] | undefined
  /** Em Preferências o saldo e o salário ficam; contas e meta são editadas na Carteira */
  compact?: boolean
}

/** Saldo, salário, contas fixas e uma meta. Tudo opcional. */
export function FinanceStartForm({ value, onChange, enabled, compact }: Props)
{
  const { space } = useTheme()
  const set = (p: Partial<FinanceDraft>) => onChange({ ...value, ...p })
  const [fixaNome, setFixaNome] = useState('')
  const [fixaValor, setFixaValor] = useState('')
  const [fixaDia, setFixaDia] = useState('')
  const on = (id: AppModuleId) => isModuleOn(enabled, id)

  return (
    <View style={{ gap: space.md }}>
      {on('spend') ? (
        <OnbBlock title="Sua conta" hint="Quanto tem hoje na conta corrente. O saldo do app parte daqui.">
          <Field
            label="Saldo de hoje (R$)"
            keyboardType="decimal-pad"
            value={value.balance}
            onChangeText={(v) => set({ balance: v })}
            placeholder="2.350,00"
          />
          <Field
            label="Salário bruto (R$)"
            keyboardType="decimal-pad"
            value={value.salary}
            onChangeText={(v) => set({ salary: v })}
            placeholder="4.500,00"
          />
          <Text variant="label" muted>
            Quando cai o salário
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, alignItems: 'center' }}>
            <Chip label="5º dia útil" active={value.quintoDiaUtil} onPress={() => set({ quintoDiaUtil: true })} />
            <Chip label="Dia fixo" active={!value.quintoDiaUtil} onPress={() => set({ quintoDiaUtil: false })} />
          </View>
          {!value.quintoDiaUtil ? (
            <Field
              label="Dia do mês"
              keyboardType="number-pad"
              value={value.payday}
              onChangeText={(v) => set({ payday: v })}
              placeholder="5"
            />
          ) : null}
        </OnbBlock>
      ) : null}

      {on('bills') && !compact ? (
        <OnbBlock title="Contas fixas" hint="O que vence todo mês. Entram no saldo projetado.">
          {value.fixas.map((f, i) => (
            <View key={`${f.nome}-${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text variant="body" style={{ flex: 1 }}>
                {f.nome} · R$ {f.valor} · dia {f.dia || '10'}
              </Text>
              <PrimaryButton
                label="Tirar"
                variant="link"
                size="sm"
                onPress={() => set({ fixas: value.fixas.filter((_, j) => j !== i) })}
              />
            </View>
          ))}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {FIXA_PRESETS.filter((p) => !value.fixas.some((f) => f.nome === p)).map((p) => (
              <Chip key={p} label={p} active={fixaNome === p} onPress={() => setFixaNome(p)} />
            ))}
          </View>
          <Field label="Nome" value={fixaNome} onChangeText={setFixaNome} placeholder="Aluguel" />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 2 }}>
              <Field label="Valor (R$)" keyboardType="decimal-pad" value={fixaValor} onChangeText={setFixaValor} placeholder="1.200,00" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Vence dia" keyboardType="number-pad" value={fixaDia} onChangeText={setFixaDia} placeholder="10" />
            </View>
          </View>
          <PrimaryButton
            label="Adicionar conta"
            variant="secondary"
            size="sm"
            icon="add"
            disabled={!fixaNome.trim() || !fixaValor.trim()}
            onPress={() =>
            {
              set({ fixas: [...value.fixas, { nome: fixaNome.trim(), valor: fixaValor.trim(), dia: fixaDia.trim() }] })
              setFixaNome('')
              setFixaValor('')
              setFixaDia('')
            }}
          />
        </OnbBlock>
      ) : null}

      {on('goals') && !compact ? (
        <OnbBlock title="Uma meta para guardar" hint="Reserva, viagem, um curso. Você acompanha em Carteira → Análise.">
          <Field label="Para quê" value={value.goalTitle} onChangeText={(v) => set({ goalTitle: v })} placeholder="Reserva de emergência" />
          <Field
            label="Quanto (R$)"
            keyboardType="decimal-pad"
            value={value.goalValue}
            onChangeText={(v) => set({ goalValue: v })}
            placeholder="5.000,00"
          />
        </OnbBlock>
      ) : null}
    </View>
  )
}
