/**
 * Ritual da noite: "o que tenho amanhã?" → um amanhã do tamanho certo.
 *
 * Pensado para quem tem ansiedade, depressão ou dificuldade de organizar o dia:
 *  - o check-in (humor, energia, cabeça acelerada) decide o TAMANHO do dia (modo)
 *  - poucas coisas essenciais (1 a 3), cada uma com um primeiro passo de 2 minutos
 *  - o que não cabe "fica para depois" com data, sem culpa e sem vermelho
 *  - pausas e um cuidado entram na sequência, não são opcionais escondidos
 *  - nada some: "soltar" guarda em Intenções, não apaga
 * Linguagem: nunca "atrasada", "você precisa", "falhou". Não é ferramenta clínica.
 */
import type { MobileTask } from './tasks'
import { localTodayIso } from './dates'
import {
  addDaysIso,
  foldText,
  isTaskDeadlineRigid,
  parseTaskEnergy,
  type TaskEnergy,
  type TaskPromptDraft,
} from './taskPrompt'
import { buildDayLoad, describeDayPt, formatMinutesPt, taskEstimateFactor, type OrchestratorContext } from './taskOrchestrator'
import type { CalendarEvent } from './icsCalendar'

export type DayPlanMode = 'cuidado' | 'gentil' | 'normal'
export type AnxietyLevel = 0 | 1 | 2 | 3

export type EveningCheckin = {
  /** humor de agora, 1-5 */
  mood: number | null
  /** como a pessoa acha que vai acordar amanhã */
  energia: TaskEnergy
  /** 0 calma · 1 um pouco · 2 bastante · 3 muito acelerada */
  ansiedade: AnxietyLevel
}

export const ANXIETY_LABELS: Record<AnxietyLevel, string> = {
  0: 'Calma',
  1: 'Um pouco',
  2: 'Bastante',
  3: 'Muito',
}

export const DAY_PLAN_MODE_COPY: Record<DayPlanMode, {
  label: string
  hint: string
  essentials: number
  capacityFactor: number
  pauseMin: number
}> = {
  cuidado: {
    label: 'Dia de cuidado',
    hint: 'Uma coisa só, e cuidar de você. Isso já é um dia inteiro.',
    essentials: 1,
    capacityFactor: 0.35,
    pauseMin: 20,
  },
  gentil: {
    label: 'Dia gentil',
    hint: 'Poucas coisas, com pausas entre elas.',
    essentials: 2,
    capacityFactor: 0.6,
    pauseMin: 15,
  },
  normal: {
    label: 'Dia possível',
    hint: 'O essencial primeiro. O resto, se sobrar energia.',
    essentials: 3,
    capacityFactor: 1,
    pauseMin: 10,
  },
}

/** O check-in decide o tamanho do dia. Na dúvida, o modo mais leve. */
export function planModeFor(c: EveningCheckin): DayPlanMode
{
  const mood = c.mood ?? 3
  if (mood <= 1 || (c.ansiedade >= 3 && mood <= 2)) return 'cuidado'
  if (mood <= 2 || c.energia === 'baixa' || c.ansiedade >= 2) return 'gentil'
  return 'normal'
}

/** O que fazer com o que ficou de hoje (ou de antes). */
export type CarryDecision = 'amanha' | 'depois' | 'feito' | 'soltar'

export const CARRY_LABELS: Record<CarryDecision, string> = {
  amanha: 'Amanhã',
  depois: 'Mais pra frente',
  feito: 'Já fiz',
  soltar: 'Soltar',
}

export type PlanItemSource = 'novo' | 'amanha' | 'ficou'

export type PlanItem = {
  key: string
  taskId: string | null
  draftKey: string | null
  titulo: string
  minutos: number
  prioridade: 1 | 2 | 3
  rigid: boolean
  /** minutos desde 0h, se é compromisso com hora */
  hora: number | null
  energia: TaskEnergy
  source: PlanItemSource
  /** passo de ~2 minutos para vencer a inércia */
  firstStep: string
  why: string
}

export type LaterItem = { item: PlanItem; to: string; reason: string }

export type SequenceStep = {
  kind: 'tarefa' | 'pausa' | 'compromisso' | 'cuidado'
  label: string
  minutos: number
  /** minutos desde 0h (horário sugerido, não obrigatório) */
  inicio: number
  itemKey?: string
}

export type TomorrowPlan = {
  date: string
  mode: DayPlanMode
  capacity: number
  compromissos: PlanItem[]
  essentials: PlanItem[]
  ifEnergy: PlanItem[]
  later: LaterItem[]
  sequence: SequenceStep[]
  plannedMinutes: number
  selfCare: string
  message: string
  /** humor muito baixo + muita ansiedade: mostrar apoio (CVV 188) */
  showSupport: boolean
}

export type TomorrowPlanInput = {
  tasks: MobileTask[]
  drafts: TaskPromptDraft[]
  carry: Record<string, CarryDecision>
  checkin: EveningCheckin
  ctx: OrchestratorContext
  /** "Deixar mais leve": tira N essenciais do padrão do modo */
  lighter?: number
  /** eventos da agenda (.ics): os de amanhã entram como compromissos */
  events?: CalendarEvent[]
  ref?: Date
}

const SELF_CARE: Record<DayPlanMode, string[]> = {
  cuidado: [
    'Comer algo e beber um copo d’água',
    'Tomar um banho sem pressa',
    'Sair na janela ou na rua por 5 minutos',
    'Mandar mensagem para alguém de confiança',
  ],
  gentil: [
    'Beber água e respirar fundo 1 minuto',
    'Caminhar 5 minutos',
    'Alongar o pescoço e os ombros',
  ],
  normal: [
    'Uma pausa de verdade longe da tela',
    'Beber água',
  ],
}

// ---------------------------------------------------------------------------
// Primeiro passo de 2 minutos (ativação comportamental: começar é a parte mais difícil)
// ---------------------------------------------------------------------------

const TINY_STEPS: [RegExp, string][] = [
  [/\b(ligar|telefonar)\b/, 'Separar o número e ligar, só isso'],
  [/\b(pagar|boleto|fatura|conta)\b/, 'Abrir o app do banco'],
  [/\b(estudar|revisar|ler)\b/, 'Abrir o material e ler só o primeiro trecho'],
  [/\b(escrever|redigir|relatorio|tcc|artigo)\b/, 'Escrever uma frase, qualquer uma'],
  [/\b(limpar|arrumar|organizar|faxina)\b/, 'Arrumar só uma superfície'],
  [/\b(comprar|mercado)\b/, 'Anotar a lista no celular'],
  [/\b(email|e-mail|mandar|enviar|responder)\b/, 'Abrir a conversa e escrever a primeira linha'],
  [/\b(treinar|academia|caminhar|correr)\b/, 'Colocar a roupa e o tênis'],
  [/\b(marcar|agendar|consulta|medico|dentista)\b/, 'Achar o contato e salvar na tela inicial'],
  [/\b(cozinhar|almoco|jantar)\b/, 'Tirar os ingredientes da geladeira'],
]

export function firstTinyStep(titulo: string, checklist: { texto: string; feito: boolean }[] = []): string
{
  const pending = checklist.find((c) => !c.feito)
  if (pending) return pending.texto
  const f = foldText(titulo)
  for (const [re, step] of TINY_STEPS)
  {
    if (re.test(f)) return step
  }
  return `Começar por 2 minutos: ${titulo.charAt(0).toLowerCase()}${titulo.slice(1)}`
}

// ---------------------------------------------------------------------------

function fromTask(t: MobileTask, source: PlanItemSource): PlanItem
{
  const minutos = Math.max(5, Math.round((t.estimativaMinutos || 30) * (1 - (t.progresso || 0))))
  return {
    key: `t:${t.id}`,
    taskId: t.id,
    draftKey: null,
    titulo: t.titulo,
    minutos,
    prioridade: t.prioridade,
    rigid: isTaskDeadlineRigid(t.anotacao),
    hora: t.horaMinutos,
    energia: parseTaskEnergy(t.anotacao) ?? (minutos >= 90 ? 'alta' : minutos <= 15 ? 'baixa' : 'media'),
    source,
    firstStep: firstTinyStep(t.titulo, t.checklist),
    why: '',
  }
}

function fromDraft(d: TaskPromptDraft): PlanItem
{
  return {
    key: `d:${d.key}`,
    taskId: null,
    draftKey: d.key,
    titulo: d.titulo,
    minutos: d.estimativaMinutos,
    prioridade: d.prioridade,
    rigid: d.prazoRigido,
    hora: d.horaMinutos,
    energia: d.energia,
    source: 'novo',
    firstStep: firstTinyStep(d.titulo, d.checklist.map((texto) => ({ texto, feito: false }))),
    why: '',
  }
}

/** Decisão padrão para o que ficou de hoje: urgente vem para amanhã; o resto, conforme o modo. */
export function defaultCarryDecision(t: MobileTask, mode: DayPlanMode): CarryDecision
{
  if (t.prioridade === 1 || isTaskDeadlineRigid(t.anotacao)) return 'amanha'
  return mode === 'normal' ? 'amanha' : 'depois'
}

/** Tarefas abertas com data até hoje: o que "ficou" (nunca chamadas de atrasadas na tela). */
export function carryOverTasks(tasks: MobileTask[], ref = new Date()): MobileTask[]
{
  const today = localTodayIso(ref)
  return tasks.filter((t) =>
    t.status !== 'done'
    && t.dataVencimento
    && t.dataVencimento.slice(0, 10) <= today
    && t.horaMinutos == null)
}

function hhmm(min: number): string
{
  const h = Math.floor(min / 60) % 24
  const m = Math.round(min % 60)
  return `${h}:${String(m).padStart(2, '0')}`
}

export function formatHourPt(min: number): string
{
  return hhmm(min)
}

export function buildTomorrowPlan(input: TomorrowPlanInput): TomorrowPlan
{
  const ref = input.ref ?? new Date()
  const today = localTodayIso(ref)
  const tomorrow = addDaysIso(today, 1)
  const mode = planModeFor(input.checkin)
  const copy = DAY_PLAN_MODE_COPY[mode]
  const baseCap = input.ctx.capacityMinutes ?? 240
  const capacity = Math.max(30, Math.round(baseCap * copy.capacityFactor))
  const maxEssentials = Math.max(1, copy.essentials - (input.lighter ?? 0))
  const lowEnergy = mode !== 'normal' || input.checkin.energia === 'baixa'

  // ----- candidatos -----
  const open = input.tasks.filter((t) => t.status !== 'done')
  const items: PlanItem[] = []
  for (const t of open)
  {
    const day = t.dataVencimento?.slice(0, 10) ?? null
    if (day === tomorrow) items.push(fromTask(t, 'amanha'))
  }
  for (const t of carryOverTasks(open, ref))
  {
    const decision = input.carry[t.id] ?? defaultCarryDecision(t, mode)
    if (decision === 'amanha') items.push(fromTask(t, 'ficou'))
  }
  for (const d of input.drafts)
  {
    const due = d.dataVencimento
    const vague = !due && d.prioridade === 3
    if (!vague && (!due || due <= tomorrow)) items.push(fromDraft(d))
  }
  const carriedLater = carryOverTasks(open, ref).filter((t) =>
    (input.carry[t.id] ?? defaultCarryDecision(t, mode)) === 'depois')

  // ----- compromissos (hora marcada amanhã + agenda) entram sempre -----
  for (const e of input.events ?? [])
  {
    if (e.date !== tomorrow || !e.busy || e.inicio == null || e.fim == null) continue
    items.push({
      key: `e:${e.id}`,
      taskId: null,
      draftKey: null,
      titulo: e.titulo,
      minutos: Math.max(5, e.fim - e.inicio),
      prioridade: 2,
      rigid: false,
      hora: e.inicio,
      energia: 'media',
      source: 'amanha',
      firstStep: '',
      why: '',
    })
  }
  for (const i of items)
  {
    if (i.hora == null) i.minutos = Math.max(5, Math.round(i.minutos * taskEstimateFactor(input.ctx, i.titulo)))
  }
  const compromissos = items
    .filter((i) => i.hora != null)
    .sort((a, b) => (a.hora ?? 0) - (b.hora ?? 0))
    .map((i) => ({ ...i, why: `Compromisso às ${hhmm(i.hora!)}` }))
  const flexible = items.filter((i) => i.hora == null)
  let used = compromissos.reduce((s, i) => s + i.minutos, 0)

  const score = (i: PlanItem) =>
  {
    let s = 0
    if (i.rigid) s += 100
    if (i.prioridade === 1) s += 60
    else if (i.prioridade === 2) s += 25
    if (i.source === 'amanha') s += 20
    if (i.source === 'ficou') s += 15
    if (i.minutos <= 30) s += 10
    if (lowEnergy && i.energia === 'alta') s -= 15
    return s
  }
  const ranked = [...flexible].sort((a, b) => score(b) - score(a) || a.minutos - b.minutos)

  // ----- essenciais: prazo firme amanhã sempre entra; o resto até o limite do modo -----
  const essentials: PlanItem[] = []
  const rest: PlanItem[] = []
  for (const i of ranked)
  {
    const mustToday = i.rigid
    if (mustToday)
    {
      essentials.push({ ...i, why: i.source === 'ficou' ? 'Tinha prazo firme: vale resolver primeiro' : 'Tem prazo firme amanhã' })
      used += i.minutos
      continue
    }
    if (essentials.length < maxEssentials && used + i.minutos <= capacity)
    {
      const why = i.prioridade === 1
        ? 'É prioridade para você'
        : i.source === 'ficou'
          ? 'Ficou de hoje e cabe amanhã'
          : i.minutos <= 30
            ? 'Rápida: boa para começar o dia'
            : 'Cabe no seu dia'
      essentials.push({ ...i, why })
      used += i.minutos
      continue
    }
    rest.push(i)
  }

  // ----- "se sobrar energia": opcional, nunca cobrado -----
  const ifEnergyCap = mode === 'cuidado' ? 1 : mode === 'gentil' ? 2 : 4
  const ifEnergy: PlanItem[] = []
  const laterPool: PlanItem[] = []
  for (const i of rest)
  {
    const small = mode === 'cuidado' ? i.minutos <= 15 : true
    if (ifEnergy.length < ifEnergyCap && small && used + i.minutos <= capacity * 1.15)
    {
      ifEnergy.push({ ...i, why: 'Só se sobrar energia' })
      used += i.minutos
    }
    else
    {
      laterPool.push(i)
    }
  }

  // ----- fica para depois: primeiro dia com espaço, sem culpa -----
  const load = buildDayLoad(open, today, 21, (t) => taskEstimateFactor(input.ctx, t.titulo))
  const cap = baseCap
  const later: LaterItem[] = []
  const place = (item: PlanItem) =>
  {
    let to = addDaysIso(tomorrow, 1)
    for (let d = 2; d <= 21; d += 1)
    {
      const iso = addDaysIso(today, d)
      if ((load[iso] ?? 0) + item.minutos <= cap)
      {
        to = iso
        break
      }
    }
    load[to] = (load[to] ?? 0) + item.minutos
    later.push({
      item,
      to,
      reason: `Fica para ${describeDayPt(to, ref).toLowerCase()}. Não precisa caber tudo amanhã.`,
    })
  }
  laterPool.forEach(place)
  carriedLater.forEach((t) => place(fromTask(t, 'ficou')))

  // ----- sequência sugerida: começar pela vitória rápida quando o dia pede leveza -----
  const order = [...essentials]
  if (lowEnergy || input.checkin.ansiedade >= 2)
  {
    order.sort((a, b) => a.minutos - b.minutos)
  }
  else
  {
    // energia boa: o que exige mais foco na primeira hora
    order.sort((a, b) => (b.energia === 'alta' ? 1 : 0) - (a.energia === 'alta' ? 1 : 0))
  }
  const selfCareList = SELF_CARE[mode]
  const selfCare = selfCareList[(tomorrow.charCodeAt(9) + tomorrow.charCodeAt(8)) % selfCareList.length]
  const sequence: SequenceStep[] = []
  let clock = 9 * 60
  const pending = [...compromissos]
  const pushTask = (i: PlanItem, kind: SequenceStep['kind']) =>
  {
    sequence.push({ kind, label: i.titulo, minutos: i.minutos, inicio: clock, itemKey: i.key })
    clock += i.minutos
  }
  const flushCompromissos = () =>
  {
    while (pending.length && (pending[0].hora ?? 0) <= clock + 30)
    {
      const c = pending.shift()!
      clock = Math.max(clock, c.hora!)
      pushTask(c, 'compromisso')
    }
  }
  order.forEach((i, idx) =>
  {
    flushCompromissos()
    pushTask(i, 'tarefa')
    if (idx < order.length - 1 || mode !== 'normal')
    {
      const isCare = idx === 0 && mode !== 'normal'
      sequence.push({
        kind: isCare ? 'cuidado' : 'pausa',
        label: isCare ? selfCare : 'Pausa',
        minutos: copy.pauseMin,
        inicio: clock,
      })
      clock += copy.pauseMin
    }
  })
  while (pending.length)
  {
    const c = pending.shift()!
    clock = Math.max(clock, c.hora!)
    pushTask(c, 'compromisso')
  }
  if (mode === 'normal' && !sequence.some((s) => s.kind === 'cuidado'))
  {
    sequence.push({ kind: 'cuidado', label: selfCare, minutos: copy.pauseMin, inicio: clock })
  }

  const plannedMinutes = [...compromissos, ...essentials].reduce((s, i) => s + i.minutos, 0)
  const first = order[0]
  let message: string
  if (mode === 'cuidado')
  {
    message = first
      ? `Amanhã é dia de cuidado. Uma coisa só já é suficiente: ${first.titulo.toLowerCase()}. O resto pode esperar.`
      : 'Amanhã é dia de cuidado. Nenhuma tarefa é obrigatória: cuidar de você já conta.'
  }
  else if (mode === 'gentil')
  {
    message = first
      ? `Amanhã tem ${essentials.length === 1 ? '1 essencial' : `${essentials.length} essenciais`} com pausas entre eles. Comece pelo mais leve: ${first.titulo.toLowerCase()}.`
      : 'Amanhã está leve. Se quiser, escolha uma coisa pequena para começar.'
  }
  else
  {
    message = first
      ? `Amanhã: ${essentials.length === 1 ? '1 essencial' : `${essentials.length} essenciais`}, cerca de ${formatMinutesPt(plannedMinutes)}. Comece por ${first.titulo.toLowerCase()}.`
      : 'Amanhã está livre. Um bom dia para descansar ou adiantar algo pequeno.'
  }

  if (compromissos.length)
  {
    const c = compromissos.map((i) => `${i.titulo.toLowerCase()} às ${hhmm(i.hora!)}`)
    const list = c.length > 1 ? `${c.slice(0, -1).join(', ')} e ${c[c.length - 1]}` : c[0]
    message = first
      ? `${message} ${compromissos.length === 1 ? 'Compromisso marcado' : 'Compromissos marcados'}: ${list}.`
      : `Amanhã tem só ${compromissos.length === 1 ? 'um compromisso marcado' : 'compromissos marcados'}: ${list}. Fora ${compromissos.length === 1 ? 'dele' : 'deles'}, nada obrigatório.`
  }

  return {
    date: tomorrow,
    mode,
    capacity,
    compromissos,
    essentials,
    ifEnergy,
    later,
    sequence,
    plannedMinutes,
    selfCare,
    message,
    showSupport: (input.checkin.mood ?? 3) <= 1 || ((input.checkin.mood ?? 3) <= 2 && input.checkin.ansiedade >= 3),
  }
}
