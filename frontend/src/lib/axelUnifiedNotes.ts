// Diário + anotações - contexto unificado para veredito AXEL e carta de ontem

export type UnifiedNoteSource = 'diario' | 'anotacao'

export interface UnifiedNoteEntry
{
  source: UnifiedNoteSource
  isoDate: string
  text: string
  updatedAt: string
}

interface AnotacaoLike
{
  conteudo?: string | null
  titulo?: string | null
  updated_at?: string | null
  created_at?: string | null
}

interface EntradaDiarioLike
{
  data?: string | null
  conteudo?: string | null
  created_at?: string | null
}

function noteTextFromAnotacao(n: AnotacaoLike): string
{
  return `${n.titulo ?? ''} ${n.conteudo ?? ''}`.trim()
}

function isoFromAnotacao(n: AnotacaoLike): string
{
  const raw = n.updated_at ?? n.created_at
  if (raw) return raw.slice(0, 10)
  return new Date().toISOString().slice(0, 10)
}

/** Mescla diário e anotações ordenados por recência */
export function buildUnifiedNoteEntries(
  anotacoes: AnotacaoLike[] | null | undefined,
  entradas: EntradaDiarioLike[] | null | undefined,
  limit = 8,
): UnifiedNoteEntry[]
{
  const entries: UnifiedNoteEntry[] = []
  const notes = anotacoes ?? []
  const diary = entradas ?? []

  for (const n of notes)
  {
    const text = noteTextFromAnotacao(n)
    if (!text) continue
    entries.push({
      source: 'anotacao',
      isoDate: isoFromAnotacao(n),
      text,
      updatedAt: n.updated_at ?? n.created_at ?? '',
    })
  }

  for (const e of diary)
  {
    const text = e.conteudo?.trim()
    if (!text) continue
    entries.push({
      source: 'diario',
      isoDate: e.data ?? e.created_at?.slice(0, 10) ?? '',
      text,
      updatedAt: e.created_at ?? e.data ?? '',
    })
  }

  entries.sort((a, b) =>
  {
    const da = a.updatedAt || a.isoDate
    const db = b.updatedAt || b.isoDate
    return db.localeCompare(da)
  })

  return entries.slice(0, limit)
}

/** Snippet curto para o motor de veredito */
export function buildUnifiedNoteSnippet(
  anotacoes: AnotacaoLike[],
  entradas: EntradaDiarioLike[],
  limit = 4,
  maxChars = 320,
): string
{
  const parts = buildUnifiedNoteEntries(anotacoes, entradas, limit).map((e) =>
  {
    const tag = e.source === 'diario' ? 'diário' : 'nota'
    return `[${tag}] ${e.text}`
  })
  return parts.join(' · ').slice(0, maxChars)
}

/** Texto do dia (ontem ou qualquer ISO) - diário tem prioridade sobre anotação */
export function findUnifiedNoteForDate(
  iso: string,
  anotacoes: AnotacaoLike[] | null | undefined,
  entradas: EntradaDiarioLike[] | null | undefined,
): { text: string; source: UnifiedNoteSource } | null
{
  const diaryRows = entradas ?? []
  const noteRows = anotacoes ?? []
  const diary = diaryRows.find((e) => e.data === iso)
  if (diary?.conteudo?.trim())
  {
    return { text: diary.conteudo.trim(), source: 'diario' }
  }

  const notesOnDay = noteRows
    .map((n) =>
    {
      const text = noteTextFromAnotacao(n)
      if (!text) return null
      if (isoFromAnotacao(n) !== iso) return null
      return { text, updatedAt: n.updated_at ?? n.created_at ?? '' }
    })
    .filter((x): x is { text: string; updatedAt: string } => x != null)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  if (notesOnDay[0])
  {
    return { text: notesOnDay[0].text, source: 'anotacao' }
  }

  return null
}
