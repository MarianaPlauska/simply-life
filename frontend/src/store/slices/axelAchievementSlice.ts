import type { StateCreator } from 'zustand'

// Rastro de Conquistas — tarefas concluídas recentemente

const ACHIEVEMENTS_KEY = 'axel-recent-achievements-v1'
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

function loadAchievements(): AchievementEntry[]
{
  try
  {
    const raw = localStorage.getItem(ACHIEVEMENTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as AchievementEntry[]
    return parsed.map((e) => ({
      ...e,
      createdAt: e.createdAt ?? e.completedAt,
    }))
  }
  catch
  {
    return []
  }
}

function saveAchievements(entries: AchievementEntry[]): void
{
  localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(entries))
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
}

export const createAxelAchievementSlice: StateCreator<
  AxelAchievementSlice,
  [],
  [],
  AxelAchievementSlice
> = (set) => ({
  recentAchievements: loadAchievements(),

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
      saveAchievements(next)
      return { recentAchievements: next }
    })
  },
})
