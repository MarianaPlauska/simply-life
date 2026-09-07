import { FINANCE_CATEGORY_LABELS, type FinanceTx } from './finance'
import type { MobileTask } from './tasks'

export type HomeSearchHit =
  | { kind: 'task'; id: string; title: string; subtitle: string; score: number }
  | { kind: 'finance'; id: string; title: string; subtitle: string; score: number }

/** Remove acentos e normaliza para comparação tolerante. */
export function normalizeSearchText(raw: string): string
{
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function searchQueryTokens(query: string): string[]
{
  return normalizeSearchText(query)
    .split(/\s+/)
    .filter((t) => t.length > 0)
}

function scoreHaystack(haystack: string, tokens: string[]): number
{
  const norm = normalizeSearchText(haystack)
  if (!norm || tokens.length === 0) return 0

  let score = 0
  const words = norm.split(/\s+/).filter(Boolean)

  for (const token of tokens)
  {
    if (norm.includes(token))
    {
      score += token.length >= 4 ? 14 : 10
      continue
    }
    if (words.some((w) => w.startsWith(token)))
    {
      score += 6
      continue
    }
    if (token.length >= 3 && words.some((w) => w.includes(token)))
    {
      score += 3
    }
  }

  return score
}

export function searchHomeItems(
  query: string,
  tasks: MobileTask[],
  finance: FinanceTx[],
  limit = 12,
): HomeSearchHit[]
{
  const tokens = searchQueryTokens(query)
  if (tokens.length === 0) return []

  const hits: HomeSearchHit[] = []

  for (const task of tasks)
  {
    const blob = [
      task.titulo,
      task.anotacao,
      task.checklist.map((c) => c.texto).join(' '),
    ].join(' ')
    const score = scoreHaystack(blob, tokens)
    if (score <= 0) continue
    hits.push({
      kind: 'task',
      id: task.id,
      title: task.titulo,
      subtitle: task.status === 'done' ? 'Tarefa · concluída' : 'Tarefa',
      score,
    })
  }

  for (const tx of finance)
  {
    const catLabel = FINANCE_CATEGORY_LABELS[tx.categoria as keyof typeof FINANCE_CATEGORY_LABELS]
      ?? tx.categoria
    const blob = [tx.titulo, catLabel, tx.tipo, String(tx.valor)].join(' ')
    const score = scoreHaystack(blob, tokens)
    if (score <= 0) continue
    hits.push({
      kind: 'finance',
      id: tx.id,
      title: tx.titulo,
      subtitle: `${tx.tipo === 'receita' ? 'Receita' : 'Gasto'} · ${catLabel}`,
      score,
    })
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, limit)
}
