import type { TarefaUnificada } from '../types'

// Main Quest do dia — uma tarefa com bônus +50% XP

const STORAGE_KEY = 'axel-main-quest-v1'
export const MAIN_QUEST_XP_BONUS_RATIO = 0.5

interface MainQuestState
{
  date: string
  taskId: number
}

function todayIso(): string
{
  return new Date().toISOString().slice(0, 10)
}

function readState(): MainQuestState | null
{
  try
  {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as MainQuestState
  }
  catch
  {
    return null
  }
}

function writeState(state: MainQuestState): void
{
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function getMainQuestTaskId(): number | null
{
  const s = readState()
  if (!s || s.date !== todayIso())
  {
    return null
  }
  return s.taskId
}

export function syncMainQuest(tarefas: TarefaUnificada[]): TarefaUnificada | null
{
  const open = tarefas.filter((t) => t.status !== 'concluida')
  if (open.length === 0)
  {
    return null
  }

  const today = todayIso()
  const stored = readState()

  if (stored && stored.date === today)
  {
    const existing = open.find((t) => t.id === stored.taskId)
    if (existing)
    {
      return existing
    }
  }

  const top = [...open].sort((a, b) => (b.score_urgencia ?? 0) - (a.score_urgencia ?? 0))[0]
  if (top)
  {
    writeState({ date: today, taskId: top.id })
  }
  return top ?? null
}

export function isMainQuestTask(taskId: number): boolean
{
  return getMainQuestTaskId() === taskId
}

export function mainQuestBonusXp(baseXp: number): number
{
  return Math.max(1, Math.round(baseXp * MAIN_QUEST_XP_BONUS_RATIO))
}
