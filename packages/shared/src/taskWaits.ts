import type { MobileTask } from './tasks'

/**
 * Esperas de uma tarefa: períodos em que ela não andava porque dependia de
 * outra pessoa (fazer a parte dela, responder, aprovar, enviar algo).
 * Uso pessoal, não é gestão de equipe: a pessoa é só um nome.
 * Banco: tarefa_esperas (migração 070).
 */
export type TaskWaitReason = 'fazer' | 'responder' | 'aprovar' | 'enviar' | 'outro'

export type TaskWaitChannel = 'whatsapp' | 'email' | 'telefone' | 'pessoalmente' | 'outro'

export interface TaskWait
{
  id: string
  taskId: string
  pessoa: string
  /** amigo do Círculo, quando quem você espera usa o app (migração 071) */
  amigoId?: string | null
  motivo: TaskWaitReason
  canal: TaskWaitChannel | null
  /** ISO: quando começou a espera */
  desde: string
  /** ISO: quando a pessoa voltou (null = ainda esperando) */
  ate: string | null
  /** ISO de cada vez que você cobrou */
  cobrancas: string[]
  nota: string
}

export const TASK_WAIT_REASONS: { id: TaskWaitReason; label: string; phrase: string }[] = [
  { id: 'fazer', label: 'Fazer a parte dela', phrase: 'fazer a parte' },
  { id: 'responder', label: 'Responder', phrase: 'responder' },
  { id: 'aprovar', label: 'Aprovar', phrase: 'aprovar' },
  { id: 'enviar', label: 'Enviar algo', phrase: 'enviar' },
  { id: 'outro', label: 'Outro', phrase: 'voltar' },
]

export const TASK_WAIT_CHANNELS: { id: TaskWaitChannel; label: string }[] = [
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'email', label: 'E-mail' },
  { id: 'telefone', label: 'Telefone' },
  { id: 'pessoalmente', label: 'Pessoalmente' },
  { id: 'outro', label: 'Outro' },
]

const MS_DAY = 86_400_000

export function waitReasonPhrase(motivo: TaskWaitReason): string
{
  return TASK_WAIT_REASONS.find((r) => r.id === motivo)?.phrase ?? 'voltar'
}

/** "Esperando Ana responder" */
export function waitHeadline(w: TaskWait): string
{
  return `Esperando ${w.pessoa} ${waitReasonPhrase(w.motivo)}`
}

/** Espera em aberto da tarefa (a mais recente), se houver. */
export function openWaitFor(waits: TaskWait[], taskId: string): TaskWait | null
{
  let best: TaskWait | null = null
  for (const w of waits)
  {
    if (w.taskId !== taskId || w.ate) continue
    if (!best || w.desde > best.desde) best = w
  }
  return best
}

export function waitsForTask(waits: TaskWait[], taskId: string): TaskWait[]
{
  return waits.filter((w) => w.taskId === taskId).sort((a, b) => (a.desde < b.desde ? 1 : -1))
}

/**
 * Fim efetivo da espera: quando voltou; se a tarefa foi concluída com a espera
 * aberta, a conclusão encerra a espera; senão, agora.
 */
export function waitEnd(w: TaskWait, task: MobileTask | undefined, now = new Date()): Date
{
  if (w.ate) return new Date(w.ate)
  if (task?.status === 'done' && task.concluidoEm) return new Date(task.concluidoEm)
  return now
}

export function waitMs(w: TaskWait, task: MobileTask | undefined, now = new Date()): number
{
  return Math.max(0, waitEnd(w, task, now).getTime() - new Date(w.desde).getTime())
}

/** Dias inteiros de calendário desde o início (0 = hoje). */
export function waitDays(w: TaskWait, task?: MobileTask, now = new Date()): number
{
  const a = new Date(w.desde)
  const b = waitEnd(w, task, now)
  const da = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime()
  const db = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime()
  return Math.max(0, Math.round((db - da) / MS_DAY))
}

export function formatWaitAge(days: number): string
{
  if (days <= 0) return 'desde hoje'
  if (days === 1) return 'há 1 dia'
  return `há ${days} dias`
}

export function formatDuration(ms: number): string
{
  const hours = ms / 3_600_000
  if (hours < 1) return 'menos de 1 h'
  if (hours < 24) return `${Math.round(hours)} h`
  const days = hours / 24
  return days < 10 ? `${days.toFixed(1).replace('.', ',')} dias` : `${Math.round(days)} dias`
}

/** Selo curto para a lista: "Ana · 3 d" */
export function waitBadge(w: TaskWait, now = new Date()): string
{
  const d = waitDays(w, undefined, now)
  return `${w.pessoa} · ${d <= 0 ? 'hoje' : `${d} d`}`
}

/** Hora de cobrar? Sem retorno há 3 dias desde o início ou desde a última cobrança. */
export function waitNeedsNudge(w: TaskWait, now = new Date(), afterDays = 3): boolean
{
  if (w.ate) return false
  const last = w.cobrancas.length ? w.cobrancas[w.cobrancas.length - 1] : w.desde
  return now.getTime() - new Date(last).getTime() >= afterDays * MS_DAY
}

/** Pessoas usadas antes, das mais recentes para as mais antigas (sugestões no formulário). */
export function recentWaitPeople(waits: TaskWait[], limit = 6): string[]
{
  const seen = new Map<string, string>()
  for (const w of [...waits].sort((a, b) => (a.desde < b.desde ? 1 : -1)))
  {
    const key = w.pessoa.trim().toLowerCase()
    if (key && !seen.has(key)) seen.set(key, w.pessoa.trim())
  }
  return [...seen.values()].slice(0, limit)
}

/** Une períodos sobrepostos para não contar a mesma espera duas vezes. */
function unionMs(ranges: [number, number][]): number
{
  const sorted = ranges.filter(([a, b]) => b > a).sort((x, y) => x[0] - y[0])
  let total = 0
  let curA = -1
  let curB = -1
  for (const [a, b] of sorted)
  {
    if (a > curB)
    {
      if (curB > curA) total += curB - curA
      curA = a
      curB = b
    }
    else if (b > curB) curB = b
  }
  if (curB > curA) total += curB - curA
  return total
}

/** Ids das tarefas abertas que estão paradas esperando alguém. */
export function waitingTaskIds(waits: TaskWait[]): Set<string>
{
  const ids = new Set<string>()
  for (const w of waits) if (!w.ate) ids.add(w.taskId)
  return ids
}

/**
 * Só o que dá para tocar agora: tira as tarefas em espera. O Axel usa isso
 * para não sugerir, não puxar para hoje e não contar carga de algo travado.
 */
export function actionableTasks<T extends { id: string; status: string }>(tasks: T[], waits: TaskWait[]): T[]
{
  const blocked = waitingTaskIds(waits)
  if (blocked.size === 0) return tasks
  return tasks.filter((t) => t.status === 'done' || !blocked.has(t.id))
}

export type TaskTimeSplit = {
  /** do início (criação ou primeira espera) até a conclusão ou agora */
  totalMs: number
  /** tempo parado esperando outras pessoas (períodos sobrepostos contam uma vez) */
  esperaMs: number
  /** tempo que a tarefa ficou com você: o relógio da tarefa sem as esperas */
  ativoMs: number
  /** o relógio está pausado agora (espera aberta numa tarefa não concluída) */
  pausado: boolean
}

/** Relógio da tarefa: pausa enquanto você espera alguém e volta quando a pessoa responde. */
export function taskTimeSplit(task: MobileTask, waits: TaskWait[], now = new Date()): TaskTimeSplit
{
  const list = waits.filter((w) => w.taskId === task.id)
  const ranges = list.map((w) => [new Date(w.desde).getTime(), waitEnd(w, task, now).getTime()] as [number, number])
  const esperaMs = unionMs(ranges)
  const firstWait = ranges.length ? Math.min(...ranges.map((r) => r[0])) : Number.POSITIVE_INFINITY
  const created = task.criadoEm ? new Date(task.criadoEm).getTime() : Number.POSITIVE_INFINITY
  const start = Math.min(created, firstWait)
  const end = task.status === 'done' && task.concluidoEm ? new Date(task.concluidoEm).getTime() : now.getTime()
  const totalMs = Number.isFinite(start) ? Math.max(esperaMs, end - start) : esperaMs
  return {
    totalMs,
    esperaMs,
    ativoMs: Math.max(0, totalMs - esperaMs),
    pausado: task.status !== 'done' && list.some((w) => !w.ate),
  }
}

export type WaitPersonStat = {
  pessoa: string
  esperas: number
  abertas: number
  cobrancas: number
  totalMs: number
  mediaMs: number
}

export type WaitTaskBreakdown = {
  task: MobileTask
  /** do início (criação ou primeira espera) até a conclusão ou agora */
  totalMs: number
  esperaMs: number
  /** tempo com você (total sem as esperas) */
  ativoMs: number
  pessoas: string[]
}

export type WaitReport = {
  abertas: { wait: TaskWait; task: MobileTask | undefined; days: number; nudge: boolean }[]
  pessoas: WaitPersonStat[]
  /** tarefas com espera no período, mais demoradas primeiro */
  tarefas: WaitTaskBreakdown[]
  esperaTotalMs: number
  ativoTotalMs: number
  /** fração do tempo dessas tarefas que foi espera (0..1), null sem base */
  fracaoEspera: number | null
  cobrancasTotal: number
}

/**
 * Relatório das esperas que tocaram a janela `[now - days, now]`.
 * O tempo de cada tarefa vai da criação (ou da primeira espera, se não houver
 * data de criação) até a conclusão ou agora.
 */
export function buildWaitReport(
  tasks: MobileTask[],
  waits: TaskWait[],
  now = new Date(),
  days = 30,
): WaitReport
{
  const since = now.getTime() - days * MS_DAY
  const byId = new Map(tasks.map((t) => [t.id, t]))
  const relevant = waits.filter((w) =>
  {
    const task = byId.get(w.taskId)
    return waitEnd(w, task, now).getTime() >= since
  })

  const abertas = relevant
    .filter((w) =>
    {
      const t = byId.get(w.taskId)
      return !w.ate && t?.status !== 'done'
    })
    .map((w) => ({
      wait: w,
      task: byId.get(w.taskId),
      days: waitDays(w, undefined, now),
      nudge: waitNeedsNudge(w, now),
    }))
    .sort((a, b) => b.days - a.days)

  const people = new Map<string, WaitPersonStat>()
  for (const w of relevant)
  {
    const key = w.pessoa.trim().toLowerCase()
    const task = byId.get(w.taskId)
    const ms = waitMs(w, task, now)
    const cur = people.get(key) ?? {
      pessoa: w.pessoa.trim(),
      esperas: 0,
      abertas: 0,
      cobrancas: 0,
      totalMs: 0,
      mediaMs: 0,
    }
    cur.esperas += 1
    cur.totalMs += ms
    cur.cobrancas += w.cobrancas.length
    if (!w.ate && task?.status !== 'done') cur.abertas += 1
    people.set(key, cur)
  }
  const pessoas = [...people.values()]
    .map((p) => ({ ...p, mediaMs: p.esperas ? p.totalMs / p.esperas : 0 }))
    .sort((a, b) => b.totalMs - a.totalMs)

  const grouped = new Map<string, TaskWait[]>()
  for (const w of relevant)
  {
    const list = grouped.get(w.taskId) ?? []
    list.push(w)
    grouped.set(w.taskId, list)
  }

  let esperaTotalMs = 0
  let baseMs = 0
  const tarefas: WaitTaskBreakdown[] = []
  for (const [taskId, list] of grouped)
  {
    const task = byId.get(taskId)
    if (!task) continue
    const { totalMs, esperaMs, ativoMs } = taskTimeSplit(task, list, now)
    esperaTotalMs += esperaMs
    baseMs += totalMs
    tarefas.push({
      task,
      totalMs,
      esperaMs,
      ativoMs,
      pessoas: [...new Set(list.map((w) => w.pessoa.trim()))],
    })
  }
  tarefas.sort((a, b) => b.esperaMs - a.esperaMs)

  return {
    abertas,
    pessoas,
    tarefas,
    esperaTotalMs,
    ativoTotalMs: Math.max(0, baseMs - esperaTotalMs),
    fracaoEspera: baseMs > 0 ? esperaTotalMs / baseMs : null,
    cobrancasTotal: relevant.reduce((n, w) => n + w.cobrancas.length, 0),
  }
}

/**
 * Etapa planejada com outra pessoa, ainda sem espera aberta: "no meio do
 * caminho a Ana precisa aprovar". Fica nas notas como #com:<nome>|<motivo>|<amigo>
 * (sobrevive às edições como as outras tags) e vira espera com um toque.
 */
export type PlannedHelper = {
  pessoa: string
  motivo: TaskWaitReason
  amigoId: string | null
}

const COM_TAG_RE = /#com:(\S+)/g
const REASONS = new Set<string>(['fazer', 'responder', 'aprovar', 'enviar', 'outro'])

export function parsePlannedHelpers(notas: string): PlannedHelper[]
{
  const out: PlannedHelper[] = []
  for (const m of (notas || '').matchAll(COM_TAG_RE))
  {
    const [rawName, rawReason, rawFriend] = m[1]!.split('|')
    let pessoa = ''
    try
    {
      pessoa = decodeURIComponent(rawName ?? '').trim()
    }
    catch
    {
      pessoa = (rawName ?? '').trim()
    }
    if (!pessoa) continue
    out.push({
      pessoa,
      motivo: REASONS.has(rawReason ?? '') ? (rawReason as TaskWaitReason) : 'fazer',
      amigoId: rawFriend && rawFriend !== '-' ? rawFriend : null,
    })
  }
  return out
}

function helperTag(h: PlannedHelper): string
{
  return `#com:${encodeURIComponent(h.pessoa.trim())}|${h.motivo}|${h.amigoId ?? '-'}`
}

/** Regrava as etapas planejadas nas notas (substitui as anteriores). */
export function stampPlannedHelpers(notas: string, helpers: PlannedHelper[]): string
{
  const clean = (notas || '').replace(COM_TAG_RE, '').replace(/\n{2,}/g, '\n').trim()
  const tags = helpers.filter((h) => h.pessoa.trim()).map(helperTag)
  return [clean, ...tags].filter(Boolean).join('\n')
}

/** Tira uma etapa planejada (quando ela vira espera de verdade ou é descartada). */
export function removePlannedHelper(notas: string, index: number): string
{
  const list = parsePlannedHelpers(notas)
  return stampPlannedHelpers(notas, list.filter((_, i) => i !== index))
}
