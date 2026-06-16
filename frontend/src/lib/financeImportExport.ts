import type { Transaction } from '../store/storeTypes'

// Export CSV/PDF e import CSV de transações

const fmtDate = (iso: string) => iso.slice(0, 10)

export function exportTransactionsCsv(transactions: Transaction[], filename?: string): void
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

  const csv = [header.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  downloadBlob(blob, filename ?? `simply-life-${fmtDate(new Date().toISOString())}.csv`)
}

function escapeCsv(value: string): string
{
  if (value.includes(';') || value.includes('"') || value.includes('\n'))
  {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function exportTransactionsPrintable(
  transactions: Transaction[],
  monthLabel: string,
): void
{
  const rows = [...transactions].sort((a, b) => b.data.localeCompare(a.data))
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Simply-Life ${monthLabel}</title>
<style>
body{font-family:system-ui,sans-serif;padding:24px;color:#111}
h1{font-size:18px} table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px}
th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left}
th{font-size:10px;text-transform:uppercase;color:#666}
.num{text-align:right;font-variant-numeric:tabular-nums}
</style></head><body>
<h1>Simply-Life — ${monthLabel}</h1>
<p>${rows.length} lançamentos</p>
<table><thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th class="num">Valor</th><th>Categoria</th></tr></thead><tbody>
${rows.map((t) => `<tr>
<td>${fmtDate(t.data)}</td><td>${t.descricao}</td><td>${t.tipo}</td>
<td class="num">${t.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
<td>${t.categoria ?? ''}</td></tr>`).join('')}
</tbody></table>
<script>window.onload=()=>{window.print()}</script>
</body></html>`

  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(html)
  w.document.close()
}

export interface ImportedTransactionRow
{
  descricao: string
  valor: number
  tipo: 'receita' | 'despesa'
  data: string
  categoria?: string
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

function downloadBlob(blob: Blob, filename: string): void
{
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
