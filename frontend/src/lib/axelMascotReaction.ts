import type { SpreadsheetMood } from './financeSpreadsheetMood'

// Reações do mascote AXEL - humor + ofensiva

export interface AxelReaction
{
  mood: SpreadsheetMood
  headline: string
  message: string
}

export function resolveAxelReaction(input: {
  streakCount: number
  isStreakSafeToday: boolean
  humorMedio?: number
  hasMoodToday: boolean
}): AxelReaction
{
  const { streakCount, isStreakSafeToday, humorMedio, hasMoodToday } = input

  if (!isStreakSafeToday && streakCount >= 3)
  {
    return {
      mood: 'stressed',
      headline: 'Ofensiva em risco',
      message: 'Um passo hoje - tarefa ou humor - e a sequência continua viva.',
    }
  }

  if (humorMedio !== undefined && humorMedio > 0 && humorMedio < 2.5)
  {
    return {
      mood: 'tight',
      headline: 'Semana pesada',
      message: 'Registrei seu humor. Vou sugerir menos carga até você respirar melhor.',
    }
  }

  if (streakCount >= 7 && isStreakSafeToday)
  {
    return {
      mood: 'great',
      headline: `${streakCount} dias`,
      message: 'Ritmo forte. Você está construindo identidade, não só pontos.',
    }
  }

  if (isStreakSafeToday)
  {
    return {
      mood: 'ok',
      headline: 'Dia salvo',
      message: hasMoodToday
        ? 'Humor registrado - amanhã seguimos com calma e foco.'
        : 'Missão cumprida hoje. Amanhã é outra chance de somar XP.',
    }
  }

  if (!hasMoodToday)
  {
    return {
      mood: 'tight',
      headline: 'Te esperando',
      message: 'Registre humor ou conclua 1 tarefa - a ofensiva começa com um gesto pequeno.',
    }
  }

  return {
    mood: 'ok',
    headline: 'No ritmo',
    message: 'Cada nível reflete sua vida real: tarefas, saúde e finanças em dia.',
  }
}
