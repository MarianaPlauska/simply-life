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

// ---------------------------------------------------------------------------
// Importação sem duplicar (Etapa 1 de integridade)
// Cada linha ganha uma "impressão digital": data + valor + descrição normalizada
// + tipo + ordem de aparição. Reimportar o mesmo extrato não duplica; duas
// compras iguais no mesmo dia (dois cafés de R$ 8) continuam sendo duas.
// ---------------------------------------------------------------------------

function normText(v: string): string
{
  return (v || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function baseKey(r: { data: string; valor: number; descricao: string; tipo: string }): string
{
  return `${r.data.slice(0, 10)}|${Math.round(Math.abs(r.valor) * 100)}|${normText(r.descricao)}|${r.tipo}`
}

/** Hash curto e estável (FNV-1a 32 bits, em base 36). */
function fnv1a(text: string): string
{
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1)
  {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(36)
}

export function importRowHash(row: { data: string; valor: number; descricao: string; tipo: string }, occurrence: number): string
{
  const key = `${baseKey(row)}#${occurrence}`
  return `imp1-${fnv1a(key)}-${key.length.toString(36)}`
}

export type ImportPlan = {
  toInsert: { row: ImportedTransactionRow; hash: string }[]
  duplicates: ImportedTransactionRow[]
}

/**
 * Separa o que é novo do que já existe. `existing` são os lançamentos já no app
 * (comparados pela mesma chave, contando repetições legítimas).
 */
export function planImport(
  rows: ImportedTransactionRow[],
  existing: { data: string; valor: number; titulo: string; tipo: string }[],
): ImportPlan
{
  const have = new Map<string, number>()
  for (const t of existing)
  {
    const k = baseKey({ data: t.data, valor: t.valor, descricao: t.titulo, tipo: t.tipo })
    have.set(k, (have.get(k) ?? 0) + 1)
  }
  const seen = new Map<string, number>()
  const plan: ImportPlan = { toInsert: [], duplicates: [] }
  for (const row of rows)
  {
    const k = baseKey(row)
    const n = (seen.get(k) ?? 0) + 1
    seen.set(k, n)
    // a n-ésima ocorrência desta linha já existe no app? então é repetição do mesmo extrato
    if (n <= (have.get(k) ?? 0)) plan.duplicates.push(row)
    else plan.toInsert.push({ row, hash: importRowHash(row, n) })
  }
  return plan
}

const CATEGORY_WORDS: [string, RegExp][] = [
  ['alimentacao', /\b(aliment|mercado|supermerc|restaurante|ifood|lanche|padaria|comida|delivery)/],
  ['transporte', /\b(transp|uber|99|combust|gasolina|onibus|metro|estacion|pedagio|carro)/],
  ['habitacao', /\b(moradia|aluguel|condominio|luz|energia|agua|gas|internet|casa|habita)/],
  ['saude', /\b(saude|farmacia|medic|consulta|exame|dentista|plano)/],
  ['educacao', /\b(educa|curso|escola|faculdade|livro|mensalidade)/],
  ['lazer', /\b(lazer|cinema|viagem|show|streaming|netflix|spotify|bar)/],
  ['compras', /\b(compra|loja|roupa|shopping|amazon|shopee|mercado livre)/],
]

/**
 * Texto de categoria vindo do CSV → categoria do app.
 * Aceita o id ('alimentacao'), o nome ('Alimentação'), categorias personalizadas
 * pelo nome, e palavras comuns do extrato do banco. Sem pista, 'outros'.
 */
export function mapImportedCategory(
  raw: string | null | undefined,
  known: { id: string; label: string }[] = [],
): string
{
  const t = normText(raw || '')
  if (!t) return 'outros'
  for (const k of known)
  {
    if (normText(k.id) === t || normText(k.label) === t) return k.id
  }
  for (const [id, re] of CATEGORY_WORDS)
  {
    if (re.test(t)) return id
  }
  return 'outros'
}
