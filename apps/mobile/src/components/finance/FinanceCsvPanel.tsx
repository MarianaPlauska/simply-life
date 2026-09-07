import { useState } from 'react'
import { View } from 'react-native'
import { parseTransactionsCsv } from '@simply-life/shared'
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

  const importCsv = async () =>
  {
    const rows = parseTransactionsCsv(paste)
    if (rows.length === 0)
    {
      setMsg('Nenhuma linha válida no CSV')
      return
    }
    const n = await importFinanceRows(rows, isGuest)
    setMsg(`${n} lançamento(s) importado(s)`)
  }

  return (
    <View style={{ gap: space.md }}>
      <FinanceExportBar txs={txs} title="Levar para uma planilha" />
      <Card tone="elevated" style={{ gap: space.md }}>
        <Text variant="section">Importar CSV</Text>
        <Text variant="caption" muted>
          Cole um extrato com ponto e vírgula para entrar nos lançamentos.
        </Text>
        <Field
          label="Colar CSV"
          value={paste}
          onChangeText={setPaste}
          multiline
          placeholder="data;descricao;tipo;valor"
        />
        <PrimaryButton label="Importar CSV" onPress={() => void importCsv()} />
        {msg ? (
          <Text variant="caption" color={colors.axel}>
            {msg}
          </Text>
        ) : null}
      </Card>
    </View>
  )
}
