/** Meta de tempo. Conta dias de calendário, sem descontar ponto se a pessoa recomeçar. */

export type LifePledgeProgress = {
  elapsed: number
  done: number
  target: number
  pct: number
  left: number
  complete: boolean
}

/** O dia de início conta como 1. Datas inválidas contam 0. */
export function pledgeDays(startedOn: string, today: string): number
{
  const start = Date.parse(`${startedOn}T12:00:00`)
  const end = Date.parse(`${today}T12:00:00`)
  if (Number.isNaN(start) || Number.isNaN(end)) return 0
  const diff = Math.round((end - start) / 86_400_000)
  return Math.max(0, diff + 1)
}

export function pledgeProgress(startedOn: string, targetDays: number, today: string): LifePledgeProgress
{
  const elapsed = pledgeDays(startedOn, today)
  const target = Math.max(1, Math.floor(targetDays))
  const done = Math.min(elapsed, target)
  return {
    elapsed,
    done,
    target,
    pct: Math.round((done / target) * 100),
    left: Math.max(0, target - elapsed),
    complete: elapsed >= target,
  }
}
