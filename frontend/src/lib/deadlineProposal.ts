import { diffDaysUntilDue } from './daysRemaining'
import { isTaskDependencyBlocked } from './taskDependencies'
import type { TarefaUnificada } from '../types'

export interface DeadlineProposal
{
  taskId: number
  currentDue: string | null
  proposedDue: string
  reason: string
  createdAt: string
}

const MS_PER_DAY = 86_400_000

function addBusinessDays(from: Date, days: number): Date
{
  const d = new Date(from)
  let added = 0
  while (added < days)
  {
    d.setDate(d.getDate() + 1)
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) added++
  }
  d.setHours(17, 0, 0, 0)
  return d
}

/**
 * Gera propostas de prazo quando carga, bloqueio ou atraso exigem ajuste.
 * Nunca altera o prazo - só sugere para aceite do usuário.
 */
export function computeDeadlineProposals(
  tasks: TarefaUnificada[],
  dailyScoreCap: number,
  velocityFactor: number = 1,
): DeadlineProposal[]
{
  const now = new Date()
  const active = tasks.filter((t) => t.status !== 'concluida')
  const proposals: DeadlineProposal[] = []

  const hojeLoad = active
    .filter((t) =>
    {
      const diff = diffDaysUntilDue(t.data_vencimento, now)
      return diff !== null && diff <= 0
    })
    .reduce((sum, t) => sum + (t.score_urgencia ?? 0), 0)

  const overloaded = hojeLoad > dailyScoreCap * 0.9

  for (const task of active)
  {
    if (task.id <= 0) continue

    const diff = diffDaysUntilDue(task.data_vencimento, now)
    const blocked = isTaskDependencyBlocked(task, active)

    // Atrasada + bloqueada → empurrar 2 dias úteis
    if (diff !== null && diff < 0 && blocked)
    {
      const proposed = addBusinessDays(now, 2)
      proposals.push({
        taskId: task.id,
        currentDue: task.data_vencimento,
        proposedDue: proposed.toISOString(),
        reason: 'Dependência pendente - prazo irrealista para concluir agora.',
        createdAt: now.toISOString(),
      })
      continue
    }

    // Atrasada + carga alta → +1 dia útil
    if (diff !== null && diff < 0 && overloaded)
    {
      const proposed = addBusinessDays(now, 1)
      proposals.push({
        taskId: task.id,
        currentDue: task.data_vencimento,
        proposedDue: proposed.toISOString(),
        reason: `Carga de prazo hoje acima do cap (${dailyScoreCap} pts) - sugere reagendar.`,
        createdAt: now.toISOString(),
      })
      continue
    }

    // Vence hoje mas score baixo e velocity lenta → +2 dias
    if (
      diff === 0
      && (task.score_urgencia ?? 0) < 50
      && velocityFactor < 0.85
    )
    {
      const proposed = new Date(now.getTime() + 2 * MS_PER_DAY)
      proposed.setHours(17, 0, 0, 0)
      proposals.push({
        taskId: task.id,
        currentDue: task.data_vencimento,
        proposedDue: proposed.toISOString(),
        reason: 'Velocidade abaixo da meta - mais 2 dias para entrega sustentável.',
        createdAt: now.toISOString(),
      })
    }
  }

  // Uma proposta por tarefa - a mais recente vence
  const byTask = new Map<number, DeadlineProposal>()
  for (const p of proposals)
  {
    byTask.set(p.taskId, p)
  }

  return [...byTask.values()]
}
