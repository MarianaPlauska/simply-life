import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { folderSeriesFromStored, type UserTaskList } from '@simply-life/shared'

/**
 * Pastas hoje ficam só no aparelho. Se um dia sincronizarem com o banco, a coluna
 * de cor tem que ser TEXT (guarda a chave da paleta, não hex), como as `cor` de
 * labels, fin_categorias, fin_metas, fin_contas_fixas e contextos
 * (supabase/migrations/062_cores_paleta_texto.sql). Leia com `folderSeriesFromStored`.
 */
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
        // Hex antigo (ou ausente) vira chave da paleta; gravado de volta em `loadKanbanLists`.
        color: folderSeriesFromStored(item.color, i),
        notas: typeof item.notas === 'string' ? item.notas : '',
        createdAt: typeof item.createdAt === 'string' ? item.createdAt : undefined,
      }
    })
}

/** Houve troca de hex antigo por chave? Então vale regravar. */
function needsWriteBack(raw: unknown, lists: UserTaskList[]): boolean
{
  if (!Array.isArray(raw)) return false
  return lists.some((list, i) =>
  {
    const item = raw[i] as Record<string, unknown> | undefined
    return !item || item.color !== list.color
  })
}

async function readRaw(): Promise<string | null>
{
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') return localStorage.getItem(KEY)
  return SecureStore.getItemAsync(KEY)
}

/**
 * Migração preguiçosa: normaliza cores antigas (hex) para chaves da paleta
 * ao carregar e já grava de volta, sem precisar de migração no servidor.
 */
export async function loadKanbanLists(): Promise<UserTaskList[]>
{
  try
  {
    const raw = await readRaw()
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    const lists = normalize(parsed)
    if (needsWriteBack(parsed, lists)) void saveKanbanLists(lists).catch(() => undefined)
    return lists
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
