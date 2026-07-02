import type { StateCreator } from 'zustand'
import type { TarefaUnificada } from '../../types'
import {
  getActiveStorageUserId,
  readScopedJson,
  writeScopedJson,
} from '../../lib/userScopedStorage'

// Rastro de Conquistas — tarefas concluídas recentemente (isolado por usuário)

export const ACHIEVEMENTS_BASE_KEY = 'axel-recent-achievements-v1'
const MAX_ACHIEVEMENTS = 16

export interface AchievementEntry
{
  id: string
  taskId: number
  titulo: string
  focusMinutes: number
  createdAt: string
  completedAt: string
  pulseNonce: number
}

function normalizeAchievements(entries: AchievementEntry[] | null | undefined): AchievementEntry[]
{
  if (!entries?.length) return []

  return entries.map((e) => ({
    ...e,
    createdAt: e.createdAt ?? e.completedAt,
  }))
}

export function loadAchievementsForUser(userId?: string | null): AchievementEntry[]
{
  const uid = userId !== undefined ? userId : getActiveStorageUserId()
  if (!uid) return []

  // Descarta cache global legado — vazava dados entre contas no mesmo navegador
  try
  {
    localStorage.removeItem(ACHIEVEMENTS_BASE_KEY)
  }
  catch { /* ignore */ }

  return normalizeAchievements(readScopedJson<AchievementEntry[]>(ACHIEVEMENTS_BASE_KEY, uid))
}

function saveAchievementsForUser(entries: AchievementEntry[], userId?: string | null): void
{
  const uid = userId !== undefined ? userId : getActiveStorageUserId()
  if (!uid) return

  writeScopedJson(ACHIEVEMENTS_BASE_KEY, entries, uid)
}

/** Remove entradas que não pertencem às tarefas do usuário atual */
export function pruneAchievementsForTasks(
  entries: AchievementEntry[],
  tarefas: TarefaUnificada[],
): AchievementEntry[]
{
  if (!entries.length) return entries

  const taskIds = new Set(tarefas.map((t) => t.id))
  return entries.filter((entry) => taskIds.has(entry.taskId))
}

export interface AxelAchievementSlice
{
  recentAchievements: AchievementEntry[]
  recordAchievement: (
    taskId: number,
    titulo: string,
    focusMinutes: number,
    createdAt?: string | null,
  ) => void
  hydrateRecentAchievements: (userId?: string | null) => void
  reconcileRecentAchievements: (tarefas: TarefaUnificada[]) => void
}

export const createAxelAchievementSlice: StateCreator<
  AxelAchievementSlice,
  [],
  [],
  AxelAchievementSlice
> = (set, get) => ({
  recentAchievements: [],

  hydrateRecentAchievements: (userId) =>
  {
    set({ recentAchievements: loadAchievementsForUser(userId) })
  },

  reconcileRecentAchievements: (tarefas) =>
  {
    const pruned = pruneAchievementsForTasks(get().recentAchievements, tarefas)
    if (pruned.length === get().recentAchievements.length) return

    saveAchievementsForUser(pruned)
    set({ recentAchievements: pruned })
  },

  recordAchievement: (taskId, titulo, focusMinutes, createdAt) =>
  {
    const entry: AchievementEntry = {
      id: `${taskId}-${Date.now()}`,
      taskId,
      titulo,
      focusMinutes: Math.max(1, Math.round(focusMinutes)),
      createdAt: createdAt ?? new Date().toISOString(),
      completedAt: new Date().toISOString(),
      pulseNonce: Date.now(),
    }

    set((s) =>
    {
      const filtered = s.recentAchievements.filter((a) => a.taskId !== taskId)
      const next = [entry, ...filtered].slice(0, MAX_ACHIEVEMENTS)
      saveAchievementsForUser(next)
      return { recentAchievements: next }
    })
  },
})
