/**
 * JSON local por chave, sem o limite de ~2KB do SecureStore:
 * arquivo no documentDirectory (nativo) · localStorage (web).
 */
import { Platform } from 'react-native'
import * as FileSystem from 'expo-file-system'

function fileFor(key: string): string | null
{
  return FileSystem.documentDirectory ? `${FileSystem.documentDirectory}${key}.json` : null
}

export async function readLocalJson<T>(key: string): Promise<T | null>
{
  try
  {
    if (Platform.OS === 'web')
    {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null
      return raw ? (JSON.parse(raw) as T) : null
    }
    const path = fileFor(key)
    if (!path) return null
    const info = await FileSystem.getInfoAsync(path)
    if (!info.exists) return null
    return JSON.parse(await FileSystem.readAsStringAsync(path)) as T
  }
  catch
  {
    return null
  }
}

export async function writeLocalJson(key: string, value: unknown): Promise<void>
{
  try
  {
    const raw = JSON.stringify(value)
    if (Platform.OS === 'web')
    {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, raw)
      return
    }
    const path = fileFor(key)
    if (path) await FileSystem.writeAsStringAsync(path, raw)
  }
  catch
  {
    /* memória local é complementar - falha não bloqueia o app */
  }
}
