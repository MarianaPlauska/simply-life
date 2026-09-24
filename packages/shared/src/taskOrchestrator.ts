/**
 * Orquestrador de encaixe: para cada rascunho vindo do prompt, gera alternativas
 * de dia/formato (várias estratégias), recomenda uma conforme o estilo do usuário
 * e sinaliza parâmetros (prazo firme, dia cheio, saldo, duplicata...).
 * Determinístico, sem IA - a IA só interpreta o texto (taskPrompt.ts).
 */
import type { ContaFixa } from './financeAccounts'
import { formatBRL } from './finance'
import type { MobileTask, TaskStatus } from './tasks'
import { localTodayIso } from './dates'
import { suggestTaskSteps } from './taskBreakdown'
import { learnedFactorFor, type TimeLearning } from './timeLearning'
import {
  addDaysIso,
  diffDaysIso,
  nextMonthDayIso,
  weekdayOfIso,
  type TaskPromptDraft,
} from './taskPrompt'

export type OrchestratorStyle = 'equilibrado' | 'antecipar' | 'no_prazo' | 'leveza' | 'financeiro'

export const ORCHESTRATOR_STYLES: { id: OrchestratorStyle; label: string; hint: string }[] = [
  { id: 'equilibrado', label: 'Equilibrado', hint: 'Mistura prazo, carga do dia e energia.' },
  { id: 'antecipar', label: 'Adiantar', hint: 'Faz o quanto antes, enquanto há espaço.' },
  { id: 'no_prazo', label: 'No prazo', hint: 'Deixa para perto do prazo, com folga.' },
  { id: 'leveza', label: 'Leveza', hint: 'Dias leves, tarefas grandes em passos.' },
  { id: 'financeiro', label: 'Dinheiro', hint: 'Gastos no melhor dia para o saldo.' },
]

export type PlacementStrategy =
  | 'compromisso'
  | 'agora'
  | 'logo'
  | 'prazo_seguro'
  | 'dia_leve'
  | 'energia'
  | 'financeiro'
  | 'quebrar'
  | 'intencao'

export type PlacementOption = {
  strategy: PlacementStrategy
  label: string
  dataVencimento: string | null
  horaMinutos: number | null
  status: TaskStatus
  /** null = manter o checklist do rascunho */
  checklist: string[] | null
  rationale: string
  score: number
}

export type TaskSignalKind =
  | 'prazo_rigido'
  | 'dia_cheio'
  | 'humor_baixo'
  | 'sem_saldo'
  | 'peso_saldo'
  | 'conta_vinculada'
  | 'duplicada'
  | 'recorrente'
  | 'tarefa_grande'
  | 'sem_prazo'
  | 'baixa_confianca'

export type TaskSignal = {
  kind: TaskSignalKind
  tone: 'info' | 'warn' | 'danger'
  label: string
}

export type OrchestratorFinance = {
  saldoDisponivel: number
  fixas: ContaFixa[]
  cards?: { id: string; nome: string; diaVencimento: number }[]
  /** Próxima entrada de dinheiro prevista (ISO), se o app souber */
  proximaReceitaIso?: string | null
}

export type OrchestratorContext = {
  ref?: Date
  openTasks: MobileTask[]
  /** minutos úteis por dia para tarefas (padrão 240) */
  capacityMinutes?: number
  horizonDays?: number
  /** humor de hoje 1-5 (null se não registrou) */
  moodToday?: number | null
  finance?: OrchestratorFinance | null
  style?: OrchestratorStyle
  /** minutos ocupados pela agenda (.ics) por dia */
  busyByDay?: Record<string, number>
  /** folga nas estimativas (perfil TDAH: 1.25) */
  estimateFactor?: number
  /** o que o Axel aprendeu do tempo real (sessões de foco) */
  learning?: TimeLearning | null
}

/** Fator de tempo de uma tarefa: aprendido do tipo > aprendido geral > folga manual. */
export function taskEstimateFactor(ctx: Pick<OrchestratorContext, 'learning' | 'estimateFactor'>, titulo: string): number
{
  return learnedFactorFor(titulo, ctx.learning, ctx.estimateFactor ?? 1)
}

/** Janela ativa do dia considerada para "tempo livre" (8h–21h30). */
export const ACTIVE_DAY_MINUTES = 13 * 60 + 30

/**
 * Tempo livre para tarefas num dia: o menor entre o que a pessoa escolheu
 * e o que a agenda realmente deixa livre. Humor baixo hoje reduz 40%.
 */
export function effectiveCapacity(ctx: OrchestratorContext, iso: string, today: string): number
{
  const base = ctx.capacityMinutes ?? DEFAULT_CAPACITY
  const busy = ctx.busyByDay?.[iso] ?? 0
  let cap = Math.min(base, ACTIVE_DAY_MINUTES - busy)
  if (iso === today && ctx.moodToday != null && ctx.moodToday <= 2) cap = Math.round(cap * 0.6)
  return Math.max(30, cap)
}

export type DraftPlan = {
  key: string
  options: PlacementOption[]
  recommended: PlacementStrategy
  signals: TaskSignal[]
}

export type PlanSummary = {
  count: number
  totalMinutes: number
  gastosPrevistos: number
  alertas: number
  dias: { iso: string; minutos: number; capacidade: number }[]
}

const DEFAULT_CAPACITY = 240
const DEFAULT_HORIZON = 14
const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const STYLE_BONUS: Record<OrchestratorStyle, Partial<Record<PlacementStrategy, number>>> = {
  equilibrado: {},
  antecipar: { logo: 20, agora: 5, energia: 5 },
  no_prazo: { prazo_seguro: 22, financeiro: 5 },
  leveza: { dia_leve: 20, quebrar: 12, intencao: 6 },
  financeiro: { financeiro: 25 },
}

/** "Hoje", "Amanhã", "Qui 26/09" */
export function describeDayPt(iso: string | null, ref = new Date()): string
{
  if (!iso) return 'Sem data'
  const today = localTodayIso(ref)
  const diff = diffDaysIso(today, iso)
  if (diff === 0) return 'Hoje'
  if (diff === 1) return 'Amanhã'
  if (diff === -1) return 'Ontem'
  const [, m, d] = iso.split('-')
  return `${WEEKDAY_SHORT[weekdayOfIso(iso)]} ${d}/${m}`
}

export function formatMinutesPt(total: number): string
{
  const m = Math.max(0, Math.round(total))
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const r = m % 60
  return r ? `${h}h${String(r).padStart(2, '0')}` : `${h}h`
}

/**
 * Próxima entrada de dinheiro prevista a partir do histórico: pega a maior receita
 * dos últimos 2 meses (salário, em geral) e projeta o mesmo dia no próximo ciclo.
 */
export function estimateNextIncomeIso(
  txs: { data: string; tipo: 'despesa' | 'receita'; valor: number }[],
  ref = new Date(),
): string | null
{
  const today = localTodayIso(ref)
  const since = addDaysIso(today, -62)
  const incomes = txs.filter((t) => t.tipo === 'receita' && t.valor > 0 && t.data >= since && t.data <= today)
  if (incomes.length === 0) return null
  const biggest = incomes.reduce((a, b) => (b.valor > a.valor ? b : a))
  const day = Number(biggest.data.slice(8, 10))
  if (!day) return null
  return nextMonthDayIso(addDaysIso(today, 1), day)
}

/** Minutos já comprometidos por dia (atrasadas contam em hoje). */
export function buildDayLoad(
  openTasks: MobileTask[],
  today: string,
  horizonDays = DEFAULT_HORIZON,
  estimateFactor: number | ((t: MobileTask) => number) = 1,
): Record<string, number>
{
  const load: Record<string, number> = {}
  for (let i = 0; i <= horizonDays + 31; i += 1) load[addDaysIso(today, i)] = 0
  for (const t of openTasks)
  {
    if (t.status === 'done' || !t.dataVencimento) continue
    const day = t.dataVencimento.slice(0, 10) < today ? today : t.dataVencimento.slice(0, 10)
    if (!(day in load)) continue
    const factor = typeof estimateFactor === 'function' ? estimateFactor(t) : estimateFactor
    const remaining = Math.max(0, (t.estimativaMinutos || 30) * (1 - (t.progresso || 0)) * factor)
    load[day] += remaining
  }
  return load
}

type Env = {
  today: string
  load: Record<string, number>
  cap: (iso: string) => number
  ctx: OrchestratorContext
  style: OrchestratorStyle
}

function capacityFn(ctx: OrchestratorContext, today: string): (iso: string) => number
{
  return (iso) => effectiveCapacity(ctx, iso, today)
}

function fits(env: Env, iso: string, minutes: number): boolean
{
  return (env.load[iso] ?? 0) + minutes <= env.cap(iso)
}

function daysBetween(from: string, to: string): string[]
{
  const out: string[] = []
  const n = Math.max(0, diffDaysIso(from, to))
  for (let i = 0; i <= n; i += 1) out.push(addDaysIso(from, i))
  return out
}

function deadlineOf(draft: TaskPromptDraft, today: string): string | null
{
  if (!draft.dataVencimento) return null
  return draft.dataVencimento < today ? today : draft.dataVencimento
}

/** Último dia "seguro": prazo firme ganha 1 dia de folga. */
function lastSafeDay(draft: TaskPromptDraft, today: string): string | null
{
  const d = deadlineOf(draft, today)
  if (!d) return null
  if (!draft.prazoRigido) return d
  const prev = addDaysIso(d, -1)
  return prev < today ? today : prev
}

function windowEnd(draft: TaskPromptDraft, today: string): string
{
  const safe = lastSafeDay(draft, today)
  if (safe) return safe
  const span = draft.prioridade === 1 ? 2 : draft.prioridade === 2 ? 6 : 13
  return addDaysIso(today, span)
}

function option(
  env: Env,
  draft: TaskPromptDraft,
  strategy: PlacementStrategy,
  partial: Omit<PlacementOption, 'strategy' | 'score' | 'status' | 'checklist' | 'horaMinutos'> & {
    base: number
    status?: TaskStatus
    checklist?: string[] | null
    horaMinutos?: number | null
  },
): PlacementOption
{
  let score = partial.base + (STYLE_BONUS[env.style][strategy] ?? 0)
  const day = partial.dataVencimento
  const fixedSlot = strategy === 'agora' || strategy === 'compromisso'
  if (day && !fixedSlot && !fits(env, day, draft.estimativaMinutos)) score -= 30
  if (draft.prioridade === 1 && (strategy === 'logo' || strategy === 'agora')) score += 10
  if (draft.prioridade === 1 && strategy === 'dia_leve') score -= 5
  const deadline = deadlineOf(draft, env.today)
  if (draft.prazoRigido && deadline && day && day > deadline) score -= 100
  return {
    strategy,
    label: partial.label,
    dataVencimento: day,
    horaMinutos: partial.horaMinutos ?? draft.horaMinutos,
    status: partial.status ?? 'todo',
    checklist: partial.checklist ?? null,
    rationale: partial.rationale,
    score,
  }
}

function buildOptions(draft: TaskPromptDraft, env: Env): PlacementOption[]
{
  const { today, ctx } = env
  const est = Math.round(draft.estimativaMinutos * taskEstimateFactor(ctx, draft.titulo))
  const deadline = deadlineOf(draft, today)
  const safe = lastSafeDay(draft, today)
  const end = windowEnd(draft, today)
  // A janela vai até o próprio prazo; a folga de 1 dia só pesa na estratégia "No prazo".
  const window = daysBetween(today, deadline ?? end)
  const lowMood = ctx.moodToday != null && ctx.moodToday <= 2
  const opts: PlacementOption[] = []
  const ref = ctx.ref ?? new Date()

  // 0. Compromisso: dia + hora explícitos não se remanejam (reunião, consulta)
  if (draft.dataVencimento && draft.horaMinutos != null)
  {
    const h = Math.floor(draft.horaMinutos / 60)
    const m = draft.horaMinutos % 60
    return [option(env, draft, 'compromisso', {
      base: 100,
      label: `Compromisso · ${describeDayPt(deadline, ref)} ${h}:${String(m).padStart(2, '0')}`,
      dataVencimento: deadline,
      rationale: 'Dia e hora marcados: o Axel mantém e organiza o resto em volta.',
    })]
  }

  // 1. Regra dos 2 minutos (GTD): coisa rápida não entra em fila
  if (est <= 5)
  {
    opts.push(option(env, draft, 'agora', {
      base: 95,
      label: 'Fazer já',
      dataVencimento: today,
      status: 'doing',
      rationale: 'Leva poucos minutos. Planejar custa mais que fazer.',
    }))
  }

  // 2. Logo: primeiro dia com espaço
  const firstFit = window.find((d) => fits(env, d, est)) ?? today
  opts.push(option(env, draft, 'logo', {
    base: 62,
    label: `Logo · ${describeDayPt(firstFit, ref)}`,
    dataVencimento: firstFit,
    rationale: fits(env, firstFit, est)
      ? 'Primeiro dia com espaço livre na agenda.'
      : 'Nenhum dia da janela tem folga; entra hoje mesmo assim.',
  }))

  // 3. Prazo seguro: o mais tarde possível, com folga antes do prazo
  if (deadline && safe)
  {
    const back = daysBetween(today, safe).reverse()
    // sem folga antes: o próprio dia do prazo, se couber
    const lateFit = back.find((d) => fits(env, d, est))
      ?? (fits(env, deadline, est) ? deadline : safe)
    opts.push(option(env, draft, 'prazo_seguro', {
      base: draft.prazoRigido ? 76 : 66,
      label: `No prazo · ${describeDayPt(lateFit, ref)}`,
      dataVencimento: lateFit,
      rationale: draft.prazoRigido
        ? `Prazo firme ${describeDayPt(deadline, ref).toLowerCase()}: fica pronta com 1 dia de folga.`
        : 'Perto do prazo, sem ocupar os dias de agora.',
    }))
  }

  // 4. Dia mais leve da janela
  const leveWindow = deadline ? window : daysBetween(today, addDaysIso(today, Math.max(6, window.length - 1)))
  const lightest = [...leveWindow].sort((a, b) => (env.load[a] ?? 0) - (env.load[b] ?? 0) || (a < b ? -1 : 1))[0]
  if (lightest)
  {
    opts.push(option(env, draft, 'dia_leve', {
      base: 60,
      label: `Dia leve · ${describeDayPt(lightest, ref)}`,
      dataVencimento: lightest,
      rationale: `Dia com menos carga (${formatMinutesPt(env.load[lightest] ?? 0)} já planejados).`,
    }))
  }

  // 5. Energia: tarefa pesada no pico de foco (manhã), fora de dia de humor baixo
  if (draft.energia === 'alta')
  {
    const candidates = window.filter((d) => !(lowMood && d === today) && fits(env, d, est))
    const best = candidates.sort((a, b) =>
      (env.cap(b) - (env.load[b] ?? 0)) - (env.cap(a) - (env.load[a] ?? 0)) || (a < b ? -1 : 1))[0]
      ?? (lowMood && window.length > 1 ? window[1] : window[0])
    opts.push(option(env, draft, 'energia', {
      base: lowMood ? 72 : 64,
      label: `Foco · ${describeDayPt(best, ref)} de manhã`,
      dataVencimento: best,
      horaMinutos: draft.horaMinutos ?? 9 * 60,
      rationale: lowMood && best !== today
        ? 'Exige energia e hoje o humor está baixo: vai para um dia com mais fôlego.'
        : 'Exige energia: bloco de manhã, no dia com mais espaço livre.',
    }))
  }

  // 6. Financeiro: pagar antes do vencimento / depois da próxima entrada
  const fin = draft.financeiro
  if (fin && fin.tipo === 'despesa')
  {
    const fixa = fin.fixaId != null ? ctx.finance?.fixas.find((f) => f.id === fin.fixaId) : null
    const card = fin.cardId ? ctx.finance?.cards?.find((c) => c.id === fin.cardId) : null
    const saldo = ctx.finance?.saldoDisponivel
    const semSaldo = fin.valor != null && saldo != null && fin.valor > saldo
    const dueDay = fixa?.diaVencimento ?? card?.diaVencimento
    if (dueDay)
    {
      const due = nextMonthDayIso(today, dueDay)
      let day = addDaysIso(due, -1) < today ? today : addDaysIso(due, -1)
      if (deadline && day > deadline) day = deadline
      opts.push(option(env, draft, 'financeiro', {
        base: 78,
        label: `Antes do vencimento · ${describeDayPt(day, ref)}`,
        dataVencimento: day,
        rationale: `${fixa ? `A conta “${fixa.nome}”` : `A fatura do ${card?.nome}`} vence ${describeDayPt(due, ref).toLowerCase()}. Pagar 1 dia antes evita juros.`,
      }))
    }
    else if (semSaldo && ctx.finance?.proximaReceitaIso && ctx.finance.proximaReceitaIso >= today)
    {
      const day = ctx.finance.proximaReceitaIso
      if (!(draft.prazoRigido && deadline && day > deadline))
      {
        opts.push(option(env, draft, 'financeiro', {
          base: 74,
          label: `Depois da entrada · ${describeDayPt(day, ref)}`,
          dataVencimento: day,
          rationale: 'O saldo de hoje não cobre esse gasto; espera a próxima entrada de dinheiro.',
        }))
      }
    }
    else if (fin.valor != null && fin.valor > 0 && !semSaldo)
    {
      const day = firstFit
      opts.push(option(env, draft, 'financeiro', {
        base: 58,
        label: `Resolver o gasto · ${describeDayPt(day, ref)}`,
        dataVencimento: day,
        rationale: `Cabe no saldo disponível; resolver cedo evita a despesa pendurada.`,
      }))
    }
  }

  // 7. Quebrar em passos: tarefa grande vira checklist distribuído até o prazo
  if (est >= 90)
  {
    const steps = draft.checklist.length >= 2
      ? draft.checklist
      : suggestTaskSteps(draft.titulo, draft.descricao, 5)
    const chunk = Math.ceil(est / Math.max(1, steps.length))
    const start = window.find((d) => fits(env, d, chunk)) ?? today
    const due = deadline ?? end
    opts.push(option(env, draft, 'quebrar', {
      // passos escritos pelo próprio usuário valem mais que os sugeridos
      base: (est >= 180 ? 76 : 58) + (draft.checklist.length >= 2 ? 16 : 0),
      label: `Em ${steps.length} passos até ${describeDayPt(due, ref)}`,
      dataVencimento: due,
      checklist: steps,
      rationale: `Começa ${describeDayPt(start, ref).toLowerCase()} com ~${formatMinutesPt(chunk)}; um passo por vez até o prazo.`,
    }))
  }

  // 8. Intenção: sem prazo e sem pressa
  if (!deadline && draft.prioridade === 3)
  {
    opts.push(option(env, draft, 'intencao', {
      base: 70,
      label: 'Guardar em Intenções',
      dataVencimento: null,
      horaMinutos: null,
      rationale: 'Sem prazo e sem pressa: fica visível sem pesar na semana.',
    }))
  }

  // Remove alternativas equivalentes (mesmo dia/hora/formato), fica a de maior score
  const byKey = new Map<string, PlacementOption>()
  for (const o of opts.filter((x) => x.score > -50))
  {
    const k = `${o.dataVencimento}|${o.horaMinutos}|${o.status}|${o.checklist ? 'c' : ''}`
    const prev = byKey.get(k)
    if (!prev || o.score > prev.score) byKey.set(k, o)
  }
  return [...byKey.values()].sort((a, b) => b.score - a.score).slice(0, 4)
}

function buildSignals(draft: TaskPromptDraft, chosen: PlacementOption | undefined, env: Env): TaskSignal[]
{
  const { today, ctx } = env
  const ref = ctx.ref ?? new Date()
  const s: TaskSignal[] = []
  const deadline = deadlineOf(draft, today)

  if (draft.prazoRigido && deadline)
  {
    s.push({
      kind: 'prazo_rigido',
      tone: diffDaysIso(today, deadline) <= 1 ? 'danger' : 'warn',
      label: `Prazo firme: ${describeDayPt(deadline, ref)}`,
    })
  }
  if (chosen?.dataVencimento && !fits(env, chosen.dataVencimento, draft.estimativaMinutos))
  {
    s.push({
      kind: 'dia_cheio',
      tone: 'warn',
      label: `${describeDayPt(chosen.dataVencimento, ref)} já tem ${formatMinutesPt(env.load[chosen.dataVencimento] ?? 0)} planejados`,
    })
  }
  if (ctx.moodToday != null && ctx.moodToday <= 2 && draft.energia === 'alta' && chosen?.strategy !== 'compromisso')
  {
    s.push({ kind: 'humor_baixo', tone: 'info', label: 'Humor baixo hoje: tarefa pesada merece outro dia' })
  }

  const fin = draft.financeiro
  const saldo = ctx.finance?.saldoDisponivel
  if (fin && fin.tipo === 'despesa' && fin.valor != null && saldo != null)
  {
    if (fin.valor > saldo)
    {
      s.push({
        kind: 'sem_saldo',
        tone: 'danger',
        label: `${formatBRL(fin.valor)} passa do saldo disponível (${formatBRL(saldo)})`,
      })
    }
    else if (saldo > 0 && fin.valor / saldo >= 0.3)
    {
      s.push({
        kind: 'peso_saldo',
        tone: 'warn',
        label: `Pesa ${Math.round((fin.valor / saldo) * 100)}% do saldo disponível`,
      })
    }
  }
  if (fin?.fixaId != null)
  {
    const fixa = ctx.finance?.fixas.find((f) => f.id === fin.fixaId)
    if (fixa)
    {
      s.push({ kind: 'conta_vinculada', tone: 'info', label: `Conta fixa “${fixa.nome}” · vence dia ${fixa.diaVencimento}` })
    }
  }
  if (draft.duplicateOfId)
  {
    const dup = ctx.openTasks.find((t) => t.id === draft.duplicateOfId)
    if (dup) s.push({ kind: 'duplicada', tone: 'warn', label: `Parecida com “${dup.titulo}”, já no quadro` })
  }
  if (draft.recorrencia)
  {
    const r = { diaria: 'todo dia', semanal: 'toda semana', mensal: 'todo mês' }[draft.recorrencia]
    s.push({ kind: 'recorrente', tone: 'info', label: `Parece recorrente (${r}): vale virar rotina` })
  }
  if (draft.estimativaMinutos >= 120)
  {
    s.push({ kind: 'tarefa_grande', tone: 'info', label: `Tarefa grande (~${formatMinutesPt(draft.estimativaMinutos)})` })
  }
  if (!deadline && draft.prioridade !== 3)
  {
    s.push({ kind: 'sem_prazo', tone: 'info', label: 'Sem prazo: Axel sugeriu um dia' })
  }
  if (draft.confianca < 0.5)
  {
    s.push({ kind: 'baixa_confianca', tone: 'warn', label: 'Leitura incerta: confira os campos' })
  }
  return s
}

/** Ordem de encaixe: urgentes e prazos firmes primeiro, para ocuparem os melhores dias. */
function placementOrder(drafts: TaskPromptDraft[]): TaskPromptDraft[]
{
  return [...drafts].sort((a, b) =>
  {
    if (a.prioridade !== b.prioridade) return a.prioridade - b.prioridade
    if (a.prazoRigido !== b.prazoRigido) return a.prazoRigido ? -1 : 1
    const da = a.dataVencimento ?? '9999'
    const db = b.dataVencimento ?? '9999'
    return da < db ? -1 : da > db ? 1 : 0
  })
}

/**
 * Planeja todos os rascunhos juntos: cada encaixe ocupa carga do dia,
 * então 5 tarefas novas não caem todas em "hoje".
 * `chosen` fixa a estratégia que o usuário escolheu para um rascunho.
 */
export function planTaskDrafts(
  drafts: TaskPromptDraft[],
  ctx: OrchestratorContext,
  chosen: Record<string, PlacementStrategy | undefined> = {},
): DraftPlan[]
{
  const ref = ctx.ref ?? new Date()
  const today = localTodayIso(ref)
  const horizon = ctx.horizonDays ?? DEFAULT_HORIZON
  const env: Env = {
    today,
    load: buildDayLoad(ctx.openTasks, today, horizon, (t) => taskEstimateFactor(ctx, t.titulo)),
    cap: capacityFn(ctx, today),
    ctx,
    style: ctx.style ?? 'equilibrado',
  }

  const plans = new Map<string, DraftPlan>()
  for (const draft of placementOrder(drafts))
  {
    const options = buildOptions(draft, env)
    const pick = options.find((o) => o.strategy === chosen[draft.key]) ?? options[0]
    const signals = buildSignals(draft, pick, env)
    plans.set(draft.key, {
      key: draft.key,
      options,
      recommended: options[0]?.strategy ?? 'logo',
      signals,
    })
    if (pick?.dataVencimento)
    {
      env.load[pick.dataVencimento] = (env.load[pick.dataVencimento] ?? 0) + draft.estimativaMinutos
    }
  }
  return drafts.map((d) => plans.get(d.key)!).filter(Boolean)
}

export function selectedOption(plan: DraftPlan | undefined, strategy?: PlacementStrategy): PlacementOption | undefined
{
  if (!plan) return undefined
  return plan.options.find((o) => o.strategy === (strategy ?? plan.recommended)) ?? plan.options[0]
}

/** Resumo do lote: tempo total, gastos previstos, alertas e a carga dos próximos dias. */
export function summarizePlan(
  drafts: TaskPromptDraft[],
  plans: DraftPlan[],
  ctx: OrchestratorContext,
  chosen: Record<string, PlacementStrategy | undefined> = {},
): PlanSummary
{
  const ref = ctx.ref ?? new Date()
  const today = localTodayIso(ref)
  const load = buildDayLoad(ctx.openTasks, today, 6, (t) => taskEstimateFactor(ctx, t.titulo))
  const cap = capacityFn(ctx, today)
  let totalMinutes = 0
  let gastos = 0
  let alertas = 0
  for (const d of drafts)
  {
    const plan = plans.find((p) => p.key === d.key)
    const opt = selectedOption(plan, chosen[d.key])
    totalMinutes += d.estimativaMinutos
    if (d.financeiro?.tipo === 'despesa' && d.financeiro.valor) gastos += d.financeiro.valor
    alertas += plan?.signals.filter((s) => s.tone !== 'info').length ?? 0
    if (opt?.dataVencimento && opt.dataVencimento in load) load[opt.dataVencimento] += d.estimativaMinutos
  }
  const dias = Array.from({ length: 7 }, (_, i) =>
  {
    const iso = addDaysIso(today, i)
    return { iso, minutos: Math.round(load[iso] ?? 0), capacidade: cap(iso) }
  })
  return { count: drafts.length, totalMinutes, gastosPrevistos: gastos, alertas, dias }
}
