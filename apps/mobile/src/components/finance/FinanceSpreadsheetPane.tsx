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
import { Panel } from '../../ui/Panel'
import { useWebDesk } from '../dashboard/web/webBox'
import { useFinanceDeskGrid } from './desk/deskLayout'
import { DeskPanelHeader } from './desk/DeskPanelHeader'
import { FinanceTxTable } from './desk/FinanceTxTable'
import { FinanceTxEditSheet } from './FinanceTxEditSheet'

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
  const desk = useWebDesk()
  const deskGrid = useFinanceDeskGrid()
  const [editingTx, setEditingTx] = useState<string | null>(null)

  const addRow = async () =>
  {
    const v = Number(valor.replace(',', '.'))
    if (!desc.trim() || !Number.isFinite(v) || v <= 0)
    {
      setMsg('Informe descrição e valor')
      return
    }
    // lançamento manual: a pessoa quer mesmo, então não deduplica
    await importFinanceRows(
      [{ descricao: desc.trim(), valor: v, tipo, data, categoria }],
      isGuest,
      { dedupe: false },
    )
    setDesc('')
    setValor('')
    setCategoria('outros')
    setMsg('Linha adicionada')
  }

  // computador: o campo fica no tom da página para aparecer dentro do painel
  const fieldStyle = desk ? { backgroundColor: colors.canvas } : undefined
  const offVariant = desk ? ('ghost' as const) : ('secondary' as const)
  const form = (
    <>
        <Field label="Descrição" value={desc} onChangeText={setDesc} style={fieldStyle} />
        <Field
          label="Valor"
          keyboardType="decimal-pad"
          value={valor}
          onChangeText={setValor}
          style={fieldStyle}
        />
        <Field label="Data (YYYY-MM-DD)" value={data} onChangeText={setData} style={fieldStyle} />
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <PrimaryButton
            label="Despesa"
            size="sm"
            variant={tipo === 'despesa' ? 'primary' : offVariant}
            onPress={() => setTipo('despesa')}
            style={{ flex: 1 }}
          />
          <PrimaryButton
            label="Receita"
            size="sm"
            variant={tipo === 'receita' ? 'primary' : offVariant}
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
    </>
  )

  // computador: formulário numa coluna, a planilha (tabela) nas outras duas
  if (desk)
  {
    return (
      <View style={deskGrid.grid}>
        <Panel>
          <View style={{ gap: space.sm }}>
            <DeskPanelHeader title="Nova linha" subtitle="Lançamento manual, sem duplicar" />
            {form}
          </View>
        </Panel>
        <Panel style={deskGrid.span2}>
          <View>
            <DeskPanelHeader title="Lançamentos" subtitle={`${Math.min(txs.length, 40)} mais recentes`} />
            <FinanceTxTable rows={txs.slice(0, 40)} onPress={setEditingTx} />
          </View>
        </Panel>
        <FinanceTxEditSheet txId={editingTx} onClose={() => setEditingTx(null)} />
      </View>
    )
  }

  return (
    <View style={{ gap: space.md }}>
      <Card tone="elevated" style={{ gap: space.sm }}>
        <Text variant="section">Nova linha</Text>
        {form}
      </Card>
      <Card tone="elevated" style={{ gap: 12 }}>
        <Text variant="section">Lançamentos</Text>
        {txs.slice(0, 40).map((t) => (
          <View
            key={t.id}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              gap: 12,
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
              {t.tipo === 'receita' ? '+' : '-'}
              {formatBRL(t.valor)}
            </Text>
          </View>
        ))}
      </Card>
    </View>
  )
}
