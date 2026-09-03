// Prova de trabalho - regras para manter a ofensiva diária

export const STREAK_MIN_SCORE = 70
export const STREAK_MIN_FOCUS_MINUTES = 15

export interface ProofOfWorkEvaluation
{
  qualifiesForStreak: boolean
  scoreOk: boolean
  focusOk: boolean
  focusMinutesOnTask: number
}

export function evaluateProofOfWork(
  score: number,
  focusSecondsOnTask: number,
  estimateMinutes: number,
): ProofOfWorkEvaluation
{
  const scoreOk = score > STREAK_MIN_SCORE
  const focusMinutesOnTask = Math.round(focusSecondsOnTask / 60)
  const estimateMet = focusSecondsOnTask >= estimateMinutes * 60
  const minFocusMet = focusMinutesOnTask >= STREAK_MIN_FOCUS_MINUTES
  const focusOk = minFocusMet || estimateMet

  return {
    qualifiesForStreak: scoreOk && focusOk,
    scoreOk,
    focusOk,
    focusMinutesOnTask,
  }
}
