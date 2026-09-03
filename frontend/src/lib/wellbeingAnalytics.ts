import type { HumorRegistro } from '../store/slices/bemEstarSlice'
import type { DiaHumorAgregado } from './moodInsights'
import { aggregateHumorByDay } from './moodInsights'
import type { MoodProfile } from './moodOrchestration'
import type { TarefaUnificada } from '../types'

const MAINTENANCE_TERMS = [
  'consulta',
  'alinhamento',
  'organizar',
  'email',
  'revisar',
  'ligar',
  'responder',
]

/** Pontua tarefas para Main Quest conforme humor do dia */
export function scoreTaskForMainQuest(
  task: TarefaUnificada,
  profile: MoodProfile,
): number
{
  const base = task.score_urgencia ?? 0
  const title = task.titulo.toLowerCase()
  const isMaintenance = MAINTENANCE_TERMS.some((t) => title.includes(t))

  if (profile === 'recuperacao')
  {
    let score = 100 - Math.abs(base - 50) * 1.2
    if (base > 85) score -= 45
    if (isMaintenance) score += 25
    if (base < 35) score += 10
    return score
  }

  if (profile === 'cuidado')
  {
    let score = 100 - Math.abs(base - 62) * 0.9
    if (base > 92) score -= 30
    if (isMaintenance) score += 15
    return score
  }

  if (profile === 'sem_registro')
  {
    return base * 0.92
  }

  if (profile === 'energizado')
  {
    return base + (base >= 80 ? 5 : 0)
  }

  return base
}

export function pickMainQuestCandidate(
  tarefas: TarefaUnificada[],
  profile: MoodProfile,
): TarefaUnificada | null
{
  const open = tarefas.filter((t) => t.status !== 'concluida')
  if (open.length === 0) return null

  if (profile === 'equilibrado' || profile === 'energizado')
  {
    return [...open].sort((a, b) => (b.score_urgencia ?? 0) - (a.score_urgencia ?? 0))[0]
  }

  return [...open].sort(
    (a, b) => scoreTaskForMainQuest(b, profile) - scoreTaskForMainQuest(a, profile),
  )[0]
}

export interface CorrelationInput
{
  humorMes: HumorRegistro[]
  humorPorDia: DiaHumorAgregado[]
  aguaPorDia: Record<string, number>
  aguaMeta: number
  treinoPorDia: Record<string, number>
  focoMinutosPorDia: Record<string, number>
  sonoPorDia?: Record<string, number>
}

export interface CorrelationResult
{
  insights: string[]
  dados: Array<{
    habito: string
    humor_medio_com: number
    humor_medio_geral: number
    diff_pct: number
    amostras: number
  }>
}

function media(nums: number[]): number
{
  if (nums.length === 0) return 0
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
}

function correlacaoHabito(
  humorPorDia: DiaHumorAgregado[],
  metricPorDia: Record<string, number>,
  threshold: (v: number) => boolean,
  label: string,
  labelCom: string,
): { insight?: string; dado?: CorrelationResult['dados'][0] }
{
  const geral = humorPorDia.map((d) => d.humor)
  const com: number[] = []
  const sem: number[] = []

  for (const dia of humorPorDia)
  {
    const m = metricPorDia[dia.data] ?? 0
    if (threshold(m)) com.push(dia.humor)
    else sem.push(dia.humor)
  }

  if (com.length < 2 || sem.length < 2) return {}

  const mediaCom = media(com)
  const mediaSem = media(sem)
  const mediaGeral = media(geral)
  const diff = mediaGeral > 0 ? Math.round(((mediaCom - mediaSem) / mediaGeral) * 100) : 0

  if (Math.abs(diff) < 8) return {}

  const insight = diff > 0
    ? `Nos dias com ${labelCom}, seu humor médio foi ${mediaCom}/5 (${diff > 0 ? '+' : ''}${diff}% vs dias sem).`
    : `Sem ${labelCom}, o humor tende a ser ${mediaSem}/5 - vale observar o padrão.`

  return {
    insight,
    dado: {
      habito: label,
      humor_medio_com: mediaCom,
      humor_medio_geral: mediaGeral,
      diff_pct: diff,
      amostras: com.length,
    },
  }
}

export function buildMoodCorrelations(input: CorrelationInput): CorrelationResult
{
  const humorPorDia = input.humorPorDia.length > 0
    ? input.humorPorDia
    : aggregateHumorByDay(input.humorMes)

  const insights: string[] = []
  const dados: CorrelationResult['dados'] = []

  const checks = [
    correlacaoHabito(
      humorPorDia,
      input.aguaPorDia,
      (c) => input.aguaMeta > 0 && c >= input.aguaMeta,
      'hidratação',
      'meta de água atingida',
    ),
    correlacaoHabito(
      humorPorDia,
      input.treinoPorDia,
      (t) => t >= 1,
      'treino',
      'treino registrado',
    ),
    correlacaoHabito(
      humorPorDia,
      input.focoMinutosPorDia,
      (f) => f >= 25,
      'foco',
      '25+ min de foco',
    ),
  ]

  if (input.sonoPorDia)
  {
    checks.push(
      correlacaoHabito(
        humorPorDia,
        input.sonoPorDia,
        (h) => h >= 7,
        'sono',
        '7h+ de sono',
      ),
    )
  }

  for (const c of checks)
  {
    if (c.insight) insights.push(c.insight)
    if (c.dado) dados.push(c.dado)
  }

  if (insights.length === 0 && humorPorDia.length >= 3)
  {
    insights.push('Continue registrando humor e hábitos - padrões aparecem com mais dias de dados.')
  }

  return { insights, dados }
}

export interface WeeklyReviewInput
{
  humorSemana: HumorRegistro[]
  tarefas: TarefaUnificada[]
  habitosPct: number
  despesasTotal: number
  focoMinutos: number
  correlacaoInsights: string[]
}

export interface WeeklyReviewResult
{
  semana: string
  humor_medio: number
  registros_humor: number
  tarefas_concluidas: number
  tarefas_criadas: number
  habitos_pct: number
  despesas_total: number
  foco_minutos: number
  insight_ia: string
}

function weekLabel(): string
{
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - 6)
  const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  return `${fmt(start)} - ${fmt(now)}`
}

export function buildWeeklyReview(input: WeeklyReviewInput): WeeklyReviewResult
{
  const agregados = aggregateHumorByDay(input.humorSemana)
  const humorMedia = agregados.length > 0
    ? media(agregados.map((d) => d.humor))
    : 0

  const seteDias = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  const recentTasks = input.tarefas.filter((t) =>
  {
    const d = (t.created_at || t.data_vencimento || '').slice(0, 10)
    return d >= seteDias
  })
  const concluidas = recentTasks.filter((t) => t.status === 'concluida').length

  let insight = ''
  if (humorMedia >= 4)
  {
    insight = 'Semana leve no conjunto. Mantenha o ritmo que funcionou - sem pressa de fazer mais.'
  }
  else if (humorMedia >= 3)
  {
    insight = 'Semana estável. Pequenos rituais (humor, água, uma tarefa por vez) sustentam o equilíbrio.'
  }
  else if (humorMedia > 0)
  {
    insight = 'Semana exigente. O AXEL já reduz carga quando você registra humor baixo - isso é cuidado, não falha.'
  }
  else
  {
    insight = 'Poucos registros de humor esta semana. Um toque por dia já ajuda o sistema a te acolher melhor.'
  }

  if (input.correlacaoInsights[0])
  {
    insight += ` ${input.correlacaoInsights[0]}`
  }

  return {
    semana: weekLabel(),
    humor_medio: humorMedia,
    registros_humor: input.humorSemana.length,
    tarefas_concluidas: concluidas,
    tarefas_criadas: recentTasks.length,
    habitos_pct: input.habitosPct,
    despesas_total: Math.round(input.despesasTotal * 100),
    foco_minutos: input.focoMinutos,
    insight_ia: insight,
  }
}
