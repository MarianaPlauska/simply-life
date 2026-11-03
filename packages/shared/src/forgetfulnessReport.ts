/**
 * Custo do esquecimento: taxa, assinatura repetida e lançamento dobrado.
 * Só lê. Não cancela nada e não muda o saldo.
 */

export type ForgetTx = {
  id: string
  titulo: string
  valor: number
  data: string
  tipo: string
  fixaId?: string | null
}

export type ForgetItem = {
  kind: 'taxa' | 'assinatura' | 'repetido'
  titulo: string
  detalhe: string
}

const TAX_RE = /\b(multa|juros|anuidade|tarifa|iof|encargo)\b/i

function fold(value: string): string
{
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\d+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function monthOf(iso: string): string
{
  return iso.slice(0, 7)
}

export function forgetfulnessReport(txs: ForgetTx[]): ForgetItem[]
{
  const expenses = txs.filter((tx) => tx.tipo === 'despesa' && tx.valor > 0)
  const out: ForgetItem[] = []

  for (const tx of expenses)
  {
    if (!TAX_RE.test(tx.titulo)) continue
    out.push({
      kind: 'taxa',
      titulo: tx.titulo,
      detalhe: 'Parece taxa, juros ou tarifa. Vale conferir se ainda faz sentido.',
    })
  }

  const groups = new Map<string, ForgetTx[]>()
  for (const tx of expenses)
  {
    if (tx.fixaId) continue
    const key = fold(tx.titulo)
    if (key.length < 4) continue
    const list = groups.get(key) ?? []
    list.push(tx)
    groups.set(key, list)
  }

  for (const [key, list] of groups)
  {
    const months = new Set(list.map((tx) => monthOf(tx.data)))
    if (months.size < 2) continue
    const values = list.map((tx) => tx.valor).sort((a, b) => a - b)
    const mid = values[Math.floor(values.length / 2)] ?? 0
    const close = values.every((value) => mid === 0 || Math.abs(value - mid) / mid <= 0.2)
    if (!close) continue
    out.push({
      kind: 'assinatura',
      titulo: list[0]?.titulo || key,
      detalhe: `Valor parecido em ${months.size} meses. Pode ser uma assinatura ainda ativa.`,
    })
  }

  const sameDay = new Map<string, ForgetTx[]>()
  for (const tx of expenses)
  {
    const key = `${tx.data.slice(0, 10)}|${fold(tx.titulo)}|${tx.valor.toFixed(2)}`
    const list = sameDay.get(key) ?? []
    list.push(tx)
    sameDay.set(key, list)
  }
  for (const list of sameDay.values())
  {
    if (list.length < 2) continue
    out.push({
      kind: 'repetido',
      titulo: list[0]?.titulo ?? 'Gasto',
      detalhe: 'O mesmo valor apareceu mais de uma vez neste dia.',
    })
  }

  return out.slice(0, 8)
}
