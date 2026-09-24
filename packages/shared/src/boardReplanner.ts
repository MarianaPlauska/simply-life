/**
 * Replanejador do quadro inteiro (Fase 2).
 * Olha todas as tarefas abertas e propõe movimentos de data:
 *  - resgatar atrasadas para o primeiro dia com espaço
 *  - aliviar dias acima do tempo livre (adiando o que é flexível)
 *  - adiantar tarefas quando sobra tempo hoje (ex.: depois de concluir algo)
 * Regras duras: compromisso com hora não se move; prazo firme nunca vai para depois
 * do prazo; tarefa travada pelo usuário (desfez/moveu à mão) não se move;
 * dependência nunca fica antes da tarefa de que depende.
 * Determinístico e idempotente: rodar de novo sobre o resultado não gera novos movimentos.
 */
import type { MobileTask } from './tasks'
import { localTodayIso } from './dates'
import { taskDependsOnId } from './lifeCategories'
import { addDaysIso, diffDaysIso, isTaskDeadlineRigid, parseTaskEnergy, type TaskEnergy } from './taskPrompt'
import { buildDayLoad, describeDayPt, effectiveCapacity, formatMinutesPt, taskEstimateFactor, type OrchestratorContext } from './taskOrchestrator'

export type ReplanTrigger = 'morning' | 'overdue' | 'completed' | 'manual'

export type BoardMoveKind = 'rescued_overdue' | 'deferred_load' | 'pulled_forward'

export type BoardMove = {
  taskId: string
  titulo: string
  kind: BoardMoveKind
  from: string | null
  to: string
  reason: string
}

export type ReplanOptions = {
  trigger: ReplanTrigger
  /** ids que o Axel não pode mexer (o usuário desfez ou moveu à mão) */
  pinned?: string[]
  /** ids movidos pelo Axel nas últimas 24h - não mexe de novo (exceto atrasadas) */
  recentlyMoved?: string[]
  /** dias que o usuário aceitou cheios (desfez um adiamento): não alivia de novo */
  acceptOverloadDays?: string[]
  maxMoves?: number
}

export type ReplanResult = {
  moves: BoardMove[]
  /** dias que continuam acima do tempo livre mesmo após replanejar */
  overloadedDays: { iso: string; minutos: number; capacidade: number }[]
  headline: string
}

const HORIZON = 14
const OVERLOAD_WINDOW = 6

export const BOARD_MOVE_LABEL: Record<BoardMoveKind, string> = {
  rescued_overdue: 'Atrasada replanejada',
  deferred_load: 'Adiada para aliviar o dia',
  pulled_forward: 'Adiantada',
}

type Item = {
  task: MobileTask
  day: string
  remaining: number
  fixed: boolean
  rigid: boolean
  energy: TaskEnergy
  dependsOn: string | null
  movable: boolean
}

function remainingMinutes(t: MobileTask, factor = 1): number
{
  return Math.max(5, Math.round((t.estimativaMinutos || 30) * (1 - (t.progresso || 0)) * factor))
}

function energyOf(t: MobileTask): TaskEnergy
{
  return parseTaskEnergy(t.anotacao) ?? ((t.estimativaMinutos || 0) >= 90 ? 'alta' : 'media')
}

/** Quanto vale manter a tarefa no dia em que está (maior = fica). */
function keepScore(i: Item, day: string): number
{
  let s = i.task.prioridade === 1 ? 60 : i.task.prioridade === 2 ? 30 : 0
  if (i.task.status === 'doing') s += 80
  if (i.rigid) s += 100
  if (i.task.dataVencimento && i.task.dataVencimento.slice(0, 10) < day) s += 20
  return s
}

export function replanBoard(
  tasks: MobileTask[],
  ctx: OrchestratorContext,
  opts: ReplanOptions,
): ReplanResult
{
  const ref = ctx.ref ?? new Date()
  const today = localTodayIso(ref)
  const lowMood = ctx.moodToday != null && ctx.moodToday <= 2
  const factor = (t: MobileTask) => taskEstimateFactor(ctx, t.titulo)
  const cap = (iso: string) => effectiveCapacity(ctx, iso, today)
  const pinned = new Set(opts.pinned ?? [])
  const recent = new Set(opts.recentlyMoved ?? [])
  const acceptedDays = new Set(opts.acceptOverloadDays ?? [])
  const maxMoves = opts.maxMoves ?? (opts.trigger === 'completed' ? 3 : 8)

  const open = tasks.filter((t) => t.status !== 'done')
  const load = buildDayLoad(open, today, HORIZON, factor)
  const byId = new Map(open.map((t) => [t.id, t]))
  const dayOf = new Map<string, string>()

  const items: Item[] = open
    .filter((t) => t.dataVencimento)
    .map((t) =>
    {
      const raw = t.dataVencimento!.slice(0, 10)
      const day = raw < today ? today : raw
      dayOf.set(t.id, day)
      const fixed = t.horaMinutos != null
      return {
        task: t,
        day,
        remaining: remainingMinutes(t, factor(t)),
        fixed,
        rigid: isTaskDeadlineRigid(t.anotacao),
        energy: energyOf(t),
        dependsOn: taskDependsOnId(t),
        movable: !fixed && !pinned.has(t.id) && t.status !== 'doing',
      }
    })

  const moves: BoardMove[] = []
  const movedNow = new Set<string>()

  const fits = (iso: string, minutes: number) => (load[iso] ?? 0) + minutes <= cap(iso)
  /** dia mínimo por dependência: não antes da tarefa de que depende */
  const minDayFor = (i: Item): string =>
  {
    if (!i.dependsOn) return today
    const dep = byId.get(i.dependsOn)
    if (!dep || dep.status === 'done') return today
    return dayOf.get(dep.id) ?? today
  }
  const move = (i: Item, to: string, kind: BoardMoveKind, reason: string) =>
  {
    load[i.day] = Math.max(0, (load[i.day] ?? 0) - i.remaining)
    load[to] = (load[to] ?? 0) + i.remaining
    moves.push({
      taskId: i.task.id,
      titulo: i.task.titulo,
      kind,
      from: i.task.dataVencimento ? i.task.dataVencimento.slice(0, 10) : null,
      to,
      reason,
    })
    i.day = to
    dayOf.set(i.task.id, to)
    movedNow.add(i.task.id)
  }
  const room = () => moves.length < maxMoves

  // A) Atrasadas: buildDayLoad já as conta em "hoje"; encontra o primeiro dia real com espaço
  if (opts.trigger !== 'completed')
  {
    const overdue = items
      .filter((i) => i.movable && i.task.dataVencimento!.slice(0, 10) < today)
      .sort((a, b) => a.task.prioridade - b.task.prioridade || (a.rigid === b.rigid ? 0 : a.rigid ? -1 : 1))
    for (const i of overdue)
    {
      if (!room()) break
      const from = i.task.dataVencimento!.slice(0, 10)
      load[today] = Math.max(0, (load[today] ?? 0) - i.remaining)
      const minDay = minDayFor(i)
      const urgent = i.rigid || i.task.prioridade === 1
      let target: string | null = null
      for (let d = 0; d <= HORIZON; d += 1)
      {
        const iso = addDaysIso(today, d)
        if (iso < minDay) continue
        if (iso === today && lowMood && i.energy === 'alta' && !urgent) continue
        if (fits(iso, i.remaining))
        {
          target = iso
          break
        }
      }
      // urgente fica hoje mesmo sem espaço; o resto espera o primeiro dia livre
      const to = urgent || !target ? today : target
      load[today] = (load[today] ?? 0) + i.remaining
      i.day = today
      const late = diffDaysIso(from, today)
      const reason = to === today
        ? `Passou ${late === 1 ? 'de ontem' : `há ${late} dias`}. ${urgent ? 'É urgente: fica para hoje.' : 'Hoje tem espaço para ela.'}`
        : `Passou ${late === 1 ? 'de ontem' : `há ${late} dias`}. Hoje está cheio; ${describeDayPt(to, ref).toLowerCase()} é o primeiro dia com espaço.`
      move(i, to, 'rescued_overdue', reason)
    }
  }

  // B) Dias acima do tempo livre: adia o que é mais flexível para o próximo dia com espaço
  if (opts.trigger !== 'completed')
  {
    for (let d = 0; d <= OVERLOAD_WINDOW && room(); d += 1)
    {
      const day = addDaysIso(today, d)
      if (acceptedDays.has(day)) continue
      let guard = 0
      while ((load[day] ?? 0) > cap(day) && room() && guard < 20)
      {
        guard += 1
        const candidates = items
          .filter((i) => i.day === day && i.movable && !i.rigid && !movedNow.has(i.task.id) && !recent.has(i.task.id))
          .sort((a, b) => keepScore(a, day) - keepScore(b, day) || b.remaining - a.remaining)
        let done = false
        for (const c of candidates)
        {
          let target: string | null = null
          for (let e = d + 1; e <= HORIZON; e += 1)
          {
            const iso = addDaysIso(today, e)
            if (fits(iso, c.remaining))
            {
              target = iso
              break
            }
          }
          if (!target) continue
          // dependentes desta tarefa não podem ficar antes dela
          const blocksDependent = items.some((x) => x.dependsOn === c.task.id && x.day < target!)
          if (blocksDependent) continue
          move(
            c,
            target,
            'deferred_load',
            `${describeDayPt(day, ref)} passou do seu tempo livre (${formatMinutesPt(load[day] ?? 0)} de ${formatMinutesPt(cap(day))}). ${describeDayPt(target, ref)} tem espaço.`,
          )
          done = true
          break
        }
        if (!done) break
      }
    }
  }

  // C) Sobrou tempo hoje: adianta o que tem prazo mais apertado
  if (opts.trigger === 'completed' || opts.trigger === 'morning' || opts.trigger === 'manual')
  {
    const maxPull = opts.trigger === 'completed' ? 2 : 3
    let pulled = 0
    const candidates = items
      .filter((i) =>
        i.movable
        && !movedNow.has(i.task.id)
        && !recent.has(i.task.id)
        && i.day > today
        && diffDaysIso(today, i.day) <= 6
        && (i.task.prioridade === 1 || i.rigid)
        && !(lowMood && i.energy === 'alta'))
      .sort((a, b) =>
        (a.rigid === b.rigid ? 0 : a.rigid ? -1 : 1)
        || (a.day < b.day ? -1 : a.day > b.day ? 1 : 0)
        || a.task.prioridade - b.task.prioridade)
    for (const i of candidates)
    {
      if (!room() || pulled >= maxPull) break
      if (minDayFor(i) > today) continue
      if (!fits(today, i.remaining)) continue
      // só adianta se deixar pelo menos 30 min de respiro hoje
      if ((load[today] ?? 0) + i.remaining > cap(today) - 30) continue
      const from = i.day
      move(
        i,
        today,
        'pulled_forward',
        `Sobrou tempo hoje. ${i.rigid ? 'Tem prazo firme' : 'É prioridade alta'} ${describeDayPt(from, ref).toLowerCase()}: adiantar tira o aperto.`,
      )
      pulled += 1
    }
  }

  const overloadedDays = Array.from({ length: OVERLOAD_WINDOW + 1 }, (_, d) => addDaysIso(today, d))
    .filter((iso) => (load[iso] ?? 0) > cap(iso) && !acceptedDays.has(iso))
    .map((iso) => ({ iso, minutos: Math.round(load[iso] ?? 0), capacidade: cap(iso) }))

  return { moves, overloadedDays, headline: replanHeadline(moves) }
}

export function replanHeadline(moves: BoardMove[]): string
{
  if (moves.length === 0) return 'Quadro em dia: nada para mover.'
  const n = moves.length
  return `Axel ${n === 1 ? 'moveu 1 tarefa' : `moveu ${n} tarefas`}`
}

/** Aplica movimentos a uma lista (útil para pré-visualização e testes). */
export function applyBoardMoves(tasks: MobileTask[], moves: BoardMove[]): MobileTask[]
{
  const to = new Map(moves.map((m) => [m.taskId, m.to]))
  return tasks.map((t) => (to.has(t.id) ? { ...t, dataVencimento: to.get(t.id)! } : t))
}
