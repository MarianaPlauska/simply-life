import { Platform, Share } from 'react-native'
import {
  buildFinanceExcelXml,
  buildFinancePdfHtml,
  buildTransactionsCsv,
  financeTxsToExportRows,
  type FinanceTx,
} from '@simply-life/shared'

function folderNameLookup(lists: { id: string; name: string }[])
{
  return (folderId?: string) => lists.find((l) => l.id === folderId)?.name ?? ''
}

function csvOf(txs: FinanceTx[], lists: { id: string; name: string }[])
{
  const rows = financeTxsToExportRows(txs, folderNameLookup(lists))
  return buildTransactionsCsv(
    rows.map((r) => ({
      data: r.data,
      descricao: r.descricao,
      tipo: r.tipo,
      valor: r.valor,
      categoria: r.categoria,
      forma_pagamento: r.formaPagamento,
      status_pagamento: r.pasta ? `pasta:${r.pasta}` : null,
    })),
  )
}

function downloadWeb(content: string, filename: string, mime: string)
{
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

async function shareOrCopy(content: string, filename: string, mime: string): Promise<string>
{
  if (Platform.OS === 'web' && typeof document !== 'undefined')
  {
    downloadWeb(content, filename, mime)
    return `${filename} baixado`
  }
  await Share.share({ message: content, title: filename })
  return 'Pronto para colar ou salvar no app de arquivos'
}

export async function exportFinanceCsv(
  txs: FinanceTx[],
  lists: { id: string; name: string }[],
  filename = 'simply-life-gastos.csv',
): Promise<string>
{
  return shareOrCopy(csvOf(txs, lists), filename, 'text/csv;charset=utf-8')
}

export async function exportFinanceExcel(
  txs: FinanceTx[],
  lists: { id: string; name: string }[],
  filename = 'simply-life-gastos.xls',
): Promise<string>
{
  const xml = buildFinanceExcelXml(financeTxsToExportRows(txs, folderNameLookup(lists)))
  return shareOrCopy(xml, filename, 'application/vnd.ms-excel')
}

export async function exportFinancePdf(
  txs: FinanceTx[],
  lists: { id: string; name: string }[],
  title = 'Gastos — Simply Life',
): Promise<string>
{
  const html = buildFinancePdfHtml(financeTxsToExportRows(txs, folderNameLookup(lists)), title)
  if (Platform.OS === 'web' && typeof window !== 'undefined')
  {
    const w = window.open('', '_blank')
    if (w)
    {
      w.document.write(html)
      w.document.close()
      w.focus()
      w.print()
      return 'Abra a caixa de impressão e salve como PDF'
    }
  }
  try
  {
    const Print = await import('expo-print')
    const Sharing = await import('expo-sharing')
    const printed = await Print.printToFileAsync({ html })
    if (printed.uri && (await Sharing.isAvailableAsync()))
    {
      await Sharing.shareAsync(printed.uri, { UTI: 'com.adobe.pdf', mimeType: 'application/pdf' })
      return 'PDF pronto para compartilhar'
    }
  }
  catch
  {
    /* expo-print opcional — cai no HTML */
  }
  return shareOrCopy(html, 'simply-life-gastos.html', 'text/html')
}
