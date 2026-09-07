import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { defaultRoutines, type RoutineHabit, type RoutineLogs } from '@simply-life/shared'

const ITEMS_KEY = 'simply-life-routines-v1'
const LOGS_KEY = 'simply-life-routine-logs-v1'

function storageGet(key: string): string | null
{
  try
  {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined')
    {
      return localStorage.getItem(key)
    }
  }
  catch
  {
    return null
  }
  return null
}

async function storageRead(key: string): Promise<string | null>
{
  const web = storageGet(key)
  if (web != null) return web
  try
  {
    return await SecureStore.getItemAsync(key)
  }
  catch
  {
    return null
  }
}

async function storageWrite(key: string, value: string): Promise<void>
{
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined')
  {
    localStorage.setItem(key, value)
    return
  }
  await SecureStore.setItemAsync(key, value)
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
