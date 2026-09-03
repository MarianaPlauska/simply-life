import { useState } from 'react'
import { Platform, View } from 'react-native'
import { buildTransactionsCsv, parseTransactionsCsv } from '@simply-life/shared'
import { Card, Text, PrimaryButton, Field } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { useAuthStore } from '../../store/authStore'

export function FinanceCsvPanel()
{
  const { space, colors } = useTheme()
  const txs = useDataStore((s) => s.finance)
  const importFinanceRows = useDataStore((s) => s.importFinanceRows)
  const isGuest = useAuthStore((s) => s.isGuest)
  const [paste, setPaste] = useState('')
  const [msg, setMsg] = useState('')

  const exportCsv = () =>
  {
    const csv = buildTransactionsCsv(
      txs.map((t) => ({
        data: t.data,
        descricao: t.titulo,
        tipo: t.tipo,
        valor: t.valor,
        categoria: t.categoria,
      })),
    )
    if (Platform.OS === 'web' && typeof document !== 'undefined')
    {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'simply-life-financas.csv'
      a.click()
      URL.revokeObjectURL(url)
      setMsg('CSV baixado')
      return
    }
    setPaste(csv)
    setMsg('CSV gerado abaixo. Copie o texto.')
  }

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
    <Card tone="elevated" style={{ gap: space.md }}>
      <Text variant="section">Importar / exportar CSV</Text>
      <Text variant="caption" muted>
        Separador ponto e vírgula. Cole o arquivo ou baixe o extrato.
      </Text>
      <PrimaryButton label="Exportar CSV" variant="secondary" onPress={exportCsv} />
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
  )
}
