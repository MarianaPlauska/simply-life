import { useState } from 'react'
import { View } from 'react-native'
import { Card, Text, PrimaryButton, Field } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'

export function FinanceGoalWizard()
{
  const { space, colors } = useTheme()
  const addFinanceGoal = useDataStore((s) => s.addFinanceGoal)
  const [titulo, setTitulo] = useState('')
  const [meta, setMeta] = useState('')
  const [msg, setMsg] = useState('')

  return (
    <Card tone="elevated" style={{ gap: space.md }}>
      <Text variant="section">Nova meta</Text>
      <Field label="Nome" value={titulo} onChangeText={setTitulo} placeholder="Reserva de emergência" />
      <Field
        label="Valor alvo"
        keyboardType="decimal-pad"
        value={meta}
        onChangeText={setMeta}
        placeholder="5000"
      />
      <PrimaryButton
        label="Criar meta"
        onPress={() =>
        {
          const v = Number(meta.replace(',', '.'))
          if (!titulo.trim() || !Number.isFinite(v) || v <= 0)
          {
            setMsg('Informe nome e valor')
            return
          }
          addFinanceGoal(titulo, v)
          setTitulo('')
          setMeta('')
          setMsg('Meta criada')
        }}
      />
      {msg ? (
        <Text variant="caption" color={colors.axel}>
          {msg}
        </Text>
      ) : null}
    </Card>
  )
}
