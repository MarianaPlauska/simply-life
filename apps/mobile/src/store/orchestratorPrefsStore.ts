import { create } from 'zustand'
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import type { OrchestratorStyle } from '@simply-life/shared'

const KEY = 'simply-life-orchestrator-prefs'

export type TaskCaptureMode = 'prompt' | 'form'

type Persisted = {
  style: OrchestratorStyle
  capacityMinutes: number
  captureMode: TaskCaptureMode
  /** Fase 2: Axel reorganiza o quadro sozinho (manhã, atrasadas, ao concluir) */
  autoReplan: boolean
}

const DEFAULTS: Persisted = {
  style: 'equilibrado',
  capacityMinutes: 240,
  captureMode: 'prompt',
  autoReplan: true,
}

const STYLES: OrchestratorStyle[] = ['equilibrado', 'antecipar', 'no_prazo', 'leveza', 'financeiro']

function normalize(raw: unknown): Persisted
{
  if (!raw || typeof raw !== 'object') return DEFAULTS
  const r = raw as Record<string, unknown>
  const cap = Number(r.capacityMinutes)
  return {
    style: STYLES.includes(r.style as OrchestratorStyle) ? (r.style as OrchestratorStyle) : DEFAULTS.style,
    capacityMinutes: Number.isFinite(cap) && cap >= 30 && cap <= 720 ? Math.round(cap) : DEFAULTS.capacityMinutes,
    captureMode: r.captureMode === 'form' ? 'form' : 'prompt',
    autoReplan: r.autoReplan !== false,
  }
}

async function load(): Promise<Persisted>
{
  try
  {
    if (Platform.OS === 'web')
    {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null
      return raw ? normalize(JSON.parse(raw)) : DEFAULTS
    }
    const raw = await SecureStore.getItemAsync(KEY)
    return raw ? normalize(JSON.parse(raw)) : DEFAULTS
  }
  catch
  {
    return DEFAULTS
  }
}

async function save(value: Persisted): Promise<void>
{
  try
  {
    const raw = JSON.stringify(value)
    if (Platform.OS === 'web')
    {
      if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, raw)
      return
    }
    await SecureStore.setItemAsync(KEY, raw)
  }
  catch
  {
    /* preferência local - falha não bloqueia a captura */
  }
}

type State = Persisted & {
  hydrated: boolean
  hydrate: () => Promise<void>
  patch: (next: Partial<Persisted>) => void
}

/** Preferências do orquestrador de tarefas (estilo, tempo livre por dia, modo de captura). */
export const useOrchestratorPrefsStore = create<State>((set, get) => ({
  ...DEFAULTS,
  hydrated: false,
  hydrate: async () =>
  {
    if (get().hydrated) return
    const value = await load()
    set({ ...value, hydrated: true })
  },
  patch: (next) =>
  {
    const merged = normalize({ ...get(), ...next })
    set(merged)
    void save(merged)
  },
}))
