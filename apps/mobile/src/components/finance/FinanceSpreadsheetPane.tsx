import { useState } from 'react'
import { View } from 'react-native'
import {
  formatBRL,
  FINANCE_CATEGORY_LABELS,
  type FinanceCategory,
} from '@simply-life/shared'
import { Card, Text, PrimaryButton, Field } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { useAuthStore } from '../../store/authStore'
import { ExpenseCategoryChips } from './ExpenseCategoryChips'

/** Planilha tabular simplificada (native) / edição linha a linha */
export function FinanceSpreadsheetPane()
{
  const { colors, space } = useTheme()
  const txs = useDataStore((s) => s.finance)
  const importFinanceRows = useDataStore((s) => s.importFinanceRows)
  const isGuest = useAuthStore((s) => s.isGuest)
  const [desc, setDesc] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10))
  const [tipo, setTipo] = useState<'despesa' | 'receita'>('despesa')
  const [categoria, setCategoria] = useState<FinanceCategory>('outros')
  const [msg, setMsg] = useState('')

  const addRow = async () =>
  {
    const v = Number(valor.replace(',', '.'))
    if (!desc.trim() || !Number.isFinite(v) || v <= 0)
    {
      setMsg('Informe descrição e valor')
      return
    }
    await importFinanceRows(
      [{ descricao: desc.trim(), valor: v, tipo, data, categoria }],
      isGuest,
    )
    setDesc('')
    setValor('')
    setCategoria('outros')
    setMsg('Linha adicionada')
  }

  return (
    <View style={{ gap: space.md }}>
      <Card tone="elevated" style={{ gap: space.sm }}>
        <Text variant="section">Nova linha</Text>
        <Field label="Descrição" value={desc} onChangeText={setDesc} />
        <Field
          label="Valor"
          keyboardType="decimal-pad"
          value={valor}
          onChangeText={setValor}
        />
        <Field label="Data (YYYY-MM-DD)" value={data} onChangeText={setData} />
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <PrimaryButton
            label="Despesa"
            size="sm"
            variant={tipo === 'despesa' ? 'primary' : 'secondary'}
            onPress={() => setTipo('despesa')}
            style={{ flex: 1 }}
          />
          <PrimaryButton
            label="Receita"
            size="sm"
            variant={tipo === 'receita' ? 'primary' : 'secondary'}
            onPress={() => setTipo('receita')}
            style={{ flex: 1 }}
          />
        </View>
        {tipo === 'despesa' ? (
          <ExpenseCategoryChips value={categoria} onChange={setCategoria} />
        ) : null}
        <PrimaryButton label="Incluir na planilha" onPress={() => void addRow()} />
        {msg ? (
          <Text variant="caption" color={colors.axel}>
            {msg}
          </Text>
        ) : null}
      </Card>
      <Card tone="elevated" style={{ gap: 8 }}>
        <Text variant="section">Lançamentos</Text>
        {txs.slice(0, 40).map((t) => (
          <View
            key={t.id}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              gap: 8,
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: colors.hairline,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" numberOfLines={1}>
                {t.titulo}
              </Text>
              <Text variant="caption" muted>
                {t.data} · {FINANCE_CATEGORY_LABELS[t.categoria] ?? t.categoria}
              </Text>
            </View>
            <Text
              variant="bodyStrong"
              color={t.tipo === 'receita' ? colors.health : colors.finance}
            >
              {t.tipo === 'receita' ? '+' : '−'}
              {formatBRL(t.valor)}
            </Text>
          </View>
        ))}
      </Card>
    </View>
  )
}
