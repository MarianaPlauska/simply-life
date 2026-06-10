import type { StateCreator } from 'zustand'

// Rastro de Conquistas — tarefas concluídas recentemente

const ACHIEVEMENTS_KEY = 'orion-recent-achievements-v1'
const MAX_ACHIEVEMENTS = 16

export interface AchievementEntry
{
  id: string
  taskId: number
  titulo: string
  focusMinutes: number
  completedAt: string
  pulseNonce: number
}

function loadAchievements(): AchievementEntry[]
{
  try
  {
    const raw = localStorage.getItem(ACHIEVEMENTS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as AchievementEntry[]
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

export interface OrionAchievementSlice
{
  recentAchievements: AchievementEntry[]
  recordAchievement: (taskId: number, titulo: string, focusMinutes: number) => void
}

export const createOrionAchievementSlice: StateCreator<
  OrionAchievementSlice,
  [],
  [],
  OrionAchievementSlice
> = (set) => ({
  recentAchievements: loadAchievements(),

  recordAchievement: (taskId, titulo, focusMinutes) =>
  {
    const entry: AchievementEntry = {
      id: `${taskId}-${Date.now()}`,
      taskId,
      titulo,
      focusMinutes: Math.max(1, Math.round(focusMinutes)),
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
