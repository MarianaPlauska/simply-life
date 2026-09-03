import {
  classifyDueBucket,
  type MobileTask,
} from './tasks'

export type OrchestrationHint = {
  taskId: string
  titulo: string
  action: 'promote_hoje' | 'defer' | 'ok'
  rationale: string
  score: number
}

/** Score simples 0-100 para orquestração mobile (shared) */
export function scoreMobileTask(task: MobileTask, ref = new Date()): number
{
  const bucket = classifyDueBucket(task.dataVencimento, task.status, ref)
  let score = 40
  if (bucket === 'vencido') score = 95
  else if (bucket === 'hoje') score = 80
  else if (bucket === 'esta_semana') score = 55
  else if (bucket === 'proxima_semana') score = 35
  else score = 20
  score += (4 - task.prioridade) * 5
  if (task.status === 'doing') score += 10
  return Math.min(100, score)
}

/** Sugestões do orquestrador - sem mutar dados */
export function buildOrchestrationHints(
  tasks: MobileTask[],
  dailyCap = 6,
  ref = new Date(),
): OrchestrationHint[]
{
  const open = tasks.filter((t) => t.status !== 'done')
  const ranked = open
    .map((t) => ({ t, score: scoreMobileTask(t, ref) }))
    .sort((a, b) => b.score - a.score)

  const hints: OrchestrationHint[] = []
  let hojeCount = 0

  for (const { t, score } of ranked)
  {
    const bucket = classifyDueBucket(t.dataVencimento, t.status, ref)
    if (bucket === 'vencido' || bucket === 'hoje')
    {
      hojeCount += 1
      hints.push({
        taskId: t.id,
        titulo: t.titulo,
        action: 'ok',
        rationale:
          bucket === 'vencido'
            ? 'Passou da data. Faça agora.'
            : 'Prazo hoje. Mantém na fila.',
        score,
      })
      continue
    }

    if (hojeCount < dailyCap && score >= 70)
    {
      hojeCount += 1
      hints.push({
        taskId: t.id,
        titulo: t.titulo,
        action: 'promote_hoje',
        rationale: 'Score alto. Sugestão: tratar como prioridade de hoje.',
        score,
      })
    }
    else if (score < 40)
    {
      hints.push({
        taskId: t.id,
        titulo: t.titulo,
        action: 'defer',
        rationale: 'Carga cheia. Pode esperar na semana.',
        score,
      })
    }
  }

  return hints.slice(0, 12)
}
