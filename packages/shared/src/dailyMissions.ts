/**
 * Três missões pequenas do dia. O que a pessoa quase não faz não entra com meta alta.
 * Não cumprir não tira nada: a linha só espera até a meia-noite.
 */

export type MissionId = 'water' | 'task' | 'mood'

export type DailyMission = {
  id: MissionId
  title: string
  target: number
}

export type MissionHabits = {
  waterDays: number
  usualCups: number
  finishesBeforeTen: boolean
}

export type MissionProgress = {
  waterCups: number
  tasksDone: number
  moodLogged: boolean
  taskDoneBeforeTen: boolean
}

export function pickDailyMissions(habits: MissionHabits): DailyMission[]
{
  // Sem horário no texto: prazo fixo soa como cobrança para quem está ansioso ou em baixa.
  const list: DailyMission[] = [
    { id: 'mood', title: 'Se quiser, diga como está o humor', target: 1 },
    { id: 'task', title: 'Uma tarefa, no seu tempo', target: 1 },
  ]
  if (habits.waterDays >= 1)
  {
    const cups = habits.waterDays >= 2 && habits.usualCups >= 2 ? 2 : 1
    list.push({
      id: 'water',
      title: cups >= 2 ? 'Dois copos de água, se der' : 'Um copo de água, se der',
      target: cups,
    })
  }
  return list
}

export function missionDone(mission: DailyMission, progress: MissionProgress): boolean
{
  if (mission.id === 'mood') return progress.moodLogged
  if (mission.id === 'water') return progress.waterCups >= mission.target
  return progress.tasksDone >= mission.target
}

export function missionsComplete(missions: DailyMission[], progress: MissionProgress): boolean
{
  return missions.length > 0 && missions.every((m) => missionDone(m, progress))
}
