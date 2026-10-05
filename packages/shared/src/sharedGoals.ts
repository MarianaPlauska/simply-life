import { addDaysIso, diffDaysIso, weekdayOfIso } from './taskPrompt'
import { foodKcalOfDay } from './foodLog'

/**
 * Metas juntos: tipos, textos e regras puras (docs/METAS_JUNTOS.md).
 *
 * Regra de ouro: o grupo nunca vê número de ninguém. O banco devolve só
 * faixa (0..4) ou ritmo; estas funções espelham a conta do SQL
 * (064_amigos_metas_juntos.sql) para testes e para a prévia no aparelho.
 */

export type SharedGoalMetrica =
  | 'agua'
  | 'treino'
  | 'proteina'
  | 'sono'
  | 'foco'
  | 'tarefas'
  | 'humor'
  | 'refeicoes'
  | 'acucar_ok'
  | 'corpo'
  | 'livre'

export type SharedGoalModo = 'pote' | 'cada_um'
export type SharedGoalExibicao = 'faixas' | 'ritmo'
export type SharedGoalCiclo = 'semanal' | 'total'
export type SharedGoalStatus = 'ativa' | 'encerrada'
export type SharedGoalRitmo = 'atras' | 'no_ritmo' | 'a_frente'
export type SharedGoalFaixa = 0 | 1 | 2 | 3 | 4

export type SharedGoal = {
  id: string
  createdBy: string
  titulo: string
  metrica: SharedGoalMetrica
  unidade: string
  alvo: number
  modo: SharedGoalModo
  exibicao: SharedGoalExibicao
  /** YYYY-MM-DD */
  inicio: string
  /** YYYY-MM-DD ou null (sem fim, ciclos semanais) */
  fim: string | null
  ciclo: SharedGoalCiclo
  status: SharedGoalStatus
  createdAt: string
}

/** O que a função shared_goal_progress devolve. Nada por pessoa. */
export type SharedGoalProgress = {
  exibicao: SharedGoalExibicao
  modo: SharedGoalModo
  faixa: SharedGoalFaixa | null
  ritmo: SharedGoalRitmo | null
  /** Só em "cada um": quantas pessoas estão no ritmo (nunca quem) */
  onPace: number | null
  members: number
  daysElapsed: number
  daysTotal: number
  cycleStart: string
  cycleEnd: string
  ended: boolean
  notStarted: boolean
}

export type SharedGoalMemberCard = {
  userId: string
  displayName: string
  accent: string
  avatarStyle: string
  role: 'owner' | 'member'
  isMe: boolean
}

export type SharedGoalCheer = {
  id: number
  goalId: string
  fromUser: string
  presetKey: SharedGoalCheerKey
  createdAt: string
}

export const SHARED_GOAL_MAX_MEMBERS = 5
export const SHARED_GOAL_CHEERS_PER_DAY = 3
/** Tolerância do ritmo: 15 pontos percentuais para cada lado do esperado */
export const SHARED_GOAL_PACE_TOLERANCE = 0.15

export type SharedGoalMetricaSpec = {
  key: SharedGoalMetrica
  label: string
  /** Unidade exibida no alvo; 'livre' usa a unidade escrita pela pessoa */
  unidade: string
  /** Frase curta do que conta */
  hint: string
  /** Alvo sugerido para uma semana, por pessoa */
  alvoSemana: number
  step: number
  /** Teto por dia (o banco recusa valores acima) */
  maxPorDia: number
}

export const SHARED_GOAL_METRICAS: readonly SharedGoalMetricaSpec[] = [
  { key: 'agua', label: 'Água', unidade: 'L', hint: 'Conta a água que cada um anota.', alvoSemana: 14, step: 1, maxPorDia: 15 },
  { key: 'treino', label: 'Treino', unidade: 'treinos', hint: 'Conta os treinos anotados.', alvoSemana: 3, step: 1, maxPorDia: 5 },
  { key: 'proteina', label: 'Proteína', unidade: 'g', hint: 'Conta a proteína anotada.', alvoSemana: 700, step: 50, maxPorDia: 600 },
  { key: 'sono', label: 'Sono', unidade: 'h', hint: 'Conta as horas de sono anotadas.', alvoSemana: 49, step: 1, maxPorDia: 24 },
  { key: 'foco', label: 'Foco', unidade: 'min', hint: 'Conta os minutos de foco.', alvoSemana: 150, step: 25, maxPorDia: 1440 },
  { key: 'tarefas', label: 'Tarefas', unidade: 'tarefas', hint: 'Conta as tarefas concluídas.', alvoSemana: 10, step: 1, maxPorDia: 100 },
  { key: 'humor', label: 'Humor', unidade: 'dias', hint: 'Conta os dias com humor registrado.', alvoSemana: 5, step: 1, maxPorDia: 1 },
  { key: 'refeicoes', label: 'Refeições', unidade: 'refeições', hint: 'Conta as refeições que cada um registra em Comida.', alvoSemana: 14, step: 1, maxPorDia: 6 },
  { key: 'acucar_ok', label: 'Açúcar no limite', unidade: 'dias', hint: 'Conta os dias com açúcar no seu limite. Cada um usa o próprio limite, definido em Comida.', alvoSemana: 5, step: 1, maxPorDia: 1 },
  { key: 'corpo', label: 'Cuidar do corpo', unidade: 'dias', hint: 'Conta os dias em que você cuidou do corpo: refeição, água, treino, sono ou proteína.', alvoSemana: 5, step: 1, maxPorDia: 1 },
  { key: 'livre', label: 'Algo livre', unidade: '', hint: 'Cada um registra o próprio dia na meta.', alvoSemana: 7, step: 1, maxPorDia: 100000 },
] as const

export function sharedGoalMetricaSpec(key: SharedGoalMetrica): SharedGoalMetricaSpec
{
  return SHARED_GOAL_METRICAS.find((m) => m.key === key) ?? SHARED_GOAL_METRICAS[SHARED_GOAL_METRICAS.length - 1]!
}

/**
 * Converte o total diário do hábito para a unidade da meta.
 * Água vem em ml e a meta fala em litros.
 */
export function sharedGoalValueFromHabit(metrica: SharedGoalMetrica, raw: number): number
{
  if (!Number.isFinite(raw) || raw <= 0) return 0
  if (metrica === 'agua') return Math.round((raw / 1000) * 100) / 100
  if (metrica === 'humor') return raw > 0 ? 1 : 0
  return Math.round(raw * 100) / 100
}

// ── Cuidar do corpo juntos ─────────────────────────────────────────
// Valores do dia calculados no aparelho de cada pessoa. O banco só recebe
// o número final (e limita por dia); o grupo continua vendo só faixa ou ritmo.

/** Métricas que vêm das refeições anotadas em Comida */
export const SHARED_GOAL_FOOD_METRICAS: readonly SharedGoalMetrica[] = ['refeicoes', 'acucar_ok', 'corpo'] as const

type SharedGoalMealLike = {
  data: string
  itens: { kcal?: number | null; proteina?: number | null; acucar?: number | null; fonte?: string | null }[]
}

/** Refeições registradas no dia, até o teto da métrica. */
export function sharedGoalMealsOfDay(meals: readonly { data: string }[], iso: string): number
{
  let n = 0
  for (const m of meals) if (m.data === iso) n += 1
  return Math.min(n, sharedGoalMetricaSpec('refeicoes').maxPorDia)
}

/**
 * "Açúcar no limite": 1 quando o dia tem refeição registrada, alguma estimativa
 * de açúcar e o total ficou dentro do limite que a própria pessoa escolheu.
 * Sem limite definido devolve null: a métrica não conta nada para ela.
 * Itens sem estimativa não pesam contra.
 */
export function sharedGoalSugarOkOfDay(meals: readonly SharedGoalMealLike[], iso: string, limite: number | null | undefined): 0 | 1 | null
{
  if (limite == null || !Number.isFinite(limite) || limite <= 0) return null
  const doDia = meals.filter((m) => m.data === iso)
  if (doDia.length === 0) return 0
  const day = foodKcalOfDay(doDia as SharedGoalMealLike[], iso)
  if (day.comAcucar === 0) return 0
  return day.acucar <= limite ? 1 : 0
}

export type SharedGoalBodyDayInput = {
  refeicoes?: number
  agua?: number
  treino?: number
  sono?: number
  proteina?: number
}

/** "Cuidar do corpo": 1 se o dia teve qualquer cuidado anotado. */
export function sharedGoalBodyCareOfDay(i: SharedGoalBodyDayInput): 0 | 1
{
  const vals = [i.refeicoes, i.agua, i.treino, i.sono, i.proteina]
  return vals.some((v) => typeof v === 'number' && Number.isFinite(v) && v > 0) ? 1 : 0
}

export type SharedGoalPreset = {
  key: string
  label: string
  hint: string
  metrica: SharedGoalMetrica
  modo: SharedGoalModo
  exibicao: SharedGoalExibicao
  /** alvo por semana (cada um) ou do pote por semana */
  alvoSemana: number
}

/** Atalhos de "Cuidar do corpo juntos" na tela de nova meta */
export const SHARED_GOAL_BODY_PRESETS: readonly SharedGoalPreset[] = [
  { key: 'corpo', label: 'Dias cuidando do corpo', hint: '5 dias por semana, cada um no seu ritmo', metrica: 'corpo', modo: 'cada_um', exibicao: 'ritmo', alvoSemana: 5 },
  { key: 'refeicoes', label: 'Refeições registradas', hint: 'Um pote de refeições para o grupo', metrica: 'refeicoes', modo: 'pote', exibicao: 'faixas', alvoSemana: 28 },
  { key: 'proteina', label: 'Proteína da semana', hint: 'Somando as refeições e o que anotam na Saúde', metrica: 'proteina', modo: 'pote', exibicao: 'faixas', alvoSemana: 1400 },
  { key: 'acucar_ok', label: 'Açúcar no limite', hint: 'Cada um com o próprio limite, sem comparar', metrica: 'acucar_ok', modo: 'cada_um', exibicao: 'ritmo', alvoSemana: 4 },
] as const

export type SharedGoalCheerKey = 'to_contigo' | 'bora_juntos' | 'orgulho' | 'um_passo' | 'descansa'

export const SHARED_GOAL_CHEERS: readonly { key: SharedGoalCheerKey; label: string }[] = [
  { key: 'to_contigo', label: 'Tô contigo' },
  { key: 'bora_juntos', label: 'Bora juntos' },
  { key: 'orgulho', label: 'Orgulho de você' },
  { key: 'um_passo', label: 'Um passo de cada vez' },
  { key: 'descansa', label: 'Descansa hoje, amanhã tem mais' },
] as const

export function sharedGoalCheerLabel(key: string): string
{
  return SHARED_GOAL_CHEERS.find((c) => c.key === key)?.label ?? 'Tô contigo'
}

export function isSharedGoalCheerKey(key: string): key is SharedGoalCheerKey
{
  return SHARED_GOAL_CHEERS.some((c) => c.key === key)
}

export const SHARED_GOAL_FAIXA_LABELS: Record<SharedGoalFaixa, string> = {
  0: 'Começando',
  1: 'Um quarto',
  2: 'Metade',
  3: 'Quase lá',
  4: 'Conseguimos',
}

export const SHARED_GOAL_RITMO_LABELS: Record<SharedGoalRitmo, string> = {
  atras: 'Um pouco atrás',
  no_ritmo: 'No ritmo',
  a_frente: 'Bem à frente',
}

/** Frase calma para o cartão (sem número, sem culpa). */
export function sharedGoalHeadline(p: Pick<SharedGoalProgress, 'modo' | 'exibicao' | 'faixa' | 'ritmo' | 'onPace' | 'members' | 'ended' | 'notStarted'>): string
{
  if (p.notStarted) return 'A meta começa em breve'
  if (p.modo === 'cada_um' && p.exibicao === 'ritmo')
  {
    const on = p.onPace ?? 0
    if (p.ended) return on === p.members ? 'Todo mundo chegou lá' : `${on} de ${p.members} chegaram no ritmo`
    return `${on} de ${p.members} no ritmo`
  }
  if (p.exibicao === 'faixas' && p.faixa != null)
  {
    if (p.ended) return sharedGoalEndSummary(p.faixa)
    if (p.faixa === 4) return 'Conseguimos juntos'
    if (p.faixa === 0) return 'Começando juntos'
    if (p.faixa === 3) return 'Quase lá, juntos'
    return `${SHARED_GOAL_FAIXA_LABELS[p.faixa]} do caminho`
  }
  if (p.ritmo === 'atras') return 'Um pouco atrás, e tudo bem'
  if (p.ritmo === 'a_frente') return 'Vocês estão bem à frente'
  return 'Vocês estão no ritmo'
}

/** Resumo do fim do período: "vocês chegaram a quase lá juntos". */
export function sharedGoalEndSummary(faixa: SharedGoalFaixa): string
{
  if (faixa === 4) return 'Vocês conseguiram juntos'
  if (faixa === 0) return 'Vocês começaram juntos, e começar conta'
  return `Vocês chegaram a ${SHARED_GOAL_FAIXA_LABELS[faixa].toLowerCase()} juntos`
}

/** Sugestão para o próximo ciclo a partir da faixa final (nunca cobra). */
export function suggestNextAlvo(alvo: number, faixa: SharedGoalFaixa): number
{
  const factor = faixa === 4 ? 1.1 : faixa === 3 ? 1 : faixa === 2 ? 0.8 : 0.6
  const next = alvo * factor
  return next >= 10 ? Math.round(next) : Math.max(1, Math.round(next * 2) / 2)
}

/* ── Contas puras (espelham o SQL) ─────────────────────────────── */

export function faixaFromRatio(ratio: number): SharedGoalFaixa
{
  if (!Number.isFinite(ratio) || ratio < 0.25) return 0
  if (ratio < 0.5) return 1
  if (ratio < 0.75) return 2
  if (ratio < 1) return 3
  return 4
}

/**
 * Fração esperada do alvo até hoje. Conta meio dia para hoje: logo cedo
 * ninguém fica "atrás".
 */
export function expectedPace(daysElapsed: number, daysTotal: number): number
{
  if (daysTotal <= 0) return 1
  const e = Math.min(Math.max(daysElapsed, 0), daysTotal)
  if (e >= daysTotal) return 1
  return Math.max(0, e - 0.5) / daysTotal
}

export function ritmoFromRatio(ratio: number, expected: number, tol = SHARED_GOAL_PACE_TOLERANCE): SharedGoalRitmo
{
  if (ratio >= 1) return 'a_frente'
  const diff = ratio - expected
  if (diff < -tol) return 'atras'
  if (diff > tol) return 'a_frente'
  return 'no_ritmo'
}

export function isOnPace(ratio: number, expected: number, tol = SHARED_GOAL_PACE_TOLERANCE): boolean
{
  return ratioOrZero(ratio) >= 1 || ratioOrZero(ratio) - expected >= -tol
}

function ratioOrZero(r: number): number
{
  return Number.isFinite(r) ? r : 0
}

/* ── Datas: addDaysIso, diffDaysIso e weekdayOfIso vêm de taskPrompt ── */

export type SharedGoalCycle = {
  start: string
  end: string
  daysTotal: number
  /** 1..daysTotal (hoje conta) */
  daysElapsed: number
  /** 0 no primeiro ciclo */
  index: number
  ended: boolean
  notStarted: boolean
}

/**
 * Ciclo atual. "total" é o período inteiro. "semanal" roda de 7 em 7 dias
 * a partir do início (toda semana é cheia, sem semana pela metade);
 * o último ciclo pode ser cortado pelo fim.
 */
export function sharedGoalCycle(
  goal: Pick<SharedGoal, 'inicio' | 'fim' | 'ciclo'>,
  today: string,
): SharedGoalCycle
{
  const inicio = goal.inicio
  if (diffDaysIso(inicio, today) < 0)
  {
    const end = goal.ciclo === 'total' && goal.fim ? goal.fim : addDaysIso(inicio, 6)
    return {
      start: inicio,
      end,
      daysTotal: diffDaysIso(inicio, end) + 1,
      daysElapsed: 0,
      index: 0,
      ended: false,
      notStarted: true,
    }
  }

  const ref = goal.fim && diffDaysIso(goal.fim, today) > 0 ? goal.fim : today
  const passedEnd = ref !== today

  let start: string
  let end: string
  let index = 0
  if (goal.ciclo === 'total' && goal.fim)
  {
    start = inicio
    end = goal.fim
  }
  else
  {
    index = Math.floor(diffDaysIso(inicio, ref) / 7)
    start = addDaysIso(inicio, index * 7)
    end = addDaysIso(start, 6)
    if (goal.fim && diffDaysIso(goal.fim, end) > 0) end = goal.fim
  }

  const daysTotal = diffDaysIso(start, end) + 1
  const daysElapsed = passedEnd ? daysTotal : Math.min(daysTotal, diffDaysIso(start, today) + 1)
  return {
    start,
    end,
    daysTotal,
    daysElapsed,
    index,
    ended: passedEnd,
    notStarted: false,
  }
}

/** Dias do ciclo até hoje (para preencher o que ainda não subiu). */
export function sharedGoalBackfillDays(cycle: SharedGoalCycle, today: string): string[]
{
  if (cycle.notStarted) return []
  const last = diffDaysIso(cycle.end, today) > 0 ? cycle.end : today
  const out: string[] = []
  for (let d = cycle.start; diffDaysIso(d, last) >= 0; d = addDaysIso(d, 1)) out.push(d)
  return out
}

export type SharedGoalDurationKey = 'esta_semana' | 'duas_semanas' | 'um_mes' | 'vinte_um' | 'datas' | 'sem_fim'

export const SHARED_GOAL_DURATIONS: readonly { key: SharedGoalDurationKey; label: string }[] = [
  { key: 'esta_semana', label: 'Esta semana' },
  { key: 'duas_semanas', label: '2 semanas' },
  { key: 'um_mes', label: 'Um mês' },
  { key: 'vinte_um', label: '21 dias' },
  { key: 'datas', label: 'Datas livres' },
  { key: 'sem_fim', label: 'Sem fim, toda semana' },
] as const

export function sharedGoalDuration(
  key: SharedGoalDurationKey,
  today: string,
  custom?: { inicio: string; fim: string },
): { inicio: string; fim: string | null; ciclo: SharedGoalCiclo }
{
  switch (key)
  {
    case 'esta_semana':
    {
      // até domingo; se faltar menos de 3 dias, vai até o domingo seguinte
      const toSunday = (7 - weekdayOfIso(today)) % 7
      const days = toSunday < 2 ? toSunday + 7 : toSunday
      return { inicio: today, fim: addDaysIso(today, days), ciclo: 'total' }
    }
    case 'duas_semanas':
      return { inicio: today, fim: addDaysIso(today, 13), ciclo: 'total' }
    case 'um_mes':
      return { inicio: today, fim: addDaysIso(today, 29), ciclo: 'total' }
    case 'vinte_um':
      return { inicio: today, fim: addDaysIso(today, 20), ciclo: 'total' }
    case 'sem_fim':
      return { inicio: today, fim: null, ciclo: 'semanal' }
    case 'datas':
    default:
    {
      const inicio = custom?.inicio ?? today
      const fim = custom?.fim ?? addDaysIso(inicio, 6)
      return { inicio, fim, ciclo: 'total' }
    }
  }
}

export type SharedGoalDraft = {
  titulo: string
  metrica: SharedGoalMetrica
  unidade: string
  alvo: number
  modo: SharedGoalModo
  exibicao: SharedGoalExibicao
  inicio: string
  fim: string | null
  ciclo: SharedGoalCiclo
}

export function validateSharedGoalDraft(d: SharedGoalDraft): string | null
{
  if (!d.titulo.trim()) return 'Dê um nome para a meta'
  if (d.titulo.trim().length > 60) return 'Nome com até 60 letras'
  if (!Number.isFinite(d.alvo) || d.alvo <= 0) return 'Escolha quanto querem alcançar'
  if (d.metrica === 'livre' && !d.unidade.trim()) return 'Diga o que vão contar (ex.: páginas)'
  if (d.fim && diffDaysIso(d.inicio, d.fim) < 0) return 'O fim precisa vir depois do início'
  if (d.fim && diffDaysIso(d.inicio, d.fim) > 365) return 'Até um ano por meta'
  if (!d.fim && d.ciclo !== 'semanal') return 'Meta sem fim roda em ciclos semanais'
  return null
}

/** Normaliza a linha do banco (snake_case) */
export function sharedGoalFromRow(r: Record<string, unknown>): SharedGoal
{
  return {
    id: String(r.id),
    createdBy: String(r.created_by ?? ''),
    titulo: String(r.titulo ?? ''),
    metrica: String(r.metrica ?? 'livre') as SharedGoalMetrica,
    unidade: String(r.unidade ?? ''),
    alvo: Number(r.alvo ?? 0),
    modo: (r.modo_contagem === 'cada_um' ? 'cada_um' : 'pote'),
    exibicao: (r.exibicao === 'ritmo' ? 'ritmo' : 'faixas'),
    inicio: String(r.inicio ?? '').slice(0, 10),
    fim: r.fim ? String(r.fim).slice(0, 10) : null,
    ciclo: (r.ciclo === 'semanal' ? 'semanal' : 'total'),
    status: (r.status === 'encerrada' ? 'encerrada' : 'ativa'),
    createdAt: String(r.created_at ?? ''),
  }
}

export function sharedGoalProgressFromRpc(raw: unknown): SharedGoalProgress | null
{
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (r.ok === false) return null
  const faixa = r.faixa == null ? null : Math.min(4, Math.max(0, Number(r.faixa))) as SharedGoalFaixa
  const ritmo = r.ritmo === 'atras' || r.ritmo === 'no_ritmo' || r.ritmo === 'a_frente' ? r.ritmo : null
  return {
    exibicao: r.exibicao === 'ritmo' ? 'ritmo' : 'faixas',
    modo: r.modo === 'cada_um' ? 'cada_um' : 'pote',
    faixa,
    ritmo,
    onPace: r.on_pace == null ? null : Number(r.on_pace),
    members: Number(r.members ?? 1),
    daysElapsed: Number(r.days_elapsed ?? 0),
    daysTotal: Number(r.days_total ?? 1),
    cycleStart: String(r.cycle_start ?? ''),
    cycleEnd: String(r.cycle_end ?? ''),
    ended: Boolean(r.ended),
    notStarted: Boolean(r.not_started),
  }
}

/** Texto do alvo: "10 L juntos na semana", "3 treinos cada um". */
export function sharedGoalAlvoLabel(g: Pick<SharedGoal, 'alvo' | 'unidade' | 'modo' | 'ciclo' | 'metrica'>): string
{
  const n = Number.isInteger(g.alvo) ? String(g.alvo) : String(g.alvo).replace('.', ',')
  const unit = g.unidade || sharedGoalMetricaSpec(g.metrica).unidade
  const quem = g.modo === 'pote' ? 'juntos' : 'cada um'
  const quando = g.ciclo === 'semanal' ? ' por semana' : ''
  return `${n} ${unit} ${quem}${quando}`.replace(/\s+/g, ' ').trim()
}
