import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { FOLDER_PALETTE, type UserTaskList } from '@simply-life/shared'

const KEY = 'simply-life-kanban-lists'

function normalize(raw: unknown): UserTaskList[]
{
  if (!Array.isArray(raw)) return []
  return raw
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item, i) =>
    {
      const id = typeof item.id === 'string' ? item.id : `l${i}`
      const name = typeof item.name === 'string' ? item.name : 'Pasta'
      return {
        id,
        name,
        color: typeof item.color === 'string' ? item.color : FOLDER_PALETTE[i % FOLDER_PALETTE.length],
        notas: typeof item.notas === 'string' ? item.notas : '',
        createdAt: typeof item.createdAt === 'string' ? item.createdAt : undefined,
      }
    })
}

export async function loadKanbanLists(): Promise<UserTaskList[]>
{
  try
  {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined')
    {
      const raw = localStorage.getItem(KEY)
      return raw ? normalize(JSON.parse(raw)) : []
    }
    const raw = await SecureStore.getItemAsync(KEY)
    return raw ? normalize(JSON.parse(raw)) : []
  }
  catch
  {
    return []
  }
}

export async function saveKanbanLists(lists: UserTaskList[]): Promise<void>
{
  const payload = JSON.stringify(lists)
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined')
  {
    localStorage.setItem(KEY, payload)
    return
  }
  await SecureStore.setItemAsync(KEY, payload)
}
