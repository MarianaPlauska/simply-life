import type { FinanceTx } from './finance'
import { formatBRL } from './finance'

export type FinanceExportRow = {
  data: string
  descricao: string
  tipo: string
  valor: number
  categoria?: string | null
  pasta?: string | null
  formaPagamento?: string | null
}

function xmlEscape(value: string): string
{
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function htmlEscape(value: string): string
{
  return xmlEscape(value).replace(/'/g, '&#39;')
}

export function financeTxsToExportRows(
  txs: FinanceTx[],
  folderNameOf?: (folderId?: string) => string,
): FinanceExportRow[]
{
  return [...txs]
    .sort((a, b) => b.data.localeCompare(a.data))
    .map((t) => ({
      data: t.data.slice(0, 10),
      descricao: t.titulo,
      tipo: t.tipo,
      valor: t.valor,
      categoria: t.categoria,
      pasta: t.folderId ? (folderNameOf?.(t.folderId) ?? t.folderId) : '',
      formaPagamento: t.formaPagamento ?? (t.cardId ? 'cartao' : ''),
    }))
}

/** Planilha XML que o Excel abre nativamente (.xls). */
export function buildFinanceExcelXml(rows: FinanceExportRow[], sheetName = 'Gastos'): string
{
  const cellS = (v: string) => `<Cell><Data ss:Type="String">${xmlEscape(v)}</Data></Cell>`
  const cellN = (n: number) => `<Cell><Data ss:Type="Number">${n}</Data></Cell>`
  const header = ['Data', 'Descrição', 'Tipo', 'Valor', 'Categoria', 'Pasta', 'Pagamento']
  const body = rows
    .map(
      (r) =>
        `<Row>${cellS(r.data)}${cellS(r.descricao)}${cellS(r.tipo)}${cellN(r.valor)}${cellS(r.categoria ?? '')}${cellS(r.pasta ?? '')}${cellS(r.formaPagamento ?? '')}</Row>`,
    )
    .join('')

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="${xmlEscape(sheetName)}">
  <Table>
   <Row>${header.map(cellS).join('')}</Row>
   ${body}
  </Table>
 </Worksheet>
</Workbook>`
}

/** HTML para PDF / impressão — acompanhamento pessoal. */
export function buildFinancePdfHtml(
  rows: FinanceExportRow[],
  title = 'Gastos — Simply Life',
): string
{
  const totalDespesa = rows.filter((r) => r.tipo === 'despesa').reduce((a, r) => a + r.valor, 0)
  const totalReceita = rows.filter((r) => r.tipo === 'receita').reduce((a, r) => a + r.valor, 0)
  const tr = rows
    .map(
      (r) => `<tr>
        <td>${htmlEscape(r.data)}</td>
        <td>${htmlEscape(r.descricao)}</td>
        <td>${htmlEscape(r.tipo)}</td>
        <td style="text-align:right">${htmlEscape(formatBRL(r.valor))}</td>
        <td>${htmlEscape(r.categoria ?? '')}</td>
        <td>${htmlEscape(r.pasta ?? '')}</td>
      </tr>`,
    )
    .join('')

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"/>
<title>${htmlEscape(title)}</title>
<style>
  body { font-family: Georgia, serif; color: #2A2622; margin: 32px; }
  h1 { font-size: 22px; margin: 0 0 8px; }
  p { color: #6B645C; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
  th { text-align: left; border-bottom: 2px solid #E8734A; padding: 8px 6px; }
  td { border-bottom: 1px solid #E8E0D6; padding: 8px 6px; }
</style></head>
<body>
  <h1>${htmlEscape(title)}</h1>
  <p>Receitas ${htmlEscape(formatBRL(totalReceita))} · Gastos ${htmlEscape(formatBRL(totalDespesa))} · ${rows.length} lançamentos</p>
  <table>
    <thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th>Valor</th><th>Categoria</th><th>Pasta</th></tr></thead>
    <tbody>${tr}</tbody>
  </table>
</body></html>`
}
