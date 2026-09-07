import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import type {
  ThoughtRecordEntry,
  BehavioralActivationEntry,
  GradualExposureEntry,
} from '@simply-life/shared'

const THOUGHT_KEY = 'simply-life-tcc-thought-records'
const BEHAVIOR_KEY = 'simply-life-tcc-behavioral-records'
const EXPOSURE_KEY = 'simply-life-tcc-exposure-records'

let thoughtMemory: ThoughtRecordEntry[] | null = null
let behaviorMemory: BehavioralActivationEntry[] | null = null
let exposureMemory: GradualExposureEntry[] | null = null

export type TccRecentItem =
  | { kind: 'thought'; entry: ThoughtRecordEntry }
  | { kind: 'behavior'; entry: BehavioralActivationEntry }
  | { kind: 'exposure'; entry: GradualExposureEntry }

function readJsonSync<T>(key: string, memory: T[] | null): T[]
{
  if (memory) return memory
  try
  {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined')
    {
      const raw = localStorage.getItem(key)
      if (!raw) return []
      const parsed = JSON.parse(raw) as T[]
      return Array.isArray(parsed) ? parsed : []
    }
  }
  catch
  {
    /* ignore */
  }
  return []
}

async function readJsonAsync<T>(key: string, memoryRef: { current: T[] | null }): Promise<T[]>
{
  const sync = readJsonSync(key, memoryRef.current)
  if (sync.length > 0 || Platform.OS === 'web') return sync
  try
  {
    const raw = await SecureStore.getItemAsync(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as T[]
    memoryRef.current = Array.isArray(parsed) ? parsed : []
    return memoryRef.current
  }
  catch
  {
    return []
  }
}

function writeJson<T>(key: string, entries: T[], memoryRef: { current: T[] | null }): void
{
  memoryRef.current = entries
  const payload = JSON.stringify(entries)
  try
  {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined')
    {
      localStorage.setItem(key, payload)
      return
    }
    void SecureStore.setItemAsync(key, payload)
  }
  catch
  {
    /* ignore */
  }
}

const thoughtMem = { get current() { return thoughtMemory }, set current(v) { thoughtMemory = v } }
const behaviorMem = { get current() { return behaviorMemory }, set current(v) { behaviorMemory = v } }
const exposureMem = { get current() { return exposureMemory }, set current(v) { exposureMemory = v } }

async function readThoughts(): Promise<ThoughtRecordEntry[]>
{
  return readJsonAsync<ThoughtRecordEntry>(THOUGHT_KEY, thoughtMem)
}

async function readBehaviors(): Promise<BehavioralActivationEntry[]>
{
  return readJsonAsync<BehavioralActivationEntry>(BEHAVIOR_KEY, behaviorMem)
}

async function readExposures(): Promise<GradualExposureEntry[]>
{
  return readJsonAsync<GradualExposureEntry>(EXPOSURE_KEY, exposureMem)
}

export async function loadThoughtRecords(): Promise<ThoughtRecordEntry[]>
{
  const rows = await readThoughts()
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function saveThoughtRecord(
  draft: Omit<ThoughtRecordEntry, 'id' | 'createdAt'> & { id?: string; createdAt?: string },
): Promise<ThoughtRecordEntry>
{
  const entry: ThoughtRecordEntry = {
    id: draft.id ?? `tcc-thought-${Date.now()}`,
    createdAt: draft.createdAt ?? new Date().toISOString(),
    situation: draft.situation,
    automaticThought: draft.automaticThought,
    evidenceFor: draft.evidenceFor,
    evidenceAgainst: draft.evidenceAgainst,
    alternativeThought: draft.alternativeThought,
  }
  const existing = await readThoughts()
  const next = [entry, ...existing.filter((e) => e.id !== entry.id)]
  writeJson(THOUGHT_KEY, next, thoughtMem)
  return entry
}

export async function removeThoughtRecord(id: string): Promise<void>
{
  const existing = await readThoughts()
  writeJson(THOUGHT_KEY, existing.filter((e) => e.id !== id), thoughtMem)
}

export async function loadBehavioralActivations(): Promise<BehavioralActivationEntry[]>
{
  const rows = await readBehaviors()
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function saveBehavioralActivation(
  draft: Omit<BehavioralActivationEntry, 'id' | 'createdAt'> & { id?: string; createdAt?: string },
): Promise<BehavioralActivationEntry>
{
  const entry: BehavioralActivationEntry = {
    id: draft.id ?? `tcc-behavior-${Date.now()}`,
    createdAt: draft.createdAt ?? new Date().toISOString(),
    barrier: draft.barrier,
    action: draft.action,
    durationMin: draft.durationMin,
  }
  const existing = await readBehaviors()
  const next = [entry, ...existing.filter((e) => e.id !== entry.id)]
  writeJson(BEHAVIOR_KEY, next, behaviorMem)
  return entry
}

export async function loadGradualExposures(): Promise<GradualExposureEntry[]>
{
  const rows = await readExposures()
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function saveGradualExposure(
  draft: Omit<GradualExposureEntry, 'id' | 'createdAt'> & { id?: string; createdAt?: string },
): Promise<GradualExposureEntry>
{
  const entry: GradualExposureEntry = {
    id: draft.id ?? `tcc-exposure-${Date.now()}`,
    createdAt: draft.createdAt ?? new Date().toISOString(),
    situation: draft.situation,
    steps: draft.steps,
    chosenStepId: draft.chosenStepId,
  }
  const existing = await readExposures()
  const next = [entry, ...existing.filter((e) => e.id !== entry.id)]
  writeJson(EXPOSURE_KEY, next, exposureMem)
  return entry
}

export async function loadRecentTccItems(limit = 8): Promise<TccRecentItem[]>
{
  const [thoughts, behaviors, exposures] = await Promise.all([
    loadThoughtRecords(),
    loadBehavioralActivations(),
    loadGradualExposures(),
  ])
  const merged: TccRecentItem[] = [
    ...thoughts.map((entry) => ({ kind: 'thought' as const, entry })),
    ...behaviors.map((entry) => ({ kind: 'behavior' as const, entry })),
    ...exposures.map((entry) => ({ kind: 'exposure' as const, entry })),
  ]
  return merged
    .sort((a, b) => b.entry.createdAt.localeCompare(a.entry.createdAt))
    .slice(0, limit)
}
