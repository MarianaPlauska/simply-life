// Preferências locais do drawer - bloqueio, lembrete e datas de início

export interface TaskDrawerPrefs
{
  blockedBy: number[]
  lembreteNoPrazo: boolean
  dataInicioPlanejada: string | null
  dataInicioReal: string | null
}

const STORAGE_KEY = 'axel-task-drawer-prefs-v1'

const EMPTY: TaskDrawerPrefs = {
  blockedBy: [],
  lembreteNoPrazo: false,
  dataInicioPlanejada: null,
  dataInicioReal: null,
}

function loadAll(): Record<number, TaskDrawerPrefs>
{
  try
  {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, TaskDrawerPrefs>
    const out: Record<number, TaskDrawerPrefs> = {}
    for (const [k, v] of Object.entries(parsed))
    {
      out[Number(k)] = {
        blockedBy: Array.isArray(v.blockedBy) ? v.blockedBy.map(Number) : [],
        lembreteNoPrazo: Boolean(v.lembreteNoPrazo),
        dataInicioPlanejada: v.dataInicioPlanejada ?? null,
        dataInicioReal: v.dataInicioReal ?? null,
      }
    }
    return out
  }
  catch
  {
    return {}
  }
}

function saveAll(data: Record<number, TaskDrawerPrefs>): void
{
  const flat: Record<string, TaskDrawerPrefs> = {}
  for (const [id, prefs] of Object.entries(data))
  {
    flat[String(id)] = prefs
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flat))
}

export function loadTaskDrawerPrefs(taskId: number): TaskDrawerPrefs
{
  if (taskId <= 0) return { ...EMPTY }
  return loadAll()[taskId] ?? { ...EMPTY }
}

export function saveTaskDrawerPrefs(taskId: number, partial: Partial<TaskDrawerPrefs>): TaskDrawerPrefs
{
  if (taskId <= 0) return { ...EMPTY }
  const all = loadAll()
  const next: TaskDrawerPrefs = { ...EMPTY, ...all[taskId], ...partial }
  all[taskId] = next
  saveAll(all)
  return next
}
