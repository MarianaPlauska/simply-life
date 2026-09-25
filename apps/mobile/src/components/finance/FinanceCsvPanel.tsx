import { useState } from 'react'
import { View } from 'react-native'
import { mapImportedCategory, parseTransactionsCsv } from '@simply-life/shared'
import { useCategoryMetaStore } from '../../store/categoryMetaStore'
import { defaultCategoryMeta, visibleCategoryIds } from '../../lib/categoryMeta'
import { Card, Text, PrimaryButton, Field } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { useAuthStore } from '../../store/authStore'
import { FinanceExportBar } from './FinanceExportBar'

export function FinanceCsvPanel()
{
  const { space, colors } = useTheme()
  const txs = useDataStore((s) => s.finance)
  const importFinanceRows = useDataStore((s) => s.importFinanceRows)
  const isGuest = useAuthStore((s) => s.isGuest)
  const [paste, setPaste] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const catMap = useCategoryMetaStore((s) => s.map)

  const importCsv = async () =>
  {
    const rows = parseTransactionsCsv(paste)
    if (rows.length === 0)
    {
      setMsg('Nenhuma linha válida no CSV')
      return
    }
    // categoria do extrato ("Alimentação", "IFOOD"...) → categoria do app, para o orçamento contar
    const known = visibleCategoryIds(catMap).map((id) => ({ id, label: catMap[id]?.label ?? defaultCategoryMeta(id).label }))
    const mapped = rows.map((r) => ({ ...r, categoria: mapImportedCategory(r.categoria || r.descricao, known) }))
    setBusy(true)
    const res = await importFinanceRows(mapped, isGuest)
    setBusy(false)
    const parts = [`${res.imported} novo(s)`]
    if (res.duplicates) parts.push(`${res.duplicates} já existia(m) e não foi duplicado`)
    if (res.failed) parts.push(`${res.failed} com erro (tente de novo)`)
    setMsg(parts.join(' · '))
    if (!res.failed) setPaste('')
  }

  return (
    <View style={{ gap: space.md }}>
      <FinanceExportBar txs={txs} title="Levar para uma planilha" />
      <Card tone="elevated" style={{ gap: space.md }}>
        <Text variant="section">Importar CSV</Text>
        <Text variant="caption" muted>
          Cole um extrato com ponto e vírgula. Pode importar o mesmo extrato de novo: o que já existe não duplica.
        </Text>
        <Field
          label="Colar CSV"
          value={paste}
          onChangeText={setPaste}
          multiline
          placeholder="data;descricao;tipo;valor"
        />
        <PrimaryButton label="Importar CSV" loading={busy} onPress={() => void importCsv()} />
        {msg ? (
          <Text variant="caption" color={colors.axel}>
            {msg}
          </Text>
        ) : null}
      </Card>
    </View>
  )
}
