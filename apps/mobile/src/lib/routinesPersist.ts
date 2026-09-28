import { readPersisted, writePersisted } from './persistStorage'
import {
  defaultRoutines,
  normalizeLegacyRoutines,
  type RoutineHabit,
  type RoutineLogs,
} from '@simply-life/shared'

const ITEMS_KEY = 'simply-life-routines-v1'
const LOGS_KEY = 'simply-life-routine-logs-v1'

/** Arquivo no nativo (logs crescem além do limite do SecureStore); migra o que estava no SecureStore. */
function storageRead(key: string): Promise<string | null>
{
  return readPersisted(key, true)
}

function storageWrite(key: string, value: string): Promise<void>
{
  return writePersisted(key, value)
}

function parseItems(raw: string | null): RoutineHabit[] | null
{
  if (!raw) return null
  try
  {
    const parsed = JSON.parse(raw) as RoutineHabit[]
    return Array.isArray(parsed) ? parsed : null
  }
  catch
  {
    return null
  }
}

export async function loadRoutines(): Promise<{ items: RoutineHabit[]; logs: RoutineLogs }>
{
  const itemsRaw = await storageRead(ITEMS_KEY)
  const logsRaw = await storageRead(LOGS_KEY)
  let items = parseItems(itemsRaw)
  if (!items)
  {
    items = defaultRoutines()
    await saveRoutineItems(items)
  }
  else
  {
    const normalized = normalizeLegacyRoutines(items)
    if (JSON.stringify(normalized) !== JSON.stringify(items))
    {
      items = normalized
      await saveRoutineItems(items)
    }
  }
  let logs: RoutineLogs = {}
  try
  {
    logs = logsRaw ? (JSON.parse(logsRaw) as RoutineLogs) : {}
  }
  catch
  {
    logs = {}
  }
  return { items, logs }
}

export async function saveRoutineItems(items: RoutineHabit[]): Promise<void>
{
  await storageWrite(ITEMS_KEY, JSON.stringify(items))
}

export async function saveRoutineLogs(logs: RoutineLogs): Promise<void>
{
  await storageWrite(LOGS_KEY, JSON.stringify(logs))
}
