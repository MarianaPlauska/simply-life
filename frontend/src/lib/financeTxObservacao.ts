const STORAGE_KEY = 'finance-tx-observacao-v1'

type NoteMap = Record<string, string>

function loadMap(): NoteMap
{
  try
  {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as NoteMap
  }
  catch
  {
    return {}
  }
}

function saveMap(map: NoteMap): void
{
  try
  {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  }
  catch { /* quota */ }
}

/** Fallback local quando a coluna observacao ainda não existe no Supabase */
export function getTxObservacaoLocal(id: number): string | undefined
{
  return loadMap()[String(id)]
}

export function setTxObservacaoLocal(id: number, note: string): void
{
  const map = loadMap()
  const key = String(id)
  const trimmed = note.trim()
  if (!trimmed)
  {
    delete map[key]
  }
  else
  {
    map[key] = trimmed
  }
  saveMap(map)
}

export function mergeTxObservacao(id: number, fromDb?: string | null): string | undefined
{
  const db = fromDb?.trim()
  if (db) return db
  return getTxObservacaoLocal(id)
}
