import {
  computeDailyLoadBalancer,
  type LoadBalanceEntry,
} from './adaptiveOrchestration'
import { getDragLearningBoost } from './axelDragLearning'
import { isTaskDependencyBlocked } from './taskDependencies'
import { resolveDaysStagnant } from './taskDecay'
import {
  applyUrgencyScores,
  calculateUrgencyScores,
  type UrgencyScoreEntry,
} from './urgencyEngine'
import { resolveTemporalHorizon, type TemporalHorizon } from './temporalHorizon'
import type { TarefaUnificada } from '../types'

const STAGNATION_DAYS = 3
const STAGNATION_SCORE_PENALTY = 8

// Pipeline único — score → horizonte → cap de carga → decisões explicáveis

export interface OrchestrationDecision
{
  taskId: number
  message: string
}

export interface PipelineOrchestrationResult
{
  scores: UrgencyScoreEntry[]
  scoredTasks: TarefaUnificada[]
  autoHorizons: Record<number, TemporalHorizon>
  loadBalance: Map<number, LoadBalanceEntry>
  decisions: OrchestrationDecision[]
  hojeCount: number
  source: 'ai' | 'mock'
}

/** Regras exibidas na UI — o usuário entende por que o AXEL decidiu */
export const AXEL_PLACEMENT_RULES = [
  { id: 'hoje', label: 'Hoje', rule: 'Score acima de 90 ou prazo vence hoje' },
  { id: 'semana', label: 'Semana', rule: 'Score acima de 70, em progresso ou prazo em 7 dias' },
  { id: 'backlog', label: 'Backlog', rule: 'Demais demandas aguardando sinal' },
  { id: 'carga', label: 'Carga mental', rule: 'Excesso em Hoje adia automaticamente para Semana' },
] as const

/** Mescla horizonte automático com override manual (manual vence) */
export function mergeHorizonMaps(
  auto: Record<number, TemporalHorizon>,
  manual: Record<number, TemporalHorizon>,
): Record<number, TemporalHorizon>
{
  return { ...auto, ...manual }
}

export interface HorizonAssignOptions
{
  lastMovedAt?: (taskId: number, createdAt: string | null) => string | null
}

/** Penaliza score de tarefas paradas e aplica bônus de aprendizado por drag */
function applyScoreAdjustments(
  tasks: TarefaUnificada[],
  lastMovedAt?: HorizonAssignOptions['lastMovedAt'],
): { tasks: TarefaUnificada[]; decisions: OrchestrationDecision[] }
{
  const decisions: OrchestrationDecision[] = []

  const adjusted = tasks.map((task) =>
  {
    if (task.status === 'concluida') return task

    let score = task.score_urgencia ?? 0
    const moved = lastMovedAt?.(task.id, task.created_at ?? null) ?? null
    const stagnantDays = resolveDaysStagnant(task, moved)

    if (stagnantDays > STAGNATION_DAYS)
    {
      const penalty = Math.min(30, (stagnantDays - STAGNATION_DAYS) * STAGNATION_SCORE_PENALTY)
      const next = Math.max(5, score - penalty)
      if (next < score)
      {
        decisions.push({
          taskId: task.id,
          message: `「${task.titulo.slice(0, 40)}」— contexto esfriando (${stagnantDays}d parada) · score ${score}→${next}`,
        })
        score = next
      }
    }

    const dragBoost = getDragLearningBoost(task.titulo)
    if (dragBoost > 0)
    {
      score = Math.min(100, score + dragBoost)
    }

    if (score === (task.score_urgencia ?? 0)) return task
    return { ...task, score_urgencia: score }
  })

  return { tasks: adjusted, decisions }
}

/** Atribui horizontes com base no score e aplica cap de carga */
export function assignOrchestratedHorizons(
  scoredTasks: TarefaUnificada[],
  dailyScoreCap: number,
  options: HorizonAssignOptions = {},
): {
  autoHorizons: Record<number, TemporalHorizon>
  loadBalance: Map<number, LoadBalanceEntry>
  decisions: OrchestrationDecision[]
}
{
  const autoHorizons: Record<number, TemporalHorizon> = {}
  const decisions: OrchestrationDecision[] = []
  const active = scoredTasks.filter((t) => t.status !== 'concluida')

  for (const task of active)
  {
    autoHorizons[task.id] = resolveTemporalHorizon(task)
  }

  // Dependências — bloqueada até predecessor concluir
  for (const task of active)
  {
    if (!isTaskDependencyBlocked(task, scoredTasks)) continue
    if (autoHorizons[task.id] !== 'hoje') continue

    autoHorizons[task.id] = 'semana'
    const deps = (task.blockedBy ?? []).join(', ')
    decisions.push({
      taskId: task.id,
      message: `「${task.titulo.slice(0, 36)}」— aguarda dependência (${deps}) · mantida em Semana`,
    })
  }

  // Decay térmico — parada há dias sai de Hoje/Semana
  for (const task of active)
  {
    const moved = options.lastMovedAt?.(task.id, task.created_at ?? null) ?? null
    const stagnantDays = resolveDaysStagnant(task, moved)
    const horizon = autoHorizons[task.id]

    if (stagnantDays <= STAGNATION_DAYS) continue
    if (horizon !== 'hoje' && horizon !== 'semana') continue

    autoHorizons[task.id] = 'backlog'
    decisions.push({
      taskId: task.id,
      message: `「${task.titulo.slice(0, 36)}」— ${stagnantDays}d sem movimento · AXEL enviou ao Backlog`,
    })
  }

  const hojeCandidates = active.filter((t) => autoHorizons[t.id] === 'hoje')
  const loadBalance = computeDailyLoadBalancer(hojeCandidates, dailyScoreCap)

  for (const [taskId, entry] of loadBalance)
  {
    if (!entry.snoozed || autoHorizons[taskId] !== 'hoje') continue

    const task = active.find((t) => t.id === taskId)
    if (!task) continue

    autoHorizons[taskId] = 'semana'
    decisions.push({
      taskId,
      message: `Adiada para Semana — carga de Hoje no limite (${dailyScoreCap} pts). Score ${task.score_urgencia ?? 0}.`,
    })
  }

  return { autoHorizons, loadBalance, decisions }
}

/** Executa pipeline completo: pontuação + horizonte + carga */
export async function runPipelineOrchestration(
  tasks: TarefaUnificada[],
  dailyScoreCap: number,
  options: HorizonAssignOptions = {},
): Promise<PipelineOrchestrationResult>
{
  const scores = await calculateUrgencyScores(tasks)
  let scoredTasks = applyUrgencyScores(tasks, scores)
  const { tasks: adjustedTasks, decisions: adjustDecisions } = applyScoreAdjustments(
    scoredTasks,
    options.lastMovedAt,
  )
  scoredTasks = adjustedTasks

  const { autoHorizons, loadBalance, decisions: horizonDecisions } = assignOrchestratedHorizons(
    scoredTasks,
    dailyScoreCap,
    options,
  )
  const decisions = [...adjustDecisions, ...horizonDecisions]

  const hojeCount = Object.values(autoHorizons).filter((h) => h === 'hoje').length
  const source = scores.some((s) => s.source === 'ai') ? 'ai' : 'mock'

  return {
    scores,
    scoredTasks,
    autoHorizons,
    loadBalance,
    decisions,
    hojeCount,
    source,
  }
}
