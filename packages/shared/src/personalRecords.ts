/**
 * Recorde pessoal: só existe festa quando o número de hoje passa o que já estava guardado.
 * A primeira leitura só grava o que já existe, sem comemorar o passado.
 */

export type RecordBoard = {
  elo: number
  tasksDay: number
  waterWeek: number
}

export type RecordBeat = {
  kind: keyof RecordBoard
  value: number
  text: string
}

const TEXT: Record<keyof RecordBoard, (n: number) => string> = {
  elo: (n) => `Olha: ${n} dias de Elo. O número anterior continua guardado.`,
  tasksDay: (n) => `Hoje passaram ${n} tarefas. O dia anterior continua salvo.`,
  waterWeek: (n) => `Esta semana chegou a ${n} copos. A semana de antes continua salva.`,
}

export function beatPersonalRecord(now: RecordBoard, best: RecordBoard): RecordBeat | null
{
  const order: (keyof RecordBoard)[] = ['elo', 'tasksDay', 'waterWeek']
  for (const kind of order)
  {
    if (now[kind] > best[kind] && now[kind] > 0)
    {
      return { kind, value: now[kind], text: TEXT[kind](now[kind]) }
    }
  }
  return null
}

export function mergeRecordBoard(now: RecordBoard, best: RecordBoard): RecordBoard
{
  return {
    elo: Math.max(best.elo, now.elo),
    tasksDay: Math.max(best.tasksDay, now.tasksDay),
    waterWeek: Math.max(best.waterWeek, now.waterWeek),
  }
}
