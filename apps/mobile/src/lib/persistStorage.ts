/**
 * Armazenamento persistente único para os stores locais (xp, ofensiva, água, sono e treino,
 * rotinas, pastas, histórico diário de hábitos).
 *
 * Web: localStorage, como sempre.
 * Nativo: um arquivo JSON por chave em `documentDirectory/sl-persist/` (expo-file-system,
 * sem o limite de ~2KB do SecureStore). Tudo é carregado para um cache em memória logo na
 * importação, então a leitura continua síncrona (`persistStorage.getItem`) depois de pronta.
 *
 * Hidratação: antes de `isPersistReady()` o cache nativo ainda está vazio. Stores devem usar
 * `runHydrated` nas ações que gravam, para nunca sobrescrever o que estava salvo com estado vazio.
 */
import { Platform } from 'react-native'
import * as FileSystem from 'expo-file-system'
import * as SecureStore from 'expo-secure-store'

export type SyncStorage = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

const IS_WEB = Platform.OS === 'web'
const DIR = !IS_WEB && FileSystem.documentDirectory ? `${FileSystem.documentDirectory}sl-persist/` : null

const cache = new Map<string, string>()
const writeChains = new Map<string, Promise<void>>()
let ready = IS_WEB || !DIR
let readyPromise: Promise<void> | null = null

function webStorage(): Storage | null
{
  try
  {
    return typeof localStorage !== 'undefined' ? localStorage : null
  }
  catch
  {
    return null
  }
}

function fileFor(key: string): string
{
  // chave vai também dentro do arquivo; o nome só precisa ser seguro para URI
  return `${DIR}${key.replace(/[^A-Za-z0-9._-]/g, '_')}.json`
}

function queueWrite(key: string, value: string | null): Promise<void>
{
  if (!DIR) return Promise.resolve()
  const path = fileFor(key)
  const prev = writeChains.get(key) ?? Promise.resolve()
  const next = prev
    .then(async () =>
    {
      if (value == null) await FileSystem.deleteAsync(path, { idempotent: true })
      else await FileSystem.writeAsStringAsync(path, JSON.stringify({ key, value }))
    })
    .catch(() =>
    {
      /* persistência local é complementar: falha não bloqueia o app */
    })
  writeChains.set(key, next)
  return next
}

async function loadAll(): Promise<void>
{
  if (!DIR) return
  try
  {
    await FileSystem.makeDirectoryAsync(DIR, { intermediates: true }).catch(() => undefined)
    const names = await FileSystem.readDirectoryAsync(DIR).catch(() => [] as string[])
    await Promise.all(
      names.map(async (name) =>
      {
        try
        {
          const parsed = JSON.parse(await FileSystem.readAsStringAsync(`${DIR}${name}`)) as {
            key?: unknown
            value?: unknown
          }
          // gravação feita antes de carregar é mais nova: não sobrescreve
          if (typeof parsed.key === 'string' && typeof parsed.value === 'string' && !cache.has(parsed.key))
          {
            cache.set(parsed.key, parsed.value)
          }
        }
        catch
        {
          /* arquivo inválido: ignora */
        }
      }),
    )
  }
  finally
  {
    ready = true
  }
}

export function isPersistReady(): boolean
{
  return ready
}

export function whenPersistReady(): Promise<void>
{
  if (ready) return Promise.resolve()
  if (!readyPromise) readyPromise = loadAll()
  return readyPromise
}

// começa a carregar já na importação
if (!ready) void whenPersistReady()

export const persistStorage: SyncStorage = {
  getItem: (key) =>
  {
    if (IS_WEB)
    {
      try
      {
        return webStorage()?.getItem(key) ?? null
      }
      catch
      {
        return null
      }
    }
    return cache.get(key) ?? null
  },
  setItem: (key, value) =>
  {
    if (IS_WEB)
    {
      try
      {
        webStorage()?.setItem(key, value)
      }
      catch
      {
        /* cota cheia ou modo privado */
      }
      return
    }
    cache.set(key, value)
    void queueWrite(key, value)
  },
  removeItem: (key) =>
  {
    if (IS_WEB)
    {
      try
      {
        webStorage()?.removeItem(key)
      }
      catch
      {
        /* ignore */
      }
      return
    }
    cache.delete(key)
    void queueWrite(key, null)
  },
}

/**
 * Leitura assíncrona. `legacySecureStore`: no nativo, se a chave ainda não existe em arquivo,
 * procura no SecureStore (onde rotinas e pastas ficavam) e migra para o arquivo.
 */
export async function readPersisted(key: string, legacySecureStore = false): Promise<string | null>
{
  await whenPersistReady()
  const hit = persistStorage.getItem(key)
  if (hit != null || IS_WEB || !legacySecureStore) return hit
  try
  {
    const legacy = await SecureStore.getItemAsync(key)
    if (legacy == null) return null
    cache.set(key, legacy)
    await queueWrite(key, legacy)
    void SecureStore.deleteItemAsync(key).catch(() => undefined)
    return legacy
  }
  catch
  {
    return null
  }
}

/** Gravação assíncrona (espera o arquivo ser escrito no nativo). */
export async function writePersisted(key: string, value: string): Promise<void>
{
  await whenPersistReady()
  persistStorage.setItem(key, value)
  if (!IS_WEB) await (writeChains.get(key) ?? Promise.resolve())
}

/**
 * Guarda para ações que gravam num store hidratado de forma síncrona.
 * Retorna true se a ação pode seguir agora. Se o armazenamento ainda está carregando,
 * agenda `hydrate()` e depois `retry()`, e retorna false.
 */
export function runHydrated(isLoaded: () => boolean, hydrate: () => void, retry: () => void): boolean
{
  if (!ready)
  {
    void whenPersistReady().then(() =>
    {
      if (!isLoaded()) hydrate()
      retry()
    })
    return false
  }
  if (!isLoaded()) hydrate()
  return true
}
