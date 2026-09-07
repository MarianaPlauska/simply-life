import { useState } from 'react'
import { View } from 'react-native'
import {
  cashExpenseTotal,
  creditExpenseTotal,
  formatBRL,
  monthExpenseTotal,
  monthIncomeTotal,
  rankCategoriesBySpend,
  type FinanceTx,
} from '@simply-life/shared'
import { Card, Text, SectionHeader, PrimaryButton } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useKanbanListsStore } from '../../store/kanbanListsStore'
import {
  exportFinanceCsv,
  exportFinanceExcel,
  exportFinancePdf,
} from '../../lib/shareFinanceExport'

type Props = {
  txs: FinanceTx[]
  title: string
}

/** Relatório + exportação de uma pasta (ou do extrato inteiro). */
export function FinanceExportBar({ txs, title }: Props)
{
  const { colors, space } = useTheme()
  const lists = useKanbanListsStore((s) => s.lists)
  const [msg, setMsg] = useState('')
  const receitas = monthIncomeTotal(txs)
  const gastos = monthExpenseTotal(txs)
  const naConta = cashExpenseTotal(txs)
  const noCartao = creditExpenseTotal(txs)
  const top = rankCategoriesBySpend(txs)[0]

  const run = async (kind: 'pdf' | 'xls' | 'csv') =>
  {
    setMsg('')
    try
    {
      const next =
        kind === 'pdf'
          ? await exportFinancePdf(txs, lists, title)
          : kind === 'xls'
            ? await exportFinanceExcel(txs, lists)
            : await exportFinanceCsv(txs, lists)
      setMsg(next)
    }
    catch (e)
    {
      setMsg(e instanceof Error ? e.message : 'Não foi possível exportar')
    }
  }

  return (
    <Card tone="elevated" style={{ gap: space.sm }}>
      <SectionHeader title={title} subtitle="Histórico desta pasta" />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="caption" muted>
            Receita
          </Text>
          <Text variant="bodyStrong" color={colors.health}>
            {formatBRL(receitas)}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="caption" muted>
            Saiu da conta
          </Text>
          <Text variant="bodyStrong" color={colors.finance}>
            {formatBRL(naConta)}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="caption" muted>
            No cartão
          </Text>
          <Text variant="bodyStrong">{formatBRL(noCartao)}</Text>
        </View>
      </View>
      <Text variant="caption" muted>
        Total lançado {formatBRL(gastos)}
        {top ? ` · mais em ${top.label}` : ''}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <PrimaryButton label="PDF" size="sm" variant="secondary" onPress={() => void run('pdf')} />
        <PrimaryButton label="Excel" size="sm" variant="secondary" onPress={() => void run('xls')} />
        <PrimaryButton label="CSV" size="sm" variant="ghost" onPress={() => void run('csv')} />
      </View>
      {msg ? (
        <Text variant="caption" color={colors.axel}>
          {msg}
        </Text>
      ) : null}
    </Card>
  )
}
