import type { MobileTask } from './tasks'
import {
  SHARED_GOAL_PACE_TOLERANCE,
  expectedPace,
  type SharedGoal,
  type SharedGoalMemberCard,
  type SharedGoalProgress,
} from './sharedGoals'
import { waitMs, waitNeedsNudge, waitDays, type TaskWait } from './taskWaits'

/**
 * Cantinho do Círculo: por amigo, as metas juntos, as tarefas que esperam por
 * ele e o que pede atenção. Segue as regras de docs/METAS_JUNTOS.md: só o
 * progresso do grupo (faixa ou ritmo), nunca o número de cada pessoa.
 */

export type CircleFriend = {
  userId: string
  displayName: string
  accent: string
  avatarStyle?: string
}

export type GoalCare = 'atras' | 'nao_fechou' | null

/**
 * A meta precisa de um empurrão? Usa só o que o grupo pode ver.
 * - ritmo: o servidor já diz 'atras'
 * - faixas: até o topo da faixa fica abaixo do ritmo esperado
 * - cada um: alguém fora do ritmo (sem dizer quem)
 * - ciclo encerrado sem chegar lá: 'nao_fechou'
 */
export function sharedGoalCare(p: SharedGoalProgress | null | undefined): GoalCare
{
  if (!p || p.notStarted) return null
  if (p.ended)
  {
    if (p.exibicao === 'faixas' && p.faixa != null && p.faixa < 4) return 'nao_fechou'
    if (p.modo === 'cada_um' && p.onPace != null && p.onPace < p.members) return 'nao_fechou'
    if (p.ritmo === 'atras') return 'nao_fechou'
    return null
  }
  if (p.ritmo === 'atras') return 'atras'
  if (p.modo === 'cada_um' && p.exibicao === 'ritmo' && p.onPace != null && p.onPace < p.members) return 'atras'
  if (p.exibicao === 'faixas' && p.faixa != null && p.faixa < 4)
  {
    const expected = expectedPace(p.daysElapsed, p.daysTotal)
    const bandTop = (p.faixa + 1) * 0.25
    if (bandTop < expected - SHARED_GOAL_PACE_TOLERANCE) return 'atras'
  }
  return null
}

export const GOAL_CARE_LABEL: Record<Exclude<GoalCare, null>, string> = {
  atras: 'Um pouco atrás do ritmo',
  nao_fechou: 'O ciclo fechou antes do alvo',
}

export type CircleGoalItem = {
  goal: SharedGoal
  progress: SharedGoalProgress | null
  care: GoalCare
}

export type CircleWaitItem = {
  wait: TaskWait
  task: MobileTask | undefined
  days: number
  nudge: boolean
}

export type CircleFriendSummary = {
  friend: CircleFriend
  goals: CircleGoalItem[]
  /** tarefas abertas esperando este amigo */
  waiting: CircleWaitItem[]
  /** tempo total esperando este amigo na janela */
  waitMs: number
  waitCount: number
  cobrancas: number
  /** quantas coisas pedem atenção (meta atrás + espera sem retorno há dias) */
  attention: number
}

export type CircleOverview = {
  friends: CircleFriendSummary[]
  /** metas com o grupo que pedem um empurrão (inclui metas sem amigo do Círculo) */
  goalsNeedingCare: CircleGoalItem[]
  activeGoals: number
  /** soma para o pontinho do botão */
  attention: number
}

function sameName(a: string, b: string): boolean
{
  return a.trim().toLocaleLowerCase('pt-BR') === b.trim().toLocaleLowerCase('pt-BR')
}

/** A espera é deste amigo? Pelo vínculo (071) ou, sem ele, pelo nome. */
export function waitBelongsTo(w: TaskWait, friend: CircleFriend): boolean
{
  if (w.amigoId) return w.amigoId === friend.userId
  return sameName(w.pessoa, friend.displayName)
}

export function buildCircleOverview(input: {
  friends: CircleFriend[]
  goals: SharedGoal[]
  progress: Record<string, SharedGoalProgress | null>
  members: Record<string, SharedGoalMemberCard[]>
  waits: TaskWait[]
  tasks: MobileTask[]
  now?: Date
  days?: number
}): CircleOverview
{
  const now = input.now ?? new Date()
  const since = now.getTime() - (input.days ?? 30) * 86_400_000
  const byTask = new Map(input.tasks.map((t) => [t.id, t]))

  const goalItems: CircleGoalItem[] = input.goals
    .filter((g) => g.status === 'ativa')
    .map((goal) =>
    {
      const progress = input.progress[goal.id] ?? null
      return { goal, progress, care: sharedGoalCare(progress) }
    })

  const friends = input.friends.map((friend): CircleFriendSummary =>
  {
    const goals = goalItems.filter((g) =>
      (input.members[g.goal.id] ?? []).some((m) => m.userId === friend.userId))
    const mine = input.waits.filter((w) => waitBelongsTo(w, friend))
    const inWindow = mine.filter((w) =>
    {
      const end = w.ate ? new Date(w.ate).getTime() : now.getTime()
      return end >= since
    })
    const waiting = mine
      .filter((w) => !w.ate && byTask.get(w.taskId)?.status !== 'done')
      .map((w) => ({
        wait: w,
        task: byTask.get(w.taskId),
        days: waitDays(w, undefined, now),
        nudge: waitNeedsNudge(w, now),
      }))
      .sort((a, b) => b.days - a.days)
    const attention = goals.filter((g) => g.care).length + waiting.filter((w) => w.nudge).length
    return {
      friend,
      goals,
      waiting,
      waitMs: inWindow.reduce((n, w) => n + waitMs(w, byTask.get(w.taskId), now), 0),
      waitCount: inWindow.length,
      cobrancas: inWindow.reduce((n, w) => n + w.cobrancas.length, 0),
      attention,
    }
  })

  friends.sort((a, b) =>
    b.attention - a.attention
    || b.waiting.length - a.waiting.length
    || b.goals.length - a.goals.length
    || a.friend.displayName.localeCompare(b.friend.displayName, 'pt-BR'))

  const goalsNeedingCare = goalItems.filter((g) => g.care)
  const nudges = friends.reduce((n, f) => n + f.waiting.filter((w) => w.nudge).length, 0)

  return {
    friends,
    goalsNeedingCare,
    activeGoals: goalItems.length,
    attention: goalsNeedingCare.length + nudges,
  }
}
