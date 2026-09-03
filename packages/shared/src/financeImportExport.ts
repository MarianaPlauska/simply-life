/** Import/export CSV de transações - sem DOM (download fica no app) */

export type CsvFinanceTx = {
  data: string
  descricao: string
  tipo: string
  valor: number
  categoria?: string | null
  forma_pagamento?: string | null
  status_pagamento?: string | null
}

export interface ImportedTransactionRow
{
  descricao: string
  valor: number
  tipo: 'receita' | 'despesa'
  data: string
  categoria?: string
}

function escapeCsv(value: string): string
{
  if (value.includes(';') || value.includes('"') || value.includes('\n'))
  {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

const fmtDate = (iso: string) => iso.slice(0, 10)

/** Gera string CSV (com BOM) pronta para download/compartilhar */
export function buildTransactionsCsv(transactions: CsvFinanceTx[]): string
{
  const header = ['data', 'descricao', 'tipo', 'valor', 'categoria', 'forma_pagamento', 'status']
  const rows = [...transactions]
    .sort((a, b) => b.data.localeCompare(a.data))
    .map((t) => [
      fmtDate(t.data),
      escapeCsv(t.descricao),
      t.tipo,
      String(t.valor).replace('.', ','),
      escapeCsv(t.categoria ?? ''),
      t.forma_pagamento ?? '',
      t.status_pagamento ?? '',
    ])

  return '\uFEFF' + [header.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
}

export function parseTransactionsCsv(text: string): ImportedTransactionRow[]
{
  const lines = text.trim().split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []

  const sep = lines[0].includes(';') ? ';' : ','
  const header = lines[0].toLowerCase().split(sep).map((h) => h.trim())

  const idx = {
    data: header.findIndex((h) => h.includes('data') || h === 'date'),
    desc: header.findIndex((h) => h.includes('desc') || h.includes('hist')),
    valor: header.findIndex((h) => h.includes('valor') || h.includes('amount')),
    tipo: header.findIndex((h) => h.includes('tipo') || h === 'type'),
    cat: header.findIndex((h) => h.includes('categ')),
  }

  const out: ImportedTransactionRow[] = []

  for (let i = 1; i < lines.length; i++)
  {
    const cols = lines[i].split(sep).map((c) => c.trim().replace(/^"|"$/g, ''))
    const rawVal = cols[idx.valor >= 0 ? idx.valor : 3] ?? '0'
    const valor = Math.abs(parseFloat(rawVal.replace(/\./g, '').replace(',', '.')) || 0)
    if (valor <= 0) continue

    const desc = cols[idx.desc >= 0 ? idx.desc : 1] ?? 'Importado'
    let data = cols[idx.data >= 0 ? idx.data : 0] ?? ''
    if (data.includes('/'))
    {
      const [d, m, y] = data.split('/')
      data = `${y.length === 2 ? `20${y}` : y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }

    const tipoRaw = (cols[idx.tipo >= 0 ? idx.tipo : 2] ?? '').toLowerCase()
    const tipo: 'receita' | 'despesa' = tipoRaw.includes('rece') || rawVal.startsWith('+')
      ? 'receita'
      : 'despesa'

    out.push({
      descricao: desc,
      valor,
      tipo,
      data: data || new Date().toISOString().slice(0, 10),
      categoria: idx.cat >= 0 ? cols[idx.cat] : undefined,
    })
  }

  return out
}
