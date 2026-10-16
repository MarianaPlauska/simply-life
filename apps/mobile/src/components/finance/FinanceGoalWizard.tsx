import { useState } from 'react'
import { View } from 'react-native'
import { Card, Text, PrimaryButton, Field } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { useWebDesk } from '../dashboard/web/webBox'

/** `collapsed`: começa como um botão, o formulário abre ao tocar (quando já há metas). */
export function FinanceGoalWizard({ collapsed = false }: { collapsed?: boolean } = {})
{
  const { space, colors } = useTheme()
  const addFinanceGoal = useDataStore((s) => s.addFinanceGoal)
  const [titulo, setTitulo] = useState('')
  const [meta, setMeta] = useState('')
  const [msg, setMsg] = useState('')
  const [open, setOpen] = useState(!collapsed)
  const desk = useWebDesk()
  // computador: campo no tom da página para aparecer dentro do painel
  const fieldStyle = desk ? { backgroundColor: colors.canvas } : undefined

  if (!open)
  {
    return (
      <PrimaryButton label="Nova meta" variant={desk ? 'ghost' : 'secondary'} icon="add" onPress={() => setOpen(true)} />
    )
  }

  return (
    <Card tone="elevated" style={{ gap: space.md }}>
      <Text variant="section">Nova meta</Text>
      <Field label="Nome" value={titulo} onChangeText={setTitulo} placeholder="Reserva de emergência" style={fieldStyle} />
      <Field
        label="Valor alvo"
        keyboardType="decimal-pad"
        value={meta}
        onChangeText={setMeta}
        placeholder="5000"
        style={fieldStyle}
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
          if (collapsed) setOpen(false)
        }}
      />
      {collapsed ? (
        <PrimaryButton label="Cancelar" variant="ghost" onPress={() => { setOpen(false); setMsg('') }} />
      ) : null}
      {msg ? (
        <Text variant="caption" color={colors.axel}>
          {msg}
        </Text>
      ) : null}
    </Card>
  )
}
